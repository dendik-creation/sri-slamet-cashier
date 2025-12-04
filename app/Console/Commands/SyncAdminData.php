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
        $locations = ["north", "south"];
        foreach ($locations as $location) {
            $folder = $root . DIRECTORY_SEPARATOR . $location;
            $expected_action_path =
                $folder . DIRECTORY_SEPARATOR . "action.json";
            $expected_sql_dqml_path =
                $folder . DIRECTORY_SEPARATOR . "data.sql";
            try {
                // if sql dqml file exists
                if (!file_exists($expected_sql_dqml_path)) {
                    throw new \RuntimeException(
                        "sync:admin → Tidak ada data.sql di folder: {$location}",
                    );
                }
                $action = json_decode(
                    file_get_contents($expected_action_path),
                    true,
                );
                $current_step = $action["current_step"] ?? null;
                $action_records = $action["records"] ?? [];
                $current_record = null;
                if (is_array($action_records) && !empty($action_records)) {
                    $steps = array_column($action_records, "step");
                    $index = array_search($current_step, $steps, true);
                    if ($index !== false) {
                        $current_record = $action_records[$index];
                    }
                }
                // if current record not found
                if ($current_record === null) {
                    throw new \RuntimeException(
                        "sync:admin : Tidak ada record sinkronisasi yang sesuai di action.json untuk folder: {$location}",
                    );
                }
                // validate syncing status current record
                if ($current_record["status"] !== "SYNCING") {
                    throw new \RuntimeException(
                        "sync:admin : Status sinkronisasi saat ini bukan SYNCING untuk folder: {$location}",
                    );
                }
                // Execute SQL DQML
                $sql_content = file_get_contents($expected_sql_dqml_path);
                $executed = DB::unprepared($sql_content);
                if ($executed === false) {
                    throw new \RuntimeException(
                        "sync:admin → Eksekusi SQL data.sql gagal untuk folder: {$location}",
                    );
                }
                // Update action.json status to COMPLETED
                $action["records"][$index]["status"] = "COMPLETED";
                $action["records"][$index]["completed_at"] = date(
                    "Y-m-d H:i:s",
                );
                // Save action.json
                file_put_contents(
                    $expected_action_path,
                    json_encode($action, JSON_PRETTY_PRINT),
                );
                // Remove data.sql file
                unlink($expected_sql_dqml_path);
            } catch (\Exception $e) {
                Log::error("sync:admin : " . $e->getMessage());
                // update action.json status to FAILED
                if (isset($action) && isset($index)) {
                    $action["records"][$index]["status"] = "FAILED";
                    $action["records"][$index]["failed_at"] = date(
                        "Y-m-d H:i:s",
                    );
                    $action["records"][$index][
                        "error_message"
                    ] = $e->getMessage();
                    // Save action.json
                    file_put_contents(
                        $expected_action_path,
                        json_encode($action, JSON_PRETTY_PRINT),
                    );
                }
                continue;
            }
        }

        return Command::SUCCESS;
    }
}
