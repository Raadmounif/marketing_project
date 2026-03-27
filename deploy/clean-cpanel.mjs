/**
 * Deletes ALL files and folders inside SFTP_REMOTE_PATH (e.g. public_html).
 * Does NOT touch MySQL — use cPanel → MySQL Databases to remove DBs manually.
 *
 * Requires in deploy/.env:
 *   CLEAN_CONFIRM=YES_DELETE_ALL
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import SftpClient from 'ssh2-sftp-client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

if (process.env.CLEAN_CONFIRM !== 'YES_DELETE_ALL') {
  console.error('Refusing to run: set CLEAN_CONFIRM=YES_DELETE_ALL in deploy/.env')
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
  console.error('Refusing: SFTP_REMOTE_PATH must be a safe path like /home/USER/public_html')
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

/** Missing path: ENOENT from stat/list; SFTP unlink often uses numeric 2 (NO_SUCH_FILE) */
function isGone(err) {
  if (!err) return false
  const c = err.code
  if (c === 'ENOENT' || c === 2) return true
  return String(err.message || '').includes('No such file')
}

/**
 * Uses rmdir(recursive) so each directory’s files delete in parallel (faster than one-by-one).
 * lstat avoids following symlinks into foreign paths.
 * @param {import('ssh2-sftp-client')} sftp
 */
async function removePath(sftp, remotePath) {
  try {
    const stat = await sftp.lstat(remotePath)
    if (stat.isSymbolicLink) {
      await sftp.delete(remotePath, true)
      return
    }
    if (stat.isDirectory) {
      await sftp.rmdir(remotePath, true)
      return
    }
    await sftp.delete(remotePath, true)
  } catch (e) {
    if (isGone(e)) return
    throw e
  }
}

const sftp = new SftpClient()
try {
  console.log(`Connecting to ${config.host}:${config.port} …`)
  await sftp.connect(config)
  console.log(`Listing ${base} …`)
  const entries = await sftp.list(base)
  console.log(`Removing ${entries.length} top-level item(s) …`)
  for (const e of entries) {
    if (e.name === '.' || e.name === '..') continue
    const full = `${base}/${e.name}`.replace(/\/+/g, '/')
    console.log('  →', full)
    await removePath(sftp, full)
  }
  console.log('\nDone. Folder is empty (or only dot entries). MySQL was NOT changed.')
} catch (err) {
  console.error(err.message || err)
  process.exit(1)
} finally {
  await sftp.end()
}
