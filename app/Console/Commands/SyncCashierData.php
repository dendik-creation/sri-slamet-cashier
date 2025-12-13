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

        // =========================================================================
        // 1) USERS (conflict = username → UPDATE)
        // =========================================================================
        foreach (DB::table("users")->get() as $u) {
            $sql[] = "
            INSERT INTO users (id, username, name, role, password, created_at, updated_at)
            VALUES ({$u->id}, '{$u->username}', '{$u->name}', '{$u->role}', '{$u->password}',
                    '{$u->created_at}', '{$u->updated_at}')
            ON CONFLICT(username) DO UPDATE SET
                name = excluded.name,
                role = excluded.role,
                password = excluded.password,
                updated_at = excluded.updated_at;
            ";
        }

        // =========================================================================
        // 2) CUSTOMERS (conflict = id → UPDATE to avoid PK collision)
        // =========================================================================
        foreach (DB::table("customers")->get() as $c) {
            $sql[] = "
            INSERT INTO customers (id, name, phone, address, created_at, updated_at)
            VALUES ({$c->id}, '{$c->name}', '{$c->phone}', '{$c->address}',
                    '{$c->created_at}', '{$c->updated_at}')
            ON CONFLICT(phone) DO UPDATE SET
                name = excluded.name,
                phone = excluded.phone,
                address = excluded.address,
                updated_at = excluded.updated_at;
            ";
        }

        // =========================================================================
        // 3) TRANSACTIONS (conflict = id → UPDATE to prevent PK collision)
        // =========================================================================
        $exportedIds = [];

        foreach (DB::table("transactions")->get() as $t) {
            $sql[] =
                "
            INSERT INTO transactions
                (id, invoice_code, cashier_id, customer_id, order_at, status,
                 subtotal, tax_ppn, total, is_paid, completed_at, created_at, updated_at)
            VALUES
                ({$t->id}, '{$t->invoice_code}', {$t->cashier_id},
                 " .
                ($t->customer_id ?: "NULL") .
                ",
                 '{$t->order_at}', '{$t->status}', {$t->subtotal}, {$t->tax_ppn},
                 {$t->total}, {$t->is_paid},
                 " .
                ($t->completed_at ? "'{$t->completed_at}'" : "NULL") .
                ",
                 '{$t->created_at}', '{$t->updated_at}')
            ON CONFLICT(invoice_code) DO UPDATE SET
                invoice_code = excluded.invoice_code,
                cashier_id = excluded.cashier_id,
                customer_id = excluded.customer_id,
                order_at   = excluded.order_at,
                status     = excluded.status,
                subtotal   = excluded.subtotal,
                tax_ppn    = excluded.tax_ppn,
                total      = excluded.total,
                is_paid    = excluded.is_paid,
                completed_at = excluded.completed_at,
                updated_at = excluded.updated_at;
            ";

            $exportedIds[] = $t->id;
        }

        // =========================================================================
        // 4) TRANSACTION ITEMS  (conflict = PK id → UPDATE)
        // =========================================================================
        foreach (DB::table("transaction_items")->get() as $i) {
            if (!\in_array($i->transaction_id, $exportedIds)) {
                continue;
            }

            $sql[] =
                "
            INSERT INTO transaction_items
                (id, transaction_id, description, line_total, status,
                 refund_reason, created_at, updated_at)
            VALUES
                ({$i->id}, {$i->transaction_id}, '{$i->description}', {$i->line_total},
                 '{$i->status}', " .
                ($i->refund_reason ? "'{$i->refund_reason}'" : "NULL") .
                ",
                 '{$i->created_at}', '{$i->updated_at}')
            ON CONFLICT(id) DO UPDATE SET
                transaction_id = excluded.transaction_id,
                description = excluded.description,
                line_total = excluded.line_total,
                status = excluded.status,
                refund_reason = excluded.refund_reason,
                updated_at = excluded.updated_at;
            ";
        }

        // =========================================================================
        // 5) PAYMENTS  (conflict = PK id → UPDATE)
        // =========================================================================
        foreach (DB::table("payments")->get() as $p) {
            if (!\in_array($p->transaction_id, $exportedIds)) {
                continue;
            }

            $sql[] =
                "
            INSERT INTO payments
                (id, transaction_id, recorded_by, method, amount, paid_at,
                 created_at, updated_at)
            VALUES
                ({$p->id}, {$p->transaction_id}, {$p->recorded_by}, '{$p->method}',
                 {$p->amount}, " .
                ($p->paid_at ? "'{$p->paid_at}'" : "NULL") .
                ",
                 '{$p->created_at}', '{$p->updated_at}')
            ON CONFLICT(id) DO UPDATE SET
                transaction_id = excluded.transaction_id,
                recorded_by    = excluded.recorded_by,
                method         = excluded.method,
                amount         = excluded.amount,
                paid_at        = excluded.paid_at,
                updated_at     = excluded.updated_at;
            ";
        }

        return implode("\n", $sql);
    }
}
