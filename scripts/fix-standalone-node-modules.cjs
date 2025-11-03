/**
 * After Next.js builds the standalone output, ensure that packages inside
 * the `.pnpm` workspace are materialised in `.next/standalone/node_modules`.
 * This avoids problems on Windows where symlinks cannot be created.
 */

const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const standaloneNodeModules = path.join(rootDir, '.next', 'standalone', 'node_modules')
const pnpmStore = path.join(standaloneNodeModules, '.pnpm')

function log(message) {
  process.stdout.write(`[fix-standalone] ${message}\n`)
}

if (!fs.existsSync(standaloneNodeModules) || !fs.existsSync(pnpmStore)) {
  log('No standalone node_modules detected; skipping fix.')
  process.exit(0)
}

const copied = []

const entries = fs.readdirSync(pnpmStore, { withFileTypes: true })
for (const entry of entries) {
  if (!entry.isDirectory()) continue
  const nodeModulesDir = path.join(pnpmStore, entry.name, 'node_modules')
  if (!fs.existsSync(nodeModulesDir)) continue

  const packages = fs.readdirSync(nodeModulesDir)
  for (const pkgName of packages) {
    const source = path.join(nodeModulesDir, pkgName)
    const destination = path.join(standaloneNodeModules, pkgName)
    if (fs.existsSync(destination)) continue

    fs.cpSync(source, destination, { recursive: true })
    copied.push(pkgName)
  }
}

log(`Materialised ${copied.length} package directories from .pnpm`)
