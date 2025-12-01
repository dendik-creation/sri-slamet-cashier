<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Custom Configurations
    |--------------------------------------------------------------------------
    |
    | Here you may specify custom configuration options for your application.
    |
    */
    "pagination_size" => env("PAGINATION_SIZE", 10),
    "syncthing" => [
        "sync_path" => env("SYNCTHING_PATH", ""),
        "device_location" => env("SYNCTHING_DEVICE_LOCATION", ""),
        "device_code" => [
            "central" => env("SYNCTHING_ADMIN_DEVICE_CODE", ""),
            "north" => env("SYNCTHING_KASIR1_DEVICE_CODE", ""),
            "south" => env("SYNCTHING_KASIR2_DEVICE_CODE", ""),
        ],
    ],
];
