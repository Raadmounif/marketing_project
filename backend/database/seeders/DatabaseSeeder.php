<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        User::create([
            'name'     => 'Admin',
            'email'    => 'admin@tobaccomarket.com',
            'phone'    => '+971000000000',
            'password' => Hash::make('Admin@123'),
            'role'     => 'admin',
            'state'    => 'Dubai',
            'address'  => 'Admin Address',
        ]);

        // Create staff user
        User::create([
            'name'     => 'Raad Munif',
            'email'    => 'staff@tobaccomarket.com',
            'phone'    => '+971111111111',
            'password' => Hash::make('Staff@123'),
            'role'     => 'staff',
            'state'    => 'Dubai',
            'address'  => 'Staff Address',
        ]);
    }
}
