/**
 * Run a single shell command on the remote host (same credentials as SFTP).
 */
import { Client } from 'ssh2'
import { sshCompatAlgorithms } from './ssh-compat.mjs'

/**
 * @param {{ host: string, port: number, username: string, password?: string, privateKey?: Buffer }} config
 * @param {string} command
 */
export function sshExec(config, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    let stdout = ''
    let stderr = ''
    conn
      .on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end()
            return reject(err)
          }
          stream.on('data', (d) => {
            const s = d.toString()
            stdout += s
            process.stdout.write(s)
          })
          stream.stderr.on('data', (d) => {
            const s = d.toString()
            stderr += s
            process.stderr.write(s)
          })
          stream.on('close', (code) => {
            conn.end()
            if (code !== 0) {
              const e = new Error(`SSH command failed (exit ${code})`)
              e.code = code
              e.stderr = stderr
              e.command = command
              reject(e)
            } else {
              resolve(stdout)
            }
          })
        })
      })
      .on('error', reject)
      .connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey,
        readyTimeout: 300000,
        algorithms: config.algorithms ?? sshCompatAlgorithms,
      })
  })
}
