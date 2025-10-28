#!/usr/bin/env node

/**
 * Clean Next.js cache after build
 * This removes large webpack cache files that exceed Cloudflare Pages 25 MiB limit
 */

const fs = require('fs')
const path = require('path')

const cacheDir = path.join(__dirname, '..', '.next', 'cache')

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file)
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath)
      } else {
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(folderPath)
  }
}

console.log('🧹 Cleaning Next.js cache for Cloudflare Pages...')

if (fs.existsSync(cacheDir)) {
  try {
    deleteFolderRecursive(cacheDir)
    console.log('✅ Cache directory removed successfully')
    console.log('   This prevents 25 MiB file size limit errors on Cloudflare Pages')
  } catch (error) {
    console.error('❌ Failed to remove cache:', error.message)
    // Don't fail the build if cache cleanup fails
    process.exit(0)
  }
} else {
  console.log('ℹ️  No cache directory found (already clean)')
}
