<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncCashierData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = "app:sync-cashier";

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Kasir mengirim data terbaru untuk sinkronisasi ke admin";

    /**
     * Execute the console command.
     */
    private function isRootPathExist(string $root_path): bool
    {
        return is_dir($root_path) && file_exists($root_path);
    }
    private function getDeviceCodeByLocationTarget($location_target)
    {
        $device_codes = config("custom.syncthing.device_code");
        return match (strtolower($location_target)) {
            "north" => $device_codes["north"],
            "south" => $device_codes["south"],
            default => null,
        };
    }
    public function handle()
    {
        try {
            $root = rtrim(
                config("custom.syncthing.sync_path"),
                DIRECTORY_SEPARATOR,
            );
            if (!$this->isRootPathExist($root)) {
                Log::info(
                    "sync:cashier → Path root sync tidak ditemukan: {$root}",
                );
                return Command::SUCCESS;
            }

            $expected_location = strtolower(
                config("custom.syncthing.device_location"),
            );
            $folder = $root . DIRECTORY_SEPARATOR . $expected_location;
            $expected_action_path =
                $folder . DIRECTORY_SEPARATOR . "action.json";

            if (!file_exists($expected_action_path)) {
                Log::info(
                    "sync:cashier → Tidak ada action.json di folder: {$expected_location}",
                );
                return Command::SUCCESS;
            }

            $action = json_decode(
                file_get_contents($expected_action_path),
                true,
            );

            if (!\is_array($action)) {
                Log::error(
                    "sync:cashier → Format action.json tidak valid (bukan JSON object).",
                );
                return Command::SUCCESS;
            }

            $targetLocation = $action["target"]["location"] ?? null;
            if ($targetLocation !== strtoupper($expected_location)) {
                Log::error(
                    "sync:cashier → Lokasi target pada action.json tidak sesuai dengan folder sinkronisasi.",
                );
                return Command::SUCCESS;
            }

            $expected_device_code = $this->getDeviceCodeByLocationTarget(
                $expected_location,
            );
            $deviceCode = $action["target"]["device_code"] ?? null;
            if ($deviceCode !== $expected_device_code) {
                Log::error(
                    "sync:cashier → Device code pada action.json tidak sesuai dengan konfigurasi.",
                );
                return Command::SUCCESS;
            }

            $current_step = $action["current_step"] ?? 1;
            $action_records = $action["records"] ?? [];

            $current_record = null;
            if (\is_array($action_records) && !empty($action_records)) {
                $steps = array_column($action_records, "step");
                $index = array_search($current_step, $steps, true);
                if ($index !== false && isset($action_records[$index])) {
                    $current_record = $action_records[$index];
                }
            }

            if (
                !$current_record ||
                ($current_record["status"] ?? null) !== "PENDING"
            ) {
                Log::info(
                    "sync:cashier → Tidak ada record PENDING untuk step saat ini ({$current_step}).",
                );
                return Command::SUCCESS;
            }

            $sql_file_path = $folder . DIRECTORY_SEPARATOR . "data.sql";
            if (file_exists($sql_file_path)) {
                @unlink($sql_file_path);
            }

            $sql_dml = $this->generateSqlDml();
            file_put_contents($sql_file_path, $sql_dml);

            foreach ($action["records"] as &$record) {
                if (($record["step"] ?? null) === $current_step) {
                    $record["status"] = "SYNCING";
                    $record["time"]["syncing_at"] = date("Y-m-d H:i:s");
                    break;
                }
            }
            unset($record);

            file_put_contents(
                $expected_action_path,
                json_encode($action, JSON_PRETTY_PRINT),
            );

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            Log::error($e->getMessage());
            // Jangan gagal cron; tetap sukses agar scheduler tidak exit code 1
            return Command::SUCCESS;
        }
    }

    private function generateSqlDml(): string
    {
        $sql = [];

        // Helper quoting aman untuk SQLite (escape single quote)
        $q = function ($v) {
            if ($v === null) {
                return "NULL";
            }
            // boolean -> 0/1
            if (is_bool($v)) {
                return $v ? "1" : "0";
            }
            // angka -> as is
            if (is_int($v) || is_float($v)) {
                return (string) $v;
            }
            // Carbon/DateTime/object -> string
            $s = (string) $v;
            $s = str_replace("'", "''", $s);
            return "'{$s}'";
        };

        // =========================================================================
        // 0) Header + transaction wrapper
        // =========================================================================
        $sql[] = "PRAGMA foreign_keys=ON;";
        $sql[] = "BEGIN;";

        // =========================================================================
        // 1) USERS
        // Rule: conflict username => SKIP
        // IMPORTANT: jangan insert kolom id untuk menghindari bentrok PK di CENTRAL
        // =========================================================================
        $users = DB::table("users")
            ->select(
                "username",
                "name",
                "role",
                "password",
                "created_at",
                "updated_at",
            )
            ->get();

        foreach ($users as $u) {
            $sql[] = "
                INSERT INTO users (username, name, role, password, created_at, updated_at)
                VALUES (
                    {$q($u->username)},
                    {$q($u->name)},
                    {$q($u->role)},
                    {$q($u->password)},
                    {$q($u->created_at)},
                    {$q($u->updated_at)}
                )
                ON CONFLICT(username) DO NOTHING;
            ";
        }

        // =========================================================================
        // 2) CUSTOMERS
        // Rule: conflict slug => UPDATE
        // IMPORTANT: jangan insert id
        // =========================================================================
        $customers = DB::table("customers")
            ->select(
                "slug",
                "name",
                "phone",
                "address",
                "created_at",
                "updated_at",
            )
            ->get();

        foreach ($customers as $c) {
            $sql[] = "
                INSERT INTO customers (slug, name, phone, address, created_at, updated_at)
                VALUES (
                    {$q($c->slug)},
                    {$q($c->name)},
                    {$q($c->phone)},
                    {$q($c->address)},
                    {$q($c->created_at)},
                    {$q($c->updated_at)}
                )
                ON CONFLICT(slug) DO UPDATE SET
                    name = excluded.name,
                    phone = excluded.phone,
                    address = excluded.address,
                    updated_at = excluded.updated_at;
            ";
        }

        // =========================================================================
        // 3) TRANSACTIONS
        // Rule: conflict invoice_code => UPDATE
        // IMPORTANT:
        // - jangan insert id (biar CENTRAL id sendiri)
        // - cashier_id => map by username (SELECT id FROM users WHERE username=?)
        // - customer_id => map by slug (SELECT id FROM customers WHERE slug=?)
        // =========================================================================
        $transactions = DB::table("transactions")
            ->select(
                "invoice_code",
                "cashier_id",
                "customer_id",
                "order_at",
                "status",
                "subtotal",
                "tax_ppn",
                "total",
                "is_paid",
                "completed_at",
                "created_at",
                "updated_at",
            )
            ->get();

        // Untuk mapping, kita butuh data username cashier dan slug customer dari kasir
        // Ambil semua user dan customer ke map lokal
        $userMap = DB::table("users")->pluck("username", "id"); // [local_id => username]
        $custMap = DB::table("customers")->pluck("slug", "id"); // [local_id => slug]

        // Simpan invoice_code yang disertakan agar children (items/payments) bisa difilter
        $exportedInvoices = [];

        foreach ($transactions as $t) {
            $cashierUsername = $userMap[$t->cashier_id] ?? null;
            $customerSlug = $t->customer_id
                ? $custMap[$t->customer_id] ?? null
                : null;

            // cashier_id CENTRAL harus ada. Kalau tidak ada (harusnya ada), set NULL agar tidak error (atau bisa di-skip)
            $cashierIdSql = $cashierUsername
                ? "(SELECT id FROM users WHERE username = {$q(
                    $cashierUsername,
                )} LIMIT 1)"
                : "NULL";

            $customerIdSql = $customerSlug
                ? "(SELECT id FROM customers WHERE slug = {$q(
                    $customerSlug,
                )} LIMIT 1)"
                : "NULL";

            $sql[] =
                "
                INSERT INTO transactions (
                    invoice_code, cashier_id, customer_id, order_at, status,
                    subtotal, tax_ppn, total, is_paid, completed_at, created_at, updated_at
                )
                VALUES (
                    {$q($t->invoice_code)},
                    {$cashierIdSql},
                    {$customerIdSql},
                    {$q($t->order_at)},
                    {$q($t->status)},
                    {$q((int) $t->subtotal)},
                    {$q((int) $t->tax_ppn)},
                    {$q((int) $t->total)},
                    {$q((int) $t->is_paid)},
                    " .
                ($t->completed_at ? $q($t->completed_at) : "NULL") .
                ",
                    {$q($t->created_at)},
                    {$q($t->updated_at)}
                )
                ON CONFLICT(invoice_code) DO UPDATE SET
                    cashier_id = excluded.cashier_id,
                    customer_id = excluded.customer_id,
                    order_at = excluded.order_at,
                    status = excluded.status,
                    subtotal = excluded.subtotal,
                    tax_ppn = excluded.tax_ppn,
                    total = excluded.total,
                    is_paid = excluded.is_paid,
                    completed_at = excluded.completed_at,
                    updated_at = excluded.updated_at;
            ";

            $exportedInvoices[] = $t->invoice_code;
        }

        // =========================================================================
        // 4) TRANSACTION ITEMS & 5) PAYMENTS
        // Rule: ikut "update berdasarkan transaksi".
        // SOLUSI AMAN TANPA id_global:
        // - untuk setiap invoice yang diekspor:
        //   - DELETE semua items/payments milik transaksi itu di CENTRAL
        //   - INSERT ulang items/payments dari kasir, dengan transaction_id CENTRAL via invoice_code
        // =========================================================================

        if (!empty($exportedInvoices)) {
            // Buat set invoice untuk filter cepat
            $invoiceSet = array_flip($exportedInvoices);

            // Ambil semua transaksi kasir, kita butuh mapping local transaction_id => invoice_code
            $trxLocalMap = DB::table("transactions")->pluck(
                "invoice_code",
                "id",
            ); // [local_trx_id => invoice]

            // ---------- DELETE children per invoice ----------
            foreach ($exportedInvoices as $inv) {
                $trxIdCentral = "(SELECT id FROM transactions WHERE invoice_code = {$q(
                    $inv,
                )} LIMIT 1)";

                $sql[] = "DELETE FROM transaction_items WHERE transaction_id = {$trxIdCentral};";
                $sql[] = "DELETE FROM payments WHERE transaction_id = {$trxIdCentral};";
            }

            // ---------- INSERT ITEMS ----------
            $items = DB::table("transaction_items")
                ->select(
                    "transaction_id",
                    "description",
                    "line_total",
                    "status",
                    "refund_reason",
                    "created_at",
                    "updated_at",
                )
                ->get();

            foreach ($items as $i) {
                $inv = $trxLocalMap[$i->transaction_id] ?? null;
                if (!$inv || !isset($invoiceSet[$inv])) {
                    continue;
                }

                $trxIdCentral = "(SELECT id FROM transactions WHERE invoice_code = {$q(
                    $inv,
                )} LIMIT 1)";

                $sql[] =
                    "
                    INSERT INTO transaction_items (
                        transaction_id, description, line_total, status, refund_reason, created_at, updated_at
                    ) VALUES (
                        {$trxIdCentral},
                        {$q($i->description)},
                        {$q((int) $i->line_total)},
                        {$q($i->status)},
                        " .
                    ($i->refund_reason ? $q($i->refund_reason) : "NULL") .
                    ",
                        {$q($i->created_at)},
                        {$q($i->updated_at)}
                    );
                ";
            }

            // ---------- INSERT PAYMENTS ----------
            $payments = DB::table("payments")
                ->select(
                    "transaction_id",
                    "recorded_by",
                    "method",
                    "amount",
                    "paid_at",
                    "created_at",
                    "updated_at",
                )
                ->get();

            // recorded_by map local user_id => username
            $userLocalMap = DB::table("users")->pluck("username", "id");

            foreach ($payments as $p) {
                $inv = $trxLocalMap[$p->transaction_id] ?? null;
                if (!$inv || !isset($invoiceSet[$inv])) {
                    continue;
                }

                $trxIdCentral = "(SELECT id FROM transactions WHERE invoice_code = {$q(
                    $inv,
                )} LIMIT 1)";

                $recordedByUsername = $userLocalMap[$p->recorded_by] ?? null;
                $recordedByCentral = $recordedByUsername
                    ? "(SELECT id FROM users WHERE username = {$q(
                        $recordedByUsername,
                    )} LIMIT 1)"
                    : "NULL";

                $sql[] =
                    "
                    INSERT INTO payments (
                        transaction_id, recorded_by, method, amount, paid_at, created_at, updated_at
                    ) VALUES (
                        {$trxIdCentral},
                        {$recordedByCentral},
                        {$q($p->method)},
                        {$q((int) $p->amount)},
                        " .
                    ($p->paid_at ? $q($p->paid_at) : "NULL") .
                    ",
                        {$q($p->created_at)},
                        {$q($p->updated_at)}
                    );
                ";
            }
        }

        $sql[] = "COMMIT;";

        return implode("\n", $sql);
    }
}
