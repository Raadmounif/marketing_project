<?php

return [

    'default' => env('MAIL_MAILER', 'smtp'),

    'mailers' => [
        'smtp' => [
            'transport'  => 'smtp',
            'url'       => env('MAIL_URL'),
            'host'      => env('MAIL_HOST', 'smtp.mailgun.org'),
            'port'      => env('MAIL_PORT', 587),
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'username'  => env('MAIL_USERNAME'),
            'password'  => env('MAIL_PASSWORD'),
            'timeout'   => null,
            // Work around host proxy presenting wrong cert (e.g. cPanel: CN mismatch with smtp.gmail.com)
            'verify_peer' => false,
        ],

        'sendmail' => [
            'transport' => 'sendmail',
            'path'      => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -bs'),
        ],

        'log' => [
            'transport' => 'log',
            'channel'   => env('MAIL_LOG_CHANNEL'),
        ],
    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        'name'    => env('MAIL_FROM_NAME', 'Example'),
    ],

    'markdown' => [
        'theme' => env('MAIL_MARKDOWN_THEME', 'default'),
        'paths' => [
            resource_path('views/vendor/mail'),
        ],
    ],

];
