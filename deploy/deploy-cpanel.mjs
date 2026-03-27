/**
 * Build frontend with VITE_API_URL, upload dist + root .htaccess to SFTP_REMOTE_PATH.
 * Backend (Laravel) must exist at ~/public_html/api on the server — upload separately or use Terminal.
 *
 * deploy/.env:
 *   DEPLOY_CONFIRM=YES_DEPLOY
 *   VITE_API_URL=https://puffplaza.com/api
 *   SFTP_HOST, SFTP_PORT, SFTP_USER, SFTP_PASSWORD|SFTP_KEY_PATH, SFTP_REMOTE_PATH
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import dotenv from 'dotenv'
import SftpClient from 'ssh2-sftp-client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(__dirname, '.env') })

if (process.env.DEPLOY_CONFIRM !== 'YES_DEPLOY') {
  console.error('Refusing: set DEPLOY_CONFIRM=YES_DEPLOY in deploy/.env')
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
if (!base || base === '/' || !base.includes('public_html')) {
  console.error('Refusing: SFTP_REMOTE_PATH must look like /home/USER/public_html')
  process.exit(1)
}

const viteApi =
  process.env.VITE_API_URL?.trim() || 'https://puffplaza.com/api'

const distDir = path.join(repoRoot, 'frontend', 'dist')
const htaccessLocal = path.join(__dirname, 'cpanel-public_html.htaccess')

console.log('Building frontend with VITE_API_URL=', viteApi)
const build = spawnSync('npm', ['run', 'build'], {
  cwd: path.join(repoRoot, 'frontend'),
  env: { ...process.env, VITE_API_URL: viteApi },
  stdio: 'inherit',
  shell: true,
})
if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

if (!fs.existsSync(distDir)) {
  console.error('Missing frontend/dist — build failed?')
  process.exit(1)
}

const config = {
  host: process.env.SFTP_HOST.trim(),
  port: Number(process.env.SFTP_PORT || 22),
  username: process.env.SFTP_USER.trim(),
  readyTimeout: 300000,
}
if (process.env.SFTP_KEY_PATH) {
  config.privateKey = fs.readFileSync(process.env.SFTP_KEY_PATH.trim())
} else {
  config.password = process.env.SFTP_PASSWORD
}

const sftp = new SftpClient()
try {
  console.log(`Connecting to ${config.host}:${config.port} …`)
  await sftp.connect(config)
  console.log(`Uploading ${distDir} → ${base} …`)
  await sftp.uploadDir(distDir, base)
  console.log('Uploading root .htaccess (API + SPA rules) …')
  await sftp.put(htaccessLocal, `${base}/.htaccess`)
  console.log('\nDone. Ensure Laravel is at ~/public_html/api and backend/.env matches production.')
} catch (err) {
  console.error(err.message || err)
  process.exit(1)
} finally {
  await sftp.end()
}
