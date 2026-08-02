// Serves dist/ and prints the address the phone should open — including a QR code,
// so nobody has to type an IP on a phone keyboard.
//
// The port is resolved HERE and handed to vite with --strictPort. Letting vite pick
// its own fallback port is how the printed URL and the real one drifted apart before.
import { createServer } from 'node:net'
import { networkInterfaces } from 'node:os'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import qrcode from 'qrcode-terminal'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const START_PORT = Number(process.env.PORT ?? 5180)

function isFree(port) {
  return new Promise((resolve) => {
    const srv = createServer()
    srv.once('error', () => resolve(false))
    srv.once('listening', () => srv.close(() => resolve(true)))
    // 0.0.0.0 — the same interface vite --host will bind to
    srv.listen(port, '0.0.0.0')
  })
}

async function findPort(from) {
  for (let port = from; port < from + 40; port++) {
    if (await isFree(port)) return port
  }
  throw new Error(`Keine freien Ports zwischen ${from} und ${from + 40}.`)
}

/** The Mac's LAN address. Note en0 here is Ethernet (Dock), not Wi-Fi. */
function lanAddress() {
  const candidates = []
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family !== 'IPv4' || addr.internal) continue
      if (name.startsWith('utun') || name.startsWith('llw') || name.startsWith('awdl')) continue
      candidates.push({ name, address: addr.address })
    }
  }
  // Prefer the usual private ranges over VPN/virtual adapters
  const preferred = candidates.find((c) => /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(c.address))
  return preferred ?? candidates[0] ?? null
}

const port = await findPort(START_PORT)
const lan = lanAddress()

const line = '─'.repeat(58)
console.log(`\n${line}`)
console.log('  Trainings-App läuft')
console.log(line)
console.log(`\n  Auf diesem Mac:   http://localhost:${port}`)

if (lan) {
  const url = `http://${lan.address}:${port}`
  console.log(`  Auf dem Handy:    ${url}`)
  console.log(`                    (Interface ${lan.name} – Handy muss im selben Netz sein)\n`)
  console.log('  Oder mit der Handy-Kamera diesen Code scannen:\n')
  qrcode.setErrorLevel('M')
  qrcode.generate(url, { small: true }, (qr) => {
    console.log(
      qr
        .split('\n')
        .map((l) => `    ${l}`)
        .join('\n'),
    )
  })
} else {
  console.log('\n  Keine Netzwerkadresse gefunden – der Mac ist offenbar in keinem Netzwerk.')
  console.log('  Am Handy ist die App damit nicht erreichbar.\n')
}

if (port !== START_PORT) {
  console.log(`\n  Hinweis: Port ${START_PORT} war belegt, daher Port ${port}.`)
  console.log('  Läuft die App vielleicht schon in einem anderen Fenster?')
}

console.log(`\n${line}`)
console.log('  Beenden: Strg+C oder dieses Fenster schließen.')
console.log(`${line}\n`)

const vite = spawn(
  process.execPath,
  [join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--host', '--port', String(port), '--strictPort'],
  { cwd: ROOT, stdio: ['inherit', 'ignore', 'inherit'] },
)

vite.on('exit', (code) => process.exit(code ?? 0))
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => vite.kill(signal))
}
