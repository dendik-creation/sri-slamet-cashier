<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command("inspire", function () {
    $this->comment(Inspiring::quote());
})->purpose("Display an inspiring quote");

if (config("custom.syncthing.is_admin")) {
    Schedule::command("app:sync-admin")
        ->everyThirtySeconds()
        ->runInBackground();
}
if (config("custom.syncthing.is_cashier")) {
    Schedule::command("app:sync-cashier")
        ->everyThirtySeconds()
        ->withoutOverlapping();
}
