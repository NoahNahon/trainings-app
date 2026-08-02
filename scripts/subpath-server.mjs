// Simuliert GitHub Pages lokal: liefert dist/ unter /trainings-app/ aus, damit sich
// Unterpfad-Hosting (Assets, Manifest, Service-Worker-Scope) vor dem Deploy testen lässt.
//
//   npm run serve:subpath        -> http://localhost:5310/trainings-app/
//   PORT=8080 npm run serve:subpath
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// resolve() + fileURLToPath(): trägt auch Pfade mit Leerzeichen korrekt,
// anders als new URL(...).pathname (das liefert %20 statt Leerzeichen).
const DIST = resolve(process.argv[2] ?? fileURLToPath(new URL('../dist', import.meta.url)))
const PREFIX = '/trainings-app'
const PORT = Number(process.env.PORT || 5310)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

/**
 * Maps a request path to a file inside DIST, or null if it escapes.
 *
 * Without the containment check, "/trainings-app/..%2f..%2fRezeptbuch.pdf" would
 * happily serve files from outside dist/ — including the private PDFs that live one
 * directory above this project and .git/config. Browsers normalise a literal "../"
 * but not the percent-encoded form, so this was reachable straight from a URL bar.
 */
function resolveInsideDist(urlPath) {
  let decoded
  try {
    decoded = decodeURIComponent(urlPath)
  } catch {
    return { error: 400 } // e.g. "%ZZ" — decodeURIComponent throws URIError
  }

  if (!decoded.startsWith(`${PREFIX}/`)) return { error: 404 }

  const rel = decoded.slice(PREFIX.length + 1) || 'index.html'
  const file = resolve(DIST, rel)
  if (file !== DIST && !file.startsWith(DIST + sep)) return { error: 403 }
  return { file }
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = (req.url ?? '/').split('?')[0]

    if (urlPath === PREFIX) {
      res.writeHead(301, { Location: `${PREFIX}/` })
      return res.end()
    }

    const { file, error } = resolveInsideDist(urlPath)
    if (error) {
      res.writeHead(error)
      return res.end(String(error))
    }

    let target = file
    try {
      if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html')
    } catch {
      res.writeHead(404)
      return res.end('404')
    }

    const body = await readFile(target)
    res.writeHead(200, {
      'Content-Type': TYPES[extname(target)] ?? 'application/octet-stream',
      // Kein Caching, damit ein neuer Build sofort greift
      'Cache-Control': 'no-store',
    })
    res.end(body)
  } catch (err) {
    // Ein einzelner kaputter Request darf den Server nicht beenden.
    if (!res.headersSent) res.writeHead(500)
    res.end('500')
    console.error('Request fehlgeschlagen:', err instanceof Error ? err.message : err)
  }
})

// Nur localhost: dieser Server ist ein Testwerkzeug und hat im Netzwerk nichts zu suchen.
server.listen(PORT, '127.0.0.1', () => {
  const { port } = server.address()
  console.log(`dist/ liegt unter  http://localhost:${port}${PREFIX}/`)
  console.log(`(aus ${DIST})`)
})

server.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `Port ${PORT} ist belegt.` : err.message)
  process.exit(1)
})
