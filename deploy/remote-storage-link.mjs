/**
 * One-off: SSH into cPanel and run storage:link + config:clear for Laravel under public_html/api.
 *
 * deploy/.env: same as deploy-full (DEPLOY_CONFIRM=YES_DEPLOY, SFTP_*, SSH_PORT, SFTP_REMOTE_PATH)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { sshExec } from './lib/ssh-exec.mjs'
import { sshCompatAlgorithms } from './lib/ssh-compat.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(__dirname, '.env') })

if (process.env.DEPLOY_CONFIRM !== 'YES_DEPLOY') {
  console.error('Set DEPLOY_CONFIRM=YES_DEPLOY in deploy/.env')
  process.exit(1)
}

const required = ['SFTP_HOST', 'SFTP_USER', 'SFTP_REMOTE_PATH']
for (const k of required) {
  if (!process.env[k]?.trim()) {
    console.error(`Missing ${k}`)
    process.exit(1)
  }
}

if (!process.env.SFTP_PASSWORD && !process.env.SFTP_KEY_PATH) {
  console.error('Set SFTP_PASSWORD or SFTP_KEY_PATH')
  process.exit(1)
}

const base = process.env.SFTP_REMOTE_PATH.trim().replace(/\/$/, '')
const apiRemote = `${base}/api`

const sshConfig = {
  host: process.env.SFTP_HOST.trim(),
  port: Number(process.env.SSH_PORT || process.env.SFTP_PORT || 22),
  username: process.env.SFTP_USER.trim(),
  password: process.env.SFTP_PASSWORD,
  algorithms: sshCompatAlgorithms,
}

if (process.env.SFTP_KEY_PATH) {
  sshConfig.privateKey = fs.readFileSync(process.env.SFTP_KEY_PATH.trim())
  delete sshConfig.password
}

// Shell symlink matches `php artisan storage:link` (works even if artisan is broken, e.g. missing dev deps)
const cmd = `cd ${apiRemote}/public && rm -f storage && ln -snf ../storage/app/public storage && ls -la storage | head -1 && echo "storage symlink OK."`

console.log('SSH:', sshConfig.host, 'port', sshConfig.port)
console.log('Remote:', apiRemote)

try {
  await sshExec(sshConfig, cmd)
  process.exit(0)
} catch (e) {
  console.error(e.message || e)
  process.exit(1)
}
