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

    public function index()
    {
        $available_cashiers = User::where("role", User::ROLE_CASHIER)
            ->get()
            ->map(function ($cashier) {
                return [
                    "label" => $cashier->name,
                    "value" => $cashier->id,
                ];
            });

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
            $request_at = $action["request_at"];
            $request_to = $action["request_to"];
            $status = $action["status"];
            $device_code = $action["device_code"];
            $respond_at = $action["respond_at"];
            $error_message =
                $status === "FAILED"
                    ? $action["error_message"] ?? "Unknown Error"
                    : null;
            $sync_folders[] = [
                "folder_name" => $folder_name,
                "request_to" => $request_to,
                "request_at" => $request_at,
                "device_code" => $device_code,
                "status" => $status,
                "respond_at" => $respond_at,
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
            "available_cashiers" => $available_cashiers,
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
            "respond_at" => $action["respond_at"],
            "error_message" => $action["error_message"],
        ]);
    }

    public function sync(Request $request)
    {
        $validated = $request->validate(
            [
                "cashier_id" => "required|exists:users,id",
            ],
            [
                "cashier_id.required" => "Kasir wajib dipilih.",
                "cashier_id.exists" => "Kasir tidak ditemukan.",
            ],
        );

        $cashier = User::find($validated["cashier_id"]);

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

        // action.json
        $action = [
            "request_at" => now()->format("Y-m-d H:i:s"),
            "request_to" => $cashier->name,
            "request_to_username" => $cashier->username,
            "device_code" => $this->getDeviceCodeByCashier($cashier),
            "status" => "PENDING",
            "respond_at" => null,
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
