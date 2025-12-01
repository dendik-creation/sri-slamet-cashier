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
        $root = rtrim(
            config("custom.syncthing.sync_path"),
            DIRECTORY_SEPARATOR,
        );
        if (!$this->isRootPathExist($root)) {
            $this->error("Path root sync tidak ditemukan");
            return Command::FAILURE;
        }

        $folders = glob($root . DIRECTORY_SEPARATOR . "*", GLOB_ONLYDIR);

        foreach ($folders as $dir) {
            $actionFile = $dir . DIRECTORY_SEPARATOR . "action.json";
            if (!file_exists($actionFile)) {
                continue;
            }

            $action = json_decode(file_get_contents($actionFile), true);
            $device_code = $this->getDeviceCodeByLocationTarget(
                $action["target"]["location"],
            );

            if (
                ($action["status"] ?? null) !== "PENDING" ||
                ($action["target"]["device_code"] ?? null) !== $device_code
            ) {
                continue;
            }

            try {
                // 1. Generate SQL DML UPSERT (SQLite)
                $sql = $this->generateSqlDml();

                // 2. Simpan ke file kasir_dml.sql di folder sinkronisasi
                $sqlFile = $dir . DIRECTORY_SEPARATOR . "kasir_dml.sql";
                file_put_contents($sqlFile, $sql);

                // 3. Update status → SYNCING (berarti: "file DML siap diambil admin")
                $action["status"] = "SYNCING";
                $action["time"]["syncing_at"] = now()->format("Y-m-d H:i:s");
                $action["error_message"] = null;

                file_put_contents(
                    $actionFile,
                    json_encode($action, JSON_PRETTY_PRINT),
                );

                Log::info(
                    "sync:kasir → SQL DML berhasil dibuat di folder: {$dir}",
                );
            } catch (\Throwable $e) {
                // Jika gagal membuat SQL → FAILED
                $action["status"] = "FAILED";
                $action["time"]["failed_at"] = now()->format("Y-m-d H:i:s");
                $action["error_message"] = $e->getMessage();

                file_put_contents(
                    $actionFile,
                    json_encode($action, JSON_PRETTY_PRINT),
                );

                Log::error(
                    "sync:kasir → Gagal membuat DML di folder {$dir}: {$e->getMessage()}",
                );
            }
        }

        return Command::SUCCESS;
    }

    private function generateSqlDml(): string
    {
        $sql = [];

        // 1) USERS
        $users = DB::table("users")->get();

        foreach ($users as $u) {
            $sql[] = "
            INSERT INTO users (id, username, name, role, password, created_at, updated_at)
            VALUES ({$u->id}, '{$u->username}', '{$u->name}', '{$u->role}', '{$u->password}',
                    '{$u->created_at}', '{$u->updated_at}')
            ON CONFLICT(username) DO NOTHING;
            ";
        }

        // 2) CUSTOMERS
        $customers = DB::table("customers")->get();

        foreach ($customers as $c) {
            $sql[] = "
            INSERT INTO customers (id, name, phone, address, created_at, updated_at)
            VALUES ({$c->id}, '{$c->name}', '{$c->phone}', '{$c->address}',
                    '{$c->created_at}', '{$c->updated_at}')
            ON CONFLICT(phone) DO NOTHING;
            ";
        }

        // 3) TRANSACTIONS
        $transactions = DB::table("transactions")->get();

        // agar items & payments tau transaksi mana yg ditulis
        $exportedTransactionIds = [];

        foreach ($transactions as $t) {
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
                '{$t->created_at}', '{$t->updated_at}'
                )
            ON CONFLICT(invoice_code) DO NOTHING;
            ";

            // simpan hanya transaksi yang berhasil di-export
            $exportedTransactionIds[] = $t->id;
        }

        // 4) TRANSACTION ITEMS
        $items = DB::table("transaction_items")->get();

        foreach ($items as $i) {
            // hanya kalau parent transaksi ikut diekspor
            if (!in_array($i->transaction_id, $exportedTransactionIds)) {
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
                 '{$i->created_at}', '{$i->updated_at}');
            ";
        }

        // 5) PAYMENTS
        $payments = DB::table("payments")->get();

        foreach ($payments as $p) {
            if (!in_array($p->transaction_id, $exportedTransactionIds)) {
                continue;
            }

            $sql[] =
                "
            INSERT INTO payments
                (id, transaction_id, recorded_by, method, amount, paid_at,
                 created_at, updated_at)
            VALUES
                ({$p->id}, {$p->transaction_id}, {$p->recorded_by}, '{$p->method}', {$p->amount},
                 " .
                ($p->paid_at ? "'{$p->paid_at}'" : "NULL") .
                ",
                '{$p->created_at}', '{$p->updated_at}');
            ";
        }

        return implode("\n", $sql);
    }
}
