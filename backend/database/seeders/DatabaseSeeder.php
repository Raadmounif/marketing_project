<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        User::updateOrCreate(
            ['email' => 'admin@tobaccomarket.com'],
            [
                'name'     => 'Admin',
                'phone'    => '+971000000000',
                'password' => 'Admin@123',
                'role'     => 'admin',
                'state'    => 'Dubai',
                'address'  => 'Admin Address',
            ]
        );

        // Create staff user
        User::updateOrCreate(
            ['email' => 'staff@tobaccomarket.com'],
            [
                'name'     => 'Raad Munif',
                'phone'    => '+971111111111',
                'password' => 'Staff@123',
                'role'     => 'staff',
                'state'    => 'Dubai',
                'address'  => 'Staff Address',
            ]
        );
    }
}
