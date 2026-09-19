/**
 * Prop resolution for Inertia responses.
 *
 * Lives in its own module so it can be unit-tested without pulling in the
 * `virtual:flying-worker/manifest` import that `./index` depends on.
 */

/**
 * True only for `{}`-shaped objects.
 *
 * Dates, Maps, class instances and the like must be passed through untouched:
 * `Object.entries()` on a Date yields `[]`, so walking one would flatten every
 * model timestamp to `{}`.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/** True for anything await-able, including non-native thenables. */
function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

/** Resolve a single prop value, recursing through arrays and plain objects. */
async function resolveValue(value: unknown): Promise<unknown> {
  // Lazy props: `posts: () => db.posts()`, sync or async.
  if (typeof value === 'function') {
    return resolveValue(await (value as () => unknown)())
  }

  // Promise props: `user: Auth.user()` — the documented shape.
  if (isThenable(value)) {
    return resolveValue(await value)
  }

  if (Array.isArray(value)) {
    const resolved: unknown[] = []
    for (const item of value) {
      resolved.push(await resolveValue(item))
    }
    return resolved
  }

  if (isPlainObject(value)) {
    const resolved: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      resolved[key] = await resolveValue(item)
    }
    return resolved
  }

  return value
}

/**
 * Resolve every prop on a page.
 *
 * Function values are called and Promise values awaited, at any depth. When
 * `only` is given (a partial reload), the other top-level keys are dropped
 * before resolution, so their work is never performed.
 */
export async function resolveProps(
  props: Record<string, unknown>,
  only?: string[] | null,
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {}
  const entries = only
    ? Object.entries(props).filter(([key]) => only.includes(key))
    : Object.entries(props)

  for (const [key, value] of entries) {
    result[key] = await resolveValue(value)
  }

  return result
}
