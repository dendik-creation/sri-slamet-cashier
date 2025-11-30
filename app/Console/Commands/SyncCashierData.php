<?php

namespace App\Console\Commands;

use App\Models\AppSetting;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;
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
    private function getDeviceCodeByCashier(User $cashier)
    {
        $cashier_username = $cashier->username;
        $cashier_target = explode("_", $cashier_username)[1];

        $device_code_kasir_1 = config("custom.syncthing.kasir1.device_code");
        $device_code_kasir_2 = config("custom.syncthing.kasir2.device_code");

        return match ($cashier_target) {
            "1" => $device_code_kasir_1,
            "2" => $device_code_kasir_2,
            default => null,
        };
    }
    public function handle()
    {
        $root = rtrim(
            config("custom.syncthing.sync_path"),
            DIRECTORY_SEPARATOR,
        );

        $folders = glob($root . DIRECTORY_SEPARATOR . "*", GLOB_ONLYDIR);

        foreach ($folders as $dir) {
            $actionFile = $dir . DIRECTORY_SEPARATOR . "action.json";
            if (!file_exists($actionFile)) {
                continue;
            }

            $action = json_decode(file_get_contents($actionFile), true);
            $user = User::where(
                "username",
                $action["request_to_username"],
            )->first();
            $device_code = $this->getDeviceCodeByCashier($user);

            if (
                ($action["status"] ?? null) !== "PENDING" ||
                ($action["device_code"] ?? null) !== $device_code
            ) {
                continue;
            }

            try {
                // 1. Generate SQL DML UPSERT (SQLite)
                $sql = $this->generateDMLSQL();

                // 2. Simpan ke file kasir_dml.sql di folder sinkronisasi
                $sqlFile = $dir . DIRECTORY_SEPARATOR . "kasir_dml.sql";
                file_put_contents($sqlFile, $sql);

                // 3. Update status → SYNCING (berarti: "file DML siap diambil admin")
                $action["status"] = "SYNCING";
                $action["respond_at"] = now()->format("Y-m-d H:i:s"); // waktu kasir merespon
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
                $action["respond_at"] = now()->format("Y-m-d H:i:s");
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

    private function generateDMLSQL(): string
    {
        $sqlStatements = [];

        // 1) USERS
        $users = DB::table("users")->get();
        foreach ($users as $u) {
            $sqlStatements[] =
                "
            INSERT INTO users (id, username, name, role, password, created_at, updated_at, deleted_at)
            VALUES ({$u->id}, '{$u->username}', '{$u->name}', '{$u->role}', '{$u->password}',
                    '{$u->created_at}', '{$u->updated_at}', " .
                ($u->deleted_at ? "'{$u->deleted_at}'" : "NULL") .
                ")
            ON CONFLICT(id) DO UPDATE SET
                username = excluded.username,
                name = excluded.name,
                role = excluded.role,
                password = excluded.password,
                updated_at = excluded.updated_at,
                deleted_at = excluded.deleted_at;
            ";
        }

        // 2) CUSTOMERS
        $customers = DB::table("customers")->get();
        foreach ($customers as $c) {
            $sqlStatements[] =
                "
            INSERT INTO customers (id, name, phone, address, created_at, updated_at, deleted_at)
            VALUES ({$c->id}, '{$c->name}', '{$c->phone}', '{$c->address}',
                    '{$c->created_at}', '{$c->updated_at}', " .
                ($c->deleted_at ? "'{$c->deleted_at}'" : "NULL") .
                ")
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                phone = excluded.phone,
                address = excluded.address,
                updated_at = excluded.updated_at,
                deleted_at = excluded.deleted_at;
            ";
        }

        // 3) TRANSACTIONS
        $transactions = DB::table("transactions")->get();
        foreach ($transactions as $t) {
            $sqlStatements[] =
                "
            INSERT INTO transactions
                (id, invoice_code, cashier_id, customer_id, order_at, status, subtotal, tax_ppn, total,
                is_paid, completed_at, created_at, updated_at, deleted_at)
            VALUES
                ({$t->id}, '{$t->invoice_code}', {$t->cashier_id}, " .
                ($t->customer_id ?: "NULL") .
                ",
                 '{$t->order_at}', '{$t->status}', {$t->subtotal}, {$t->tax_ppn}, {$t->total},
                 {$t->is_paid}, " .
                ($t->completed_at ? "'{$t->completed_at}'" : "NULL") .
                ",
                 '{$t->created_at}', '{$t->updated_at}', " .
                ($t->deleted_at ? "'{$t->deleted_at}'" : "NULL") .
                ")
            ON CONFLICT(id) DO UPDATE SET
                invoice_code = excluded.invoice_code,
                cashier_id = excluded.cashier_id,
                customer_id = excluded.customer_id,
                order_at = excluded.order_at,
                status = excluded.status,
                subtotal = excluded.subtotal,
                tax_ppn = excluded.tax_ppn,
                total = excluded.total,
                is_paid = excluded.is_paid,
                completed_at = excluded.completed_at,
                updated_at = excluded.updated_at,
                deleted_at = excluded.deleted_at;
            ";
        }

        // 4) TRANSACTION ITEMS
        $items = DB::table("transaction_items")->get();
        foreach ($items as $i) {
            $sqlStatements[] =
                "
            INSERT INTO transaction_items
                (id, transaction_id, description, line_total, status, refund_reason,
                 created_at, updated_at, deleted_at)
            VALUES
                ({$i->id}, {$i->transaction_id}, '{$i->description}', {$i->line_total},
                 '{$i->status}', " .
                ($i->refund_reason ? "'{$i->refund_reason}'" : "NULL") .
                ",
                 '{$i->created_at}', '{$i->updated_at}', " .
                ($i->deleted_at ? "'{$i->deleted_at}'" : "NULL") .
                ")
            ON CONFLICT(id) DO UPDATE SET
                transaction_id = excluded.transaction_id,
                description = excluded.description,
                line_total = excluded.line_total,
                status = excluded.status,
                refund_reason = excluded.refund_reason,
                updated_at = excluded.updated_at,
                deleted_at = excluded.deleted_at;
            ";
        }

        // 5) PAYMENTS
        $payments = DB::table("payments")->get();
        foreach ($payments as $p) {
            $sqlStatements[] =
                "
            INSERT INTO payments
                (id, transaction_id, recorded_by, method, amount, paid_at,
                 created_at, updated_at, deleted_at)
            VALUES
                ({$p->id}, {$p->transaction_id}, {$p->recorded_by}, '{$p->method}', {$p->amount},
                 " .
                ($p->paid_at ? "'{$p->paid_at}'" : "NULL") .
                ",
                 '{$p->created_at}', '{$p->updated_at}', " .
                ($p->deleted_at ? "'{$p->deleted_at}'" : "NULL") .
                ")
            ON CONFLICT(id) DO UPDATE SET
                transaction_id = excluded.transaction_id,
                recorded_by = excluded.recorded_by,
                method = excluded.method,
                amount = excluded.amount,
                paid_at = excluded.paid_at,
                updated_at = excluded.updated_at,
                deleted_at = excluded.deleted_at;
            ";
        }

        return implode("\n", $sqlStatements);
    }
}
