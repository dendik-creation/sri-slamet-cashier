<?php

namespace App\Http\Controllers\cashier;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input("search");

        $customers = Customer::when($search, function ($query, $search) {
            return $query
                ->where("name", "like", "%" . $search . "%")
                ->orWhere("phone", "like", "%" . $search . "%");
        })->paginate(config("app.custom.pagination_size"));

        return Inertia::render("Cashier/Customer/Index", [
            "title" => "Daftar Pelanggan",
            "description" => "Halaman untuk mengelola data pelanggan.",
            "customers" => $customers,
            "search" => $search,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "name" => "string|max:255",
            "phone" => "string|max:20|nullable",
            "address" => "string|max:500",
        ]);
        $slug_by_name = Str::slug($validated["name"], "-");
        $slug_exist_count = Customer::where("slug", $slug_by_name)->count();
        if ($slug_exist_count > 0) {
            $validated["slug"] = $slug_by_name . "-" . ($slug_exist_count + 1);
        } else {
            $validated["slug"] = $slug_by_name;
        }
        Customer::create($validated);
        Session::flash("success", "Pelanggan berhasil ditambahkan.");
        return Inertia::location(route("admin.customers.index"));
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);
        $validated = $request->validate([
            "name" => "string|max:255",
            "phone" => "string|max:20|nullable",
            "address" => "string|max:500",
        ]);
        $slug_by_name = Str::slug($validated["name"], "-");
        $slug_exist_count = Customer::where("slug", $slug_by_name)
            ->where("id", "!=", $customer->id)
            ->count();
        if ($slug_exist_count > 0) {
            $validated["slug"] = $slug_by_name . "-" . ($slug_exist_count + 1);
        } else {
            $validated["slug"] = $slug_by_name;
        }
        $customer->update($validated);
        Session::flash("success", "Pelanggan berhasil diperbarui.");
        return Inertia::location(route("admin.customers.index"));
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();
        Session::flash("success", "Pelanggan berhasil dihapus.");
        return Inertia::location(route("cashier.customers.index"));
    }
}
