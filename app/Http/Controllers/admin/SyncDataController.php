<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class SyncDataController extends Controller
{
    public const array SYNC_STATUSES = [
        "PENDING",
        "SYNCING",
        "COMPLETED",
        "FAILED",
    ];

    private function humanizeLocationTarget($location_target)
    {
        return match (strtolower($location_target)) {
            "north" => "Bengkel Utara",
            "south" => "Bengkel Selatan",
            default => "Lokasi Tidak Dikenal",
        };
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

    public function index()
    {
        $root_path = rtrim(
            config("custom.syncthing.sync_path"),
            DIRECTORY_SEPARATOR,
        );
        $directories = glob(
            $root_path . DIRECTORY_SEPARATOR . "*",
            GLOB_ONLYDIR,
        );
        $sync_folders = [];
        foreach ($directories as $directory) {
            $action_file = $directory . DIRECTORY_SEPARATOR . "action.json";
            if (file_exists($action_file)) {
                $action = json_decode(file_get_contents($action_file), true);
                $action["current_record"] = null;
                $records = $action["records"] ?? [];
                if (is_array($records) && !empty($records)) {
                    $steps = array_column($records, "step");
                    $index = array_search(
                        $action["current_step"],
                        $steps,
                        true,
                    );
                    if ($index !== false) {
                        $action["current_record"] = $records[$index];
                    }
                }
                $sync_folders[] = $action;
            }
        }
        return Inertia::render("Admin/SyncData/Index", [
            "title" => "Sinkronisasi Data",
            "description" =>
                "Sinkronisasi data dari kasir ke admin yang Anda pegang",
            "sync_folders" => $sync_folders,
        ]);
    }

    public function syncStatus(Request $request)
    {
        $validated = $request->validate([
            "folder_name" => "required",
        ]);
        $folder_name = $validated["folder_name"];
        $directory_path =
            config("custom.syncthing.sync_path") .
            DIRECTORY_SEPARATOR .
            $folder_name;
        $action_file = $directory_path . DIRECTORY_SEPARATOR . "action.json";
        $action = json_decode(file_get_contents($action_file), true);
        $current_step = $action["current_step"] ?? 1;
        $records = $action["records"] ?? [];
        $latest_record = null;
        if (is_array($records) && !empty($records)) {
            $steps = array_column($records, "step");
            $index = array_search($current_step, $steps, true);
            if ($index !== false) {
                $latest_record = $records[$index];
            }
        }
        $action["current_record"] = $latest_record;
        return response()->json($action);
    }

    public function sync(Request $request)
    {
        $validated = $request->validate(
            [
                "location_target" => "required",
            ],
            [
                "location_target.required" => "Target bengkel wajib diisi.",
            ],
        );

        $location_target = $validated["location_target"];
        // Get folder path
        $root_path = rtrim(
            config("custom.syncthing.sync_path"),
            DIRECTORY_SEPARATOR,
        );
        $folder_name = strtolower($location_target);
        $full_path = $root_path . DIRECTORY_SEPARATOR . $folder_name;

        // Create folder north or south if not exists
        if (!file_exists($full_path)) {
            mkdir($full_path, 0777, true);
        }

        $current_step = 1;
        $action_file = $full_path . DIRECTORY_SEPARATOR . "action.json";

        if (file_exists($action_file)) {
            // Read existing action.json
            $existing_action = json_decode(
                file_get_contents($action_file),
                true,
            );

            // Determine new current_step
            $current_step =
                isset($existing_action["current_step"]) &&
                is_numeric($existing_action["current_step"])
                    ? (int) $existing_action["current_step"] + 1
                    : 1;

            // Ensure records is an array; initialize if missing or invalid
            $records = [];
            if (
                isset($existing_action["records"]) &&
                is_array($existing_action["records"])
            ) {
                $records = $existing_action["records"];
            }

            // Push new record
            $records[] = [
                "step" => $current_step,
                "time" => [
                    "pending_at" => now()->format("Y-m-d H:i:s"),
                    "syncing_at" => null,
                    "completed_at" => null,
                    "failed_at" => null,
                ],
                "status" => "PENDING",
                "error_message" => null,
            ];

            // Update action structure
            $action = $existing_action;
            $action["folder_name"] = $folder_name;
            $action["current_step"] = $current_step;
            $action["target"] = [
                "name" => $this->humanizeLocationTarget($location_target),
                "location" => $location_target,
                "device_code" => $this->getDeviceCodeByLocationTarget(
                    $location_target,
                ),
            ];
            $action["records"] = $records;
        } else {
            // Create new action.json
            $current_step = 1;
            $action = [
                "folder_name" => $folder_name,
                "current_step" => $current_step,
                "target" => [
                    "name" => $this->humanizeLocationTarget($location_target),
                    "location" => $location_target,
                    "device_code" => $this->getDeviceCodeByLocationTarget(
                        $location_target,
                    ),
                ],
                "records" => [
                    [
                        "step" => $current_step,
                        "time" => [
                            "pending_at" => now()->format("Y-m-d H:i:s"),
                            "syncing_at" => null,
                            "completed_at" => null,
                            "failed_at" => null,
                        ],
                        "status" => "PENDING",
                        "error_message" => null,
                    ],
                ],
            ];
        }

        // Write to action.json
        file_put_contents(
            $action_file,
            json_encode($action, JSON_PRETTY_PRINT),
        );

        Session::flash(
            "success",
            "Permintaan sinkronisasi data berhasil dikirim.",
        );
        return Inertia::location(route("admin.sync-data.index"));
    }
}
