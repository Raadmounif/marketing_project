/**
 * Full stack: build frontend, upload dist + root .htaccess, upload Laravel (no vendor),
 * write production .env, SSH: composer install + artisan key, migrate, storage:link, chmod.
 *
 * deploy/.env (add to your existing file):
 *   FULL_DEPLOY_CONFIRM=YES_FULL_DEPLOY
 *   SSH_PORT=21098
 *   DB_DATABASE=cpaneluser_dbname
 *   DB_USERNAME=cpaneluser_dbuser
 *   DB_PASSWORD=...
 *   MAIL_USERNAME=... (optional)
 *   MAIL_PASSWORD=...
 */
import fs from 'fs'
import path from 'path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import dotenv from 'dotenv'
import SftpClient from 'ssh2-sftp-client'
import { sshExec } from './lib/ssh-exec.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const backendRoot = path.join(repoRoot, 'backend')

dotenv.config({ path: path.join(__dirname, '.env') })

if (process.env.FULL_DEPLOY_CONFIRM !== 'YES_FULL_DEPLOY') {
  console.error('Refusing: set FULL_DEPLOY_CONFIRM=YES_FULL_DEPLOY in deploy/.env')
  process.exit(1)
}

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
const apiRemote = `${base}/api`

const distDir = path.join(repoRoot, 'frontend', 'dist')
const htaccessLocal = path.join(__dirname, 'cpanel-public_html.htaccess')

function buildBackendEnv() {
  let text = fs.readFileSync(path.join(backendRoot, '.env.example'), 'utf8')
  const pairs = [
    ['DB_DATABASE', process.env.DB_DATABASE],
    ['DB_USERNAME', process.env.DB_USERNAME],
    ['DB_PASSWORD', process.env.DB_PASSWORD],
    ['MAIL_USERNAME', process.env.MAIL_USERNAME],
    ['MAIL_PASSWORD', process.env.MAIL_PASSWORD],
    ['MAIL_FROM_ADDRESS', process.env.MAIL_FROM_ADDRESS],
    ['NOTIFICATION_EMAIL', process.env.NOTIFICATION_EMAIL],
  ]
  for (const [key, val] of pairs) {
    if (val != null && String(val).trim() !== '') {
      const re = new RegExp(`^${key}=.*$`, 'm')
      text = text.replace(re, `${key}=${val}`)
    }
  }
  return text
}

function shouldUploadBackendPath(localPath) {
  const rel = path.relative(backendRoot, localPath).replace(/\\/g, '/')
  if (!rel || rel === '.') return true
  if (rel.startsWith('.git')) return false
  if (rel === '.env') return false
  if (rel.includes('/node_modules/') || rel === 'node_modules') return false
  if (rel.includes('/vendor/') || rel === 'vendor') return false
  if (rel.includes('storage/logs')) return false
  if (rel.includes('/tests/') || rel === 'tests') return false
  if (rel.includes('phpunit')) return false
  return true
}

const sftpConfig = {
  host: process.env.SFTP_HOST.trim(),
  port: Number(process.env.SFTP_PORT || 22),
  username: process.env.SFTP_USER.trim(),
  readyTimeout: 300000,
}
if (process.env.SFTP_KEY_PATH) {
  sftpConfig.privateKey = fs.readFileSync(process.env.SFTP_KEY_PATH.trim())
} else {
  sftpConfig.password = process.env.SFTP_PASSWORD
}

const sshConfig = {
  host: sftpConfig.host,
  port: Number(process.env.SSH_PORT || process.env.SFTP_PORT || 22),
  username: sftpConfig.username,
  password: sftpConfig.password,
  privateKey: sftpConfig.privateKey,
}

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
  console.error('Missing frontend/dist')
  process.exit(1)
}

const envContent = buildBackendEnv()
const sftp = new SftpClient()

async function ensureApiStorageDirs(sftp, apiRemote) {
  const dirs = [
    `${apiRemote}/storage/app/public`,
    `${apiRemote}/storage/framework/sessions`,
    `${apiRemote}/storage/framework/views`,
    `${apiRemote}/storage/framework/cache`,
    `${apiRemote}/storage/logs`,
    `${apiRemote}/bootstrap/cache`,
  ]
  for (const d of dirs) {
    try {
      await sftp.mkdir(d, true)
    } catch {
      /* exists */
    }
  }
}

/**
 * For hosts without SSH: Composer + Artisan via browser (delete files after use).
 */
async function uploadBootstrapArtifacts(sftp, apiRemote) {
  const token =
    process.env.BOOTSTRAP_TOKEN?.trim() || crypto.randomBytes(32).toString('hex')
  const site = process.env.PUBLIC_SITE_URL?.trim() || 'https://puffplaza.com'
  const composerTmp = path.join(__dirname, 'composer.phar.download')

  console.log('Downloading composer.phar (for PHP fallback) …')
  const res = await fetch(
    'https://getcomposer.org/download/latest-stable/composer.phar',
  )
  if (!res.ok) {
    throw new Error(`composer.phar download failed: HTTP ${res.status}`)
  }
  fs.writeFileSync(composerTmp, Buffer.from(await res.arrayBuffer()))

  await sftp.put(composerTmp, `${apiRemote}/composer.phar`)
  fs.unlinkSync(composerTmp)

  await sftp.put(Buffer.from(token, 'utf8'), `${apiRemote}/.bootstrap-token`)
  await sftp.put(
    path.join(__dirname, 'cpanel-bootstrap', 'install-vendor.php'),
    `${apiRemote}/public/install-vendor.php`,
  )
  await sftp.put(
    path.join(__dirname, 'cpanel-bootstrap', 'run-artisan.php'),
    `${apiRemote}/public/run-artisan.php`,
  )

  const q = `token=${encodeURIComponent(token)}`
  return {
    token,
    installUrl: `${site}/api/public/install-vendor.php?${q}`,
    artisanUrl: `${site}/api/public/run-artisan.php?${q}`,
  }
}

async function tryComposer(apiPath) {
  const attempts = [
    `cd ${apiPath} && composer install --no-dev --optimize-autoloader`,
    `cd ${apiPath} && bash -lc 'composer install --no-dev --optimize-autoloader || php -d memory_limit=512M /opt/cpanel/composer/bin/composer install --no-dev --optimize-autoloader'`,
  ]
  console.log('\n--- SSH: composer install ---\n')
  let last
  for (const cmd of attempts) {
    try {
      await sshExec(sshConfig, cmd)
      return
    } catch (e) {
      last = e
      console.error('Composer attempt failed:', e.message)
    }
  }
  throw last
}

try {
  console.log(`Connecting SFTP to ${sftpConfig.host}:${sftpConfig.port} …`)
  await sftp.connect(sftpConfig)

  console.log(`Uploading ${distDir} → ${base} …`)
  await sftp.uploadDir(distDir, base)
  console.log('Uploading root .htaccess …')
  await sftp.put(htaccessLocal, `${base}/.htaccess`)

  console.log(`Uploading backend → ${apiRemote} (excluding vendor, .git) …`)
  await sftp.uploadDir(backendRoot, apiRemote, {
    filter: (p, isDir) => shouldUploadBackendPath(p),
  })

  console.log('Uploading production .env …')
  await sftp.put(Buffer.from(envContent, 'utf8'), `${apiRemote}/.env`)

  await ensureApiStorageDirs(sftp, apiRemote)

  let bootstrapUrls = null
  if (process.env.UPLOAD_PHP_BOOTSTRAP !== '0') {
    try {
      bootstrapUrls = await uploadBootstrapArtifacts(sftp, apiRemote)
      console.log('Uploaded PHP bootstrap helpers + composer.phar (for no-SSH hosts).')
    } catch (e) {
      console.error('Bootstrap upload failed:', e.message || e)
    }
  }

  await sftp.end()

  console.log('\n--- Remote setup via SSH ---\n')

  try {
    await sshExec(
      sshConfig,
      `mkdir -p ${apiRemote}/storage/app/public ${apiRemote}/storage/framework/sessions ${apiRemote}/storage/framework/views ${apiRemote}/storage/framework/cache ${apiRemote}/storage/logs ${apiRemote}/bootstrap/cache`,
    )
  } catch (e) {
    console.error('mkdir storage:', e.message)
  }

  try {
    await tryComposer(apiRemote)
  } catch (e) {
    console.error(
      '\nComposer failed. Install dependencies on the server (cPanel Terminal):\n',
      `  cd ${apiRemote} && composer install --no-dev --optimize-autoloader\n`,
    )
  }

  const artisan = (args) =>
    sshExec(sshConfig, `cd ${apiRemote} && php artisan ${args}`)

  try {
    await artisan('key:generate --force')
  } catch (e) {
    console.error('key:generate:', e.message)
  }

  try {
    await artisan('storage:link')
  } catch (e) {
    console.error('storage:link:', e.message)
  }

  const hasDb =
    process.env.DB_DATABASE?.trim() &&
    process.env.DB_USERNAME?.trim() &&
    process.env.DB_PASSWORD !== undefined &&
    String(process.env.DB_PASSWORD).length > 0

  if (hasDb) {
    try {
      await artisan('migrate --force')
    } catch (e) {
      console.error('migrate:', e.message)
    }
    try {
      await artisan('db:seed --force')
    } catch (e) {
      console.error('db:seed:', e.message)
    }
  } else {
    console.log(
      '\nSkipping migrate/seed: set DB_DATABASE, DB_USERNAME, DB_PASSWORD in deploy/.env and run:\n',
      `  cd ${apiRemote} && php artisan migrate --force && php artisan db:seed --force\n`,
    )
  }

  try {
    await sshExec(
      sshConfig,
      `bash -lc 'chmod -R 775 ${apiRemote}/storage ${apiRemote}/bootstrap/cache 2>/dev/null; chmod -R 755 ${apiRemote} 2>/dev/null; exit 0'`,
    )
  } catch (e) {
    console.error('chmod:', e.message)
  }

  console.log(
    '\nFull deploy finished. Test https://puffplaza.com and https://puffplaza.com/api/offers',
  )

  if (bootstrapUrls) {
    console.log(
      '\n--- No SSH? Open these once in your browser, then delete the files on the server ---\n',
    )
    console.log('1) Install Composer dependencies (vendor/):\n   ', bootstrapUrls.installUrl)
    console.log('\n2) Artisan (key, storage:link, migrate, seed):\n   ', bootstrapUrls.artisanUrl)
    console.log(
      '\nThen remove: api/composer.phar, api/.bootstrap-token, api/public/install-vendor.php, api/public/run-artisan.php\n',
    )
  }
} catch (err) {
  console.error(err.message || err)
  process.exit(1)
} finally {
  try {
    await sftp.end()
  } catch {
    /* ignore */
  }
}
