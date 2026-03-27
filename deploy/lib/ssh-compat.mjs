/**
 * Broader algorithm lists for older cPanel / OpenSSH servers that reset connections
 * when the client only offers modern defaults.
 */
export const sshCompatAlgorithms = {
  kex: [
    'curve25519-sha256',
    'curve25519-sha256@libssh.org',
    'diffie-hellman-group-exchange-sha256',
    'diffie-hellman-group14-sha256',
    'diffie-hellman-group-exchange-sha1',
    'diffie-hellman-group14-sha1',
    'ecdh-sha2-nistp256',
    'ecdh-sha2-nistp384',
    'ecdh-sha2-nistp521',
  ],
  serverHostKey: [
    'ssh-ed25519',
    'ecdsa-sha2-nistp256',
    'ecdsa-sha2-nistp384',
    'ecdsa-sha2-nistp521',
    'ssh-rsa',
    'ssh-dss',
  ],
  cipher: [
    'aes128-gcm@openssh.com',
    'aes256-gcm@openssh.com',
    'aes128-ctr',
    'aes192-ctr',
    'aes256-ctr',
    'aes128-cbc',
    'aes192-cbc',
    'aes256-cbc',
  ],
  hmac: [
    'hmac-sha2-256',
    'hmac-sha2-512',
    'hmac-sha1',
    'hmac-sha1-96',
  ],
}
