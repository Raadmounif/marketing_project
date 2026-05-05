/**
 * Export docs/USER_MANUAL.md to docs/USER_MANUAL.pdf
 * Uses Chrome or Edge (headless) — no npm packages required.
 * Mermaid diagrams are rendered via Kroki (HTTPS).
 *
 * Run: node scripts/export-user-manual-pdf.mjs
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import https from 'node:https'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const mdPath = join(root, 'docs', 'USER_MANUAL.md')
const htmlPath = join(root, 'docs', '.USER_MANUAL_print.html')
const pdfPath = join(root, 'docs', 'USER_MANUAL.pdf')

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function applyInline(s) {
  let t = escapeHtml(s)
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  return t
}

/** Minimal Markdown → HTML for this manual. */
function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out = []
  let i = 0
  let inUl = false
  let tableRows = []

  const flushTable = () => {
    if (tableRows.length < 2) {
      tableRows = []
      return
    }
    out.push('<table><thead>')
    const header = tableRows[0]
    const hCells = header.split('|').map((c) => c.trim()).filter(Boolean)
    out.push('<tr>' + hCells.map((c) => `<th>${applyInline(c)}</th>`).join('') + '</tr>')
    out.push('</thead><tbody>')
    for (let r = 2; r < tableRows.length; r++) {
      const row = tableRows[r]
      const cells = row.split('|').map((c) => c.trim()).filter(Boolean)
      if (cells.length) {
        out.push('<tr>' + cells.map((c) => `<td>${applyInline(c)}</td>`).join('') + '</tr>')
      }
    }
    out.push('</tbody></table>')
    tableRows = []
  }

  const closeUl = () => {
    if (inUl) {
      out.push('</ul>')
      inUl = false
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trim = line.trim()

    if (trim.startsWith('```')) {
      closeUl()
      flushTable()
      const lang = trim.slice(3).trim()
      const block = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        block.push(lines[i])
        i++
      }
      if (i < lines.length) i++
      const body = block.join('\n')
      if (lang === 'mermaid') {
        out.push(`<div class="mermaid-slot" data-mermaid="${escapeHtml(body)}"></div>`)
      } else {
        out.push(`<pre class="code"><code>${escapeHtml(body)}</code></pre>`)
      }
      continue
    }

    if (trim === '---') {
      closeUl()
      flushTable()
      out.push('<hr />')
      i++
      continue
    }

    if (trim.startsWith('|') && trim.includes('|')) {
      closeUl()
      if (/^\|[\s\-:|]+\|$/.test(trim)) {
        i++
        continue
      }
      tableRows.push(line)
      i++
      continue
    }

    if (tableRows.length) {
      flushTable()
    }

    if (trim === '') {
      closeUl()
      flushTable()
      i++
      continue
    }

    if (line.startsWith('### ')) {
      closeUl()
      out.push(`<h3>${applyInline(line.slice(4))}</h3>`)
      i++
      continue
    }
    if (line.startsWith('## ')) {
      closeUl()
      out.push(`<h2>${applyInline(line.slice(3))}</h2>`)
      i++
      continue
    }
    if (line.startsWith('# ')) {
      closeUl()
      out.push(`<h1>${applyInline(line.slice(2))}</h1>`)
      i++
      continue
    }

    if (line.startsWith('- ')) {
      if (!inUl) {
        out.push('<ul>')
        inUl = true
      }
      out.push(`<li>${applyInline(line.slice(2))}</li>`)
      i++
      continue
    }

    closeUl()

    const para = []
    while (i < lines.length) {
      const L = lines[i]
      const T = L.trim()
      if (T === '') break
      if (L.startsWith('#') || L.startsWith('- ') || L.startsWith('```') || T === '---') break
      if (T.startsWith('|') && T.includes('|')) break
      para.push(L)
      i++
    }
    if (para.length) {
      out.push(`<p>${applyInline(para.join(' '))}</p>`)
    }
  }

  closeUl()
  flushTable()
  return out.join('\n')
}

function fetchKrokiSvg(mermaidSource) {
  const body = mermaidSource.trim()
  return new Promise((resolve, reject) => {
    const req = https.request(
      'https://kroki.io/mermaid/svg',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(body, 'utf8'),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Kroki HTTP ${res.statusCode}`))
          } else {
            resolve(data)
          }
        })
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function findBrowser() {
  const candidates = [
    join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ]
  for (const p of candidates) {
    if (p && existsSync(p)) return p
  }
  return null
}

async function main() {
  const md = readFileSync(mdPath, 'utf8')
  let bodyHtml = mdToHtml(md)

  const mermaidBlocks = [...bodyHtml.matchAll(/<div class="mermaid-slot" data-mermaid="([^"]*)"><\/div>/g)]
  for (const m of mermaidBlocks) {
    const encoded = m[1]
    const source = encoded
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    let svg = ''
    try {
      svg = await fetchKrokiSvg(source)
    } catch {
      svg = `<pre style="border:1px solid #ccc;padding:8px;">${escapeHtml(source)}</pre>`
    }
    bodyHtml = bodyHtml.replace(m[0], `<figure class="diagram">${svg}</figure>`)
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Puff Plaza — User manual</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: system-ui, Segoe UI, Roboto, sans-serif; font-size: 11pt; line-height: 1.45; color: #1a1a1a; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 20pt; border-bottom: 2px solid #333; padding-bottom: 6px; }
    h2 { font-size: 14pt; margin-top: 1.2em; color: #222; }
    h3 { font-size: 12pt; margin-top: 1em; color: #333; }
    p { margin: 0.5em 0; }
    ul { margin: 0.4em 0; padding-left: 1.4em; }
    li { margin: 0.25em 0; }
    table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 10pt; }
    th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f0f0f0; }
    hr { border: none; border-top: 1px solid #ccc; margin: 1.2em 0; }
    pre.code { background: #f5f5f5; border: 1px solid #ddd; padding: 10px; font-size: 9pt; overflow: hidden; white-space: pre-wrap; word-break: break-word; }
    code { font-family: ui-monospace, Consolas, monospace; font-size: 0.95em; }
    figure.diagram { margin: 1em 0; text-align: center; }
    figure.diagram svg { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`

  writeFileSync(htmlPath, html, 'utf8')

  const browser = findBrowser()
  if (!browser) {
    console.error('Could not find Google Chrome or Microsoft Edge to print PDF.')
    console.error('Install Chrome, or open this file in a browser and Print → Save as PDF:')
    console.error(htmlPath)
    process.exit(1)
  }

  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/')

  execFileSync(
    browser,
    ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, fileUrl],
    { stdio: 'inherit' }
  )

  try {
    unlinkSync(htmlPath)
  } catch {}

  console.log('Wrote', pdfPath)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
