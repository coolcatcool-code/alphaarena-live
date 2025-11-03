/**
 * Materialise .pnpm packages into top-level node_modules for environments
 * where symlinks are unavailable. Accepts a target base directory via CLI.
 *
 * Usage: node scripts/materialize-pnpm.cjs <absolute-path-to-node_modules>
 */

const fs = require('fs')
const path = require('path')

const targetNodeModules = process.argv[2]

if (!targetNodeModules) {
  console.error('Usage: node scripts/materialize-pnpm.cjs <node_modules_path>')
  process.exit(1)
}

if (!fs.existsSync(targetNodeModules)) {
  console.warn(`[materialize-pnpm] target not found: ${targetNodeModules}`)
  process.exit(0)
}

const pnpmDir = path.join(targetNodeModules, '.pnpm')
if (!fs.existsSync(pnpmDir)) {
  console.warn(`[materialize-pnpm] no .pnpm directory under ${targetNodeModules}`)
  process.exit(0)
}

const copied = []

const entries = fs.readdirSync(pnpmDir, { withFileTypes: true })
for (const entry of entries) {
  if (!entry.isDirectory()) continue
  const nodeModulesDir = path.join(pnpmDir, entry.name, 'node_modules')
  if (!fs.existsSync(nodeModulesDir)) continue

  for (const pkgName of fs.readdirSync(nodeModulesDir)) {
    const source = path.join(nodeModulesDir, pkgName)
    const destination = path.join(targetNodeModules, pkgName)
    if (fs.existsSync(destination)) continue
    fs.cpSync(source, destination, { recursive: true })
    copied.push(pkgName)
  }
}

console.log(`[materialize-pnpm] Copied ${copied.length} packages into ${targetNodeModules}`)
