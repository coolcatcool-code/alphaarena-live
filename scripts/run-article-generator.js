/**
 * 文章生成器运行脚本
 * 使用方法：node scripts/run-article-generator.js
 */

require('dotenv').config({ path: '.env.local' })
require('ts-node/register')
require('./generate-article.ts')
