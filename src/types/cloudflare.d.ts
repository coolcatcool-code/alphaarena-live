/// <reference types="@cloudflare/workers-types" />

// Re-export D1Database from Cloudflare Workers types
declare global {
  type D1Database = import('@cloudflare/workers-types').D1Database
}

export {}
