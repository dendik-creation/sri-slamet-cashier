<?php

namespace App\Console\Commands;

use App\Models\AppSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncAdminData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = "app:sync-admin";

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Admin meminta sinkronisasi dari beberapa kasir sekaligus";

    /**
     * Execute the console command.
     */
    private function isRootPathExist(string $root_path): bool
    {
        return is_dir($root_path) && file_exists($root_path);
    }
    public function handle()
    {
        $root = rtrim(
            config("custom.syncthing.sync_path"),
            DIRECTORY_SEPARATOR,
        );

        if (!$this->isRootPathExist($root)) {
            Log::error("sync:admin → Path root sync tidak ditemukan");
            return Command::INVALID;
        }

        $folders = glob($root . DIRECTORY_SEPARATOR . "*", GLOB_ONLYDIR);

        foreach ($folders as $dir) {
            $actionFile = $dir . DIRECTORY_SEPARATOR . "action.json";
            $sqlFile = $dir . DIRECTORY_SEPARATOR . "kasir_dml.sql";

            if (!file_exists($actionFile) || !file_exists($sqlFile)) {
                continue;
            }

            $action = json_decode(file_get_contents($actionFile), true);
            $status = $action["status"] ?? null;

            if ($status !== "SYNCING") {
                continue;
            }

            if (
                !isset($action["target"]["device_code"]) ||
                empty($action["target"]["device_code"])
            ) {
                Log::warning(
                    "sync:admin → kode perangkat tidak di set pada folder: {$dir}",
                );
                continue;
            }

            try {
                $sql = file_get_contents($sqlFile);

                DB::unprepared($sql);
                $action["status"] = "COMPLETED";
                $action["time"]["completed_at"] = now()->format("Y-m-d H:i:s");
                $action["error_message"] = null;

                file_put_contents(
                    $actionFile,
                    json_encode($action, JSON_PRETTY_PRINT),
                );

                Log::info(
                    "sync:admin → Import DML berhasil dari folder: {$dir}",
                );
            } catch (\Throwable $e) {
                // Jika gagal eksekusi SQL → FAILED (di sisi admin)
                $action["status"] = "FAILED";
                $action["time"]["failed_at"] = now()->format("Y-m-d H:i:s");
                $action["error_message"] = $e->getMessage();

                file_put_contents(
                    $actionFile,
                    json_encode($action, JSON_PRETTY_PRINT),
                );

                Log::error(
                    "sync:admin → Gagal import DML dari folder {$dir}: {$e->getMessage()}",
                );
            }
        }

        return Command::SUCCESS;
    }
}
