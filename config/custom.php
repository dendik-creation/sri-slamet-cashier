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
        "is_admin" =>
            strtoupper(trim(env("SYNCTHING_DEVICE_LOCATION", ""))) ===
            "CENTRAL",
        "is_cashier" => in_array(
            strtoupper(trim(env("SYNCTHING_DEVICE_LOCATION", ""))),
            ["NORTH", "SOUTH"],
            true,
        ),
        "device_code" => [
            "central" => env("SYNCTHING_ADMIN_DEVICE_CODE", ""),
            "north" => env("SYNCTHING_NORTH_DEVICE_CODE", ""),
            "south" => env("SYNCTHING_SOUTH_DEVICE_CODE", ""),
        ],
    ],
];
