/// <reference path="./virtual.d.ts" />
import { type Context } from 'hono'
import viteManifest from 'virtual:flying-worker/manifest'
import { App, AppRequest } from '../core'

// Detect development mode more reliably
const DEV = typeof globalThis !== 'undefined' &&
  (globalThis as any).process?.env?.NODE_ENV !== 'production' &&
  (globalThis as any).process?.env?.NODE_ENV !== undefined


function getAppPath(): string {
  const c = AppRequest.getContext()
  return c.env?.VITE_APP_PATH || 'resources/js'
}

function devTags(): string {
  const c = AppRequest.getContext()
  const base = c.env?.APP_URL || 'http://localhost:5173'
  const appPath = getAppPath()
  const preamble = `<script type="module">
import RefreshRuntime from "${base}/@react-refresh";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (t) => t;
window.__vite_plugin_react_preamble_installed__ = true;
</script>`
  return [
    preamble,
    `<script type="module" src="${base}/@vite/client"></script>`,
    `<script type="module" src="${base}/${appPath}/app.jsx"></script>`,
  ].join('\n')
}

function prodEntryTags(): string {
  const appPath = getAppPath()
  // @ts-ignore
  const entry = viteManifest[`${appPath}/app.jsx`]
  const css = ((entry as any)?.css ?? []).map((h: string) => `<link rel="stylesheet" href="/${h}">`).join('\n')
  const js  = entry ? `<script type="module" src="/${entry.file}"></script>` : ''
  return `${css}\n${js}`
}

function preloadForPage(component: string): string {
  const appPath = getAppPath()
  const candidates = [
    `${appPath}/Pages/${component}.jsx`,
    `${appPath}/Pages/${component}.tsx`,
    `${appPath}/Pages/${component}/Index.jsx`,
    `${appPath}/Pages/${component}/Index.tsx`,
  ]
  const key = candidates.find(k => (viteManifest as any)[k])
  if (!key) return ''

  const seen = new Set<string>()
  const tags: string[] = []

  const walk = (k: string): void => {
    if (seen.has(k)) return
    seen.add(k)
    const e = (viteManifest as any)[k]
    if (!e) return
    if (e.file) tags.push(`<link rel="modulepreload" href="/${e.file}">`)
    for (const imp of (e.imports ?? [])) walk(imp)
    for (const css of ((e as any).css ?? [])) tags.push(`<link rel="stylesheet" href="/${css}">`)
  }

  walk(key)
  return tags.join('\n')
}

function assetTagsFor(component: string): string {
  if (DEV) {
    return devTags()
  }
  return `${prodEntryTags()}\n${preloadForPage(component)}`
}

function getAssetVersion(): string {
  if (DEV) return 'dev'
  try {
    const json = JSON.stringify(viteManifest)
    // Simple hash: sum of char codes mod 2^32
    let h = 0
    for (let i = 0; i < json.length; i++) {
      h = (Math.imul(31, h) + json.charCodeAt(i)) | 0
    }
    return (h >>> 0).toString(16)
  } catch {
    return 'v1'
  }
}

/** Resolve lazy props: call any function values (including async), recurse into nested objects */
async function resolveProps(
  props: Record<string, unknown>,
  only?: string[] | null,
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {}
  const entries = only
    ? Object.entries(props).filter(([key]) => only.includes(key))
    : Object.entries(props)

  for (const [key, value] of entries) {
    if (typeof value === 'function') {
      result[key] = await value()
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = await resolveProps(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result
}

// --- Inertia helpers ---
function isInertia(c: Context): boolean {
  return c.req.header('X-Inertia') === 'true'
}

/** Call this from a middleware or shared handler to add props to every Inertia response */
export function shareInertia(props: Record<string, unknown>): void {
  const c = AppRequest.getContext()
  const existing = c.get('inertia.shared') ?? {}
  c.set('inertia.shared', { ...existing, ...props })
}

export async function inertiaRender(component: string, props: Record<string, any> = {}) {
  const c = AppRequest.getContext()
  const shared = c.get('inertia.shared') ?? {}
  const version = getAssetVersion()

  // --- Pattern 3: asset version mismatch → force reload ---
  if (isInertia(c)) {
    const clientVersion = c.req.header('X-Inertia-Version')
    if (clientVersion && clientVersion !== version) {
      return c.newResponse(null, 409, {
        'X-Inertia-Location': AppRequest.fullurl(),
      })
    }
  }

  // --- Partial reload: only resolve requested props ---
  const partialDataHeader = c.req.header('X-Inertia-Partial-Data')
  const partialComponent  = c.req.header('X-Inertia-Partial-Component')
  const isPartial = isInertia(c) && !!partialDataHeader && partialComponent === component

  const only = isPartial ? partialDataHeader!.split(',').map(s => s.trim()) : null
  const allProps = { ...shared, ...props }
  const resolvedProps = await resolveProps(allProps, only)

  const page = {
    component,
    props: resolvedProps,
    url: AppRequest.pathname(),
    version,
  }

  // --- Pattern 2: XHR navigation ---
  if (isInertia(c)) {
    return c.json(page, 200, { 'X-Inertia': 'true', 'Vary': 'X-Inertia' })
  }

  // --- Pattern 1: first visit — full HTML document rendered with hono/jsx ---
  const RootView = App.config.inertia?.rootView

  if (!RootView) {
    throw new Error(
      "No Inertia root view configured. Set `inertia.rootView` in your config " +
        "(e.g. resources/views/app.tsx).",
    )
  }

  const documentNode = RootView({
    page,
    assets: assetTagsFor(component),
    head: '',
  })

  // JSX can't emit the doctype; prepend it to the rendered document.
  return c.html('<!DOCTYPE html>' + String(documentNode))
}
