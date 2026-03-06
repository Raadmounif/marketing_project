<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $me = $request->user();

        $query = User::where('id', '!=', $me->id)
            ->orderBy('created_at', 'desc');

        if ($me->isAdmin()) {
            $query->whereIn('role', ['staff', 'customer']);
        } else {
            $query->where('role', 'customer');
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $me = $request->user();
        $allowedRoles = $me->isAdmin() ? ['staff', 'customer'] : ['customer'];

        $data = $request->validate([
            'name'    => 'required|string|max:255',
            'phone'   => 'required|string|max:20',
            'email'   => 'required|email|unique:users,email',
            'password' => 'required|string|min:4',
            'role'    => 'required|in:' . implode(',', $allowedRoles),
            'state'   => 'nullable|in:Abu Dhabi,Dubai,Sharjah,Ajman,Umm Al Quwain,Ras Al Khaimah,Fujairah',
            'address' => 'nullable|string|max:500',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'phone'    => $data['phone'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
            'state'    => $data['state'] ?? null,
            'address'  => $data['address'] ?? null,
        ]);

        return response()->json($user, 201);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        if ($user->id === $me->id) {
            return response()->json(['message' => 'Cannot delete yourself.'], 403);
        }

        if ($me->isAdmin()) {
            if (!in_array($user->role, ['staff', 'customer'])) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        } else {
            if ($user->role !== 'customer') {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        if ($me->isAdmin()) {
            if ($user->id !== $me->id && !in_array($user->role, ['staff', 'customer'])) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        } else {
            if ($user->id !== $me->id && $user->role !== 'customer') {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        $data = $request->validate([
            'password' => 'required|string|min:4|confirmed',
        ]);

        $user->update(['password' => Hash::make($data['password'])]);

        return response()->json(['message' => 'Password reset successfully.']);
    }
}
