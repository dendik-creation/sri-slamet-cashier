<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $role = $request->query('role');

        $users = User::when($search, function ($query, $search) {
            return $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')->orWhere('username', 'like', '%' . $search . '%');
            });
        })
            ->when($role, function ($query, $role) {
                return $query->where('role', $role);
            })
            ->whereNot('id', Auth::user()->id)
            ->orderBy('name', 'asc')
            ->paginate(config('custom.pagination_size'));

        return Inertia::render('Admin/User/Index', [
            'title' => 'Data User',
            'description' => 'Anda dapat mengelola data user dari halaman ini.',
            'users' => $users,
            'search' => $search,
            'role' => $role,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|max:255',
            'username' => 'required|max:255|unique:users,username',
            'password' => 'required',
            'role' => 'required|in:ADMIN,CASHIER',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        User::create($validated);
        Session::flash('success', 'User berhasil ditambahkan.');
        return Inertia::location(route('admin.users.index'));
    }

    public function update($id, Request $request)
    {
        $user = User::findOrFail($id);
        if (!$user) {
            Session::flash('error', 'User tidak ditemukan');
            return Inertia::location(route('admin.users.index'));
        }

        $validated = $request->validate([
            'name' => 'required|max:255,',
            'username' => 'required|max:255|unique:users,username,' . $user->id,
            'role' => 'required|in:ADMIN,CASHIER',
        ]);

        $user->update($validated);
        Session::flash('success', 'User berhasil diperbarui');

        return Inertia::location(route('admin.users.index'));
    }

    public function resetPassword($id, Request $request){
        $user = User::findOrFail($id);
        if (!$user) {
            Session::flash('error', 'User tidak ditemukan');
            return Inertia::location(route('admin.users.index'));
        }

        $validated = $request->validate([
            'password' => 'required',
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        Session::flash('success', 'Password user berhasil direset');
        return Inertia::location(route('admin.users.index'));
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        if (!$user) {
            Session::flash('error', 'User tidak ditemukan');
            return Inertia::location(route('admin.users.index'));
        }

        $user->delete();
        Session::flash('success', 'User berhasil dihapus');
        return Inertia::location(route('admin.users.index'));
    }
}
