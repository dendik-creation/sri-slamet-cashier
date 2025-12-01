<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\User;
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
        foreach ($directories as $dir) {
            $folder_name = basename($dir);
            if (
                !preg_match(
                    '/^\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}$/',
                    $folder_name,
                )
            ) {
                continue;
            }
            $action_file = $dir . DIRECTORY_SEPARATOR . "action.json";
            if (!file_exists($action_file)) {
                continue;
            }
            $action = json_decode(file_get_contents($action_file), true);

            // Meta Data
            $pending_at = $action["time"]["pending_at"] ?? null;
            $syncing_at = $action["time"]["syncing_at"] ?? null;
            $completed_at = $action["time"]["completed_at"] ?? null;
            $target_name = $action["target"]["name"] ?? null;
            $device_code = $action["target"]["device_code"] ?? null;
            $status = $action["status"] ?? null;
            $error_message =
                $status === "FAILED"
                    ? $action["error_message"] ?? "Unknown Error"
                    : null;

            $sync_folders[] = [
                "folder_name" => $folder_name,
                "status" => $status,
                "time" => [
                    "pending_at" => $pending_at,
                    "syncing_at" => $syncing_at,
                    "completed_at" => $completed_at,
                ],
                "target" => [
                    "name" => $target_name,
                    "device_code" => $device_code,
                ],
                "error_message" => $error_message,
            ];
        }

        usort(
            $sync_folders,
            fn($a, $b) => strcmp($b["folder_name"], $a["folder_name"]),
        );

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
        sleep(2);
        $folder_name = $validated["folder_name"];
        $directory_path =
            config("custom.syncthing.sync_path") .
            DIRECTORY_SEPARATOR .
            $folder_name;
        $action_file = $directory_path . DIRECTORY_SEPARATOR . "action.json";
        $action = json_decode(file_get_contents($action_file), true);
        return response()->json([
            "status" => $action["status"],
            "time" => $action["time"],
            "target" => $action["target"],
            "folder_name" => $action["folder_name"],
            "error_message" => $action["error_message"],
        ]);
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

        // Get folder path
        $root_path = rtrim(
            config("custom.syncthing.sync_path"),
            DIRECTORY_SEPARATOR,
        );
        $folder_name = now()->format("Y_m_d_H_i_s");
        $full_path = $root_path . DIRECTORY_SEPARATOR . $folder_name;

        // Create folder
        if (!file_exists($full_path)) {
            mkdir($full_path, 0777, true);
        }

        $location_target = $validated["location_target"];

        // action.json
        $action = [
            "time" => [
                "pending_at" => now()->format("Y-m-d H:i:s"),
                "syncing_at" => null,
                "completed_at" => null,
                "failed_at" => null,
            ],
            "target" => [
                "name" => $this->humanizeLocationTarget($location_target),
                "location" => $location_target,
                "device_code" => $this->getDeviceCodeByLocationTarget(
                    $location_target,
                ),
            ],
            "folder_name" => $folder_name,
            "status" => "PENDING",
            "error_message" => null,
        ];

        // save action.json
        $action_file = $full_path . DIRECTORY_SEPARATOR . "action.json";
        file_put_contents(
            $action_file,
            json_encode($action, JSON_PRETTY_PRINT),
        );

        Session::flash("success", "Permintaan sinkronisasi dikirim ke kasir");
        return Inertia::location(route("admin.sync-data.index"));
    }
}
