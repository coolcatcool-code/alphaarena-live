/**
 * Windows symlink fallback helper.
 * Replaces fs symlink calls with a copy when the environment
 * does not permit creating symlinks (common on non-elevated PowerShell).
 */

const fs = require('fs')
const path = require('path')

const origSymlink = fs.symlink.bind(fs)
const origSymlinkSync = fs.symlinkSync.bind(fs)
const origSymlinkPromise = fs.promises.symlink.bind(fs.promises)
const origCopyFileSync = fs.copyFileSync.bind(fs)
const origCopyFilePromise = fs.promises.copyFile.bind(fs.promises)
const origCpSync = typeof fs.cpSync === 'function' ? fs.cpSync.bind(fs) : null
const origCpPromise = typeof fs.promises.cp === 'function' ? fs.promises.cp.bind(fs.promises) : null

async function ensureParentDirectory(filePath) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
}

function ensureParentDirectorySync(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

async function copyFallback(target, destination) {
  const resolvedTarget = path.resolve(path.dirname(destination), target)
  await ensureParentDirectory(destination)
  await fs.promises.rm(destination, { force: true, recursive: true }).catch(() => {})
  await fs.promises.cp(resolvedTarget, destination, { recursive: true })
}

function copyFallbackSync(target, destination) {
  const resolvedTarget = path.resolve(path.dirname(destination), target)
  ensureParentDirectorySync(destination)
  try {
    fs.rmSync(destination, { force: true, recursive: true })
  } catch {
    // ignore
  }
  fs.cpSync(resolvedTarget, destination, { recursive: true })
}

async function symlinkWithFallback(target, destination, type) {
  try {
    await origSymlinkPromise(target, destination, type)
  } catch (error) {
    if (error && error.code === 'EPERM') {
      await copyFallback(target, destination)
      return
    }
    throw error
  }
}

function symlinkCallbackWrapper(target, destination, type, callback) {
  if (typeof type === 'function') {
    callback = type
    type = undefined
  }

  symlinkWithFallback(target, destination, type)
    .then(() => callback && callback(null))
    .catch(err => callback && callback(err))
}

function symlinkSyncWithFallback(target, destination, type) {
  try {
    origSymlinkSync(target, destination, type)
  } catch (error) {
    if (error && error.code === 'EPERM') {
      copyFallbackSync(target, destination)
      return
    }
    throw error
  }
}

fs.promises.symlink = symlinkWithFallback
fs.symlink = symlinkCallbackWrapper
fs.symlinkSync = symlinkSyncWithFallback

async function copyFileWithFallback(source, destination, mode) {
  try {
    await origCopyFilePromise(source, destination, mode)
  } catch (error) {
    if (error && error.code === 'EPERM') {
      await ensureParentDirectory(destination)
      await fs.promises.rm(destination, { force: true, recursive: true }).catch(() => {})
      await fs.promises.cp(source, destination, { recursive: true })
      return
    }
    throw error
  }
}

function copyFileSyncWithFallback(source, destination, mode) {
  try {
    origCopyFileSync(source, destination, mode)
  } catch (error) {
    if (error && error.code === 'EPERM') {
      ensureParentDirectorySync(destination)
      try {
        fs.rmSync(destination, { force: true, recursive: true })
      } catch {
        // ignore
      }
      fs.cpSync(source, destination, { recursive: true })
      return
    }
    throw error
  }
}

fs.promises.copyFile = copyFileWithFallback
fs.copyFileSync = copyFileSyncWithFallback

function copyRecursive(source, destination) {
  const stat = fs.statSync(source)
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true })
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(destination, entry))
    }
  } else {
    fs.copyFileSync(source, destination)
  }
}

function materializeNodeModules(baseDir) {
  if (!baseDir) return
  try {
    const pnpmDir = path.join(baseDir, '.pnpm')
    if (!fs.existsSync(pnpmDir)) return
    const packages = fs.readdirSync(pnpmDir, { withFileTypes: true })
    for (const entry of packages) {
      if (!entry.isDirectory()) continue
      const nm = path.join(pnpmDir, entry.name, 'node_modules')
      if (!fs.existsSync(nm)) continue
      for (const pkgName of fs.readdirSync(nm)) {
        const source = path.join(nm, pkgName)
        const dest = path.join(baseDir, pkgName)
        if (fs.existsSync(dest)) continue
        try {
          if (origCpSync) {
            origCpSync(source, dest, { recursive: true })
          } else {
            copyRecursive(source, dest)
          }
        } catch (error) {
          console.warn(`[win-symlink-fallback] Failed to materialize ${pkgName} into ${baseDir}`, error.message)
        }
      }
    }
  } catch (error) {
    console.warn('[win-symlink-fallback] Materialization error', error.message)
  }
}

function findNodeModulesBase(targetPath) {
  let current = targetPath
  while (current && current !== path.dirname(current)) {
    if (path.basename(current) === 'node_modules') return current
    current = path.dirname(current)
  }
  return null
}

if (origCpSync) {
  fs.cpSync = function patchedCpSync(source, destination, options) {
    const result = origCpSync(source, destination, options)
    const base = findNodeModulesBase(destination)
    if (base) materializeNodeModules(base)
    return result
  }
}

if (origCpPromise) {
  fs.promises.cp = async function patchedCpPromise(source, destination, options) {
    const result = await origCpPromise(source, destination, options)
    const base = findNodeModulesBase(destination)
    if (base) materializeNodeModules(base)
    return result
  }
}
