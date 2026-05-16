const { networkInterfaces } = require('os')
const { spawn } = require('child_process')

const PORTS = {
  api: Number(process.env.CIVICGO_MOBILE_API_PORT || 5052),
  web: Number(process.env.CIVICGO_MOBILE_FRONTEND_PORT || 5173),
}

function isPrivateIp(ip) {
  return (
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  )
}

function pickLocalIp() {
  if (process.env.CIVICGO_LOCAL_IP) {
    const manualIp = process.env.CIVICGO_LOCAL_IP.trim()
    if (manualIp) return manualIp
  }

  const ifaces = networkInterfaces()

  for (const iface of Object.values(ifaces).flat()) {
    if (!iface || iface.family !== 'IPv4' || iface.internal) continue
    if (isPrivateIp(iface.address)) return iface.address
  }

  for (const iface of Object.values(ifaces).flat()) {
    if (!iface || iface.family !== 'IPv4' || iface.internal) continue
    return iface.address
  }

  throw new Error('Nu am gasit un IP local IPv4. Seteaza CIVICGO_LOCAL_IP manual.')
}

function start(name, command, args, env = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })

  return child
}

function killProcess(child, name) {
  if (child.killed) return
  child.kill('SIGINT')
}

try {
  const ip = pickLocalIp()
  const apiUrl = `http://${ip}:${PORTS.api}`
  const webUrl = `http://${ip}:${PORTS.web}`

  const children = []

  children.push(
    start('backend', 'npm', ['run', 'dev:backend:lan'], {
      VITE_API_URL: apiUrl,
    }),
  )

  children.push(
    start('frontend', 'npm', ['--prefix', 'frontend', 'run', 'dev', '--', '--host', '0.0.0.0', '--port', `${PORTS.web}`], {
      VITE_API_URL: apiUrl,
    }),
  )

  children.push(
    start('mobile', 'npm', ['--prefix', 'civi-mobile', 'run', 'start'], {
      EXPO_PUBLIC_CIVICGO_URL: webUrl,
    }),
  )

  const summary = {
    ip,
    apiUrl,
    webUrl,
  }

  console.log(`\n[mobile-stack] IP detectat: ${summary.ip}`)
  console.log(`[mobile-stack] Backend API: ${summary.apiUrl}`)
  console.log(`[mobile-stack] Web URL: ${summary.webUrl}`)
  console.log('[mobile-stack] Pornit: backend (5052), frontend (5173), Expo (start)')

  process.on('SIGINT', () => {
    children.forEach((child) => killProcess(child))
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    children.forEach((child) => killProcess(child))
    process.exit(0)
  })
} catch (err) {
  console.error(`\n[mobile-stack] Eroare: ${err.message}`)
  process.exit(1)
}
