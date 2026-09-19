import { describe, it, expect } from "vitest"
import { resolveProps } from "../resolve-props"

/**
 * Regression cover for: Promise props resolved to `{}`.
 *
 * `resolveProps` awaited function values but not Promises. A Promise is
 * `typeof 'object'` and not an array, so it fell into the recursion branch,
 * `Object.entries(promise)` returned `[]`, and the prop became `{}` — with no
 * error. The framework's own `HandleInertiaRequests` example passes
 * `user: Auth.user()`, which returns a Promise, so copying the docs produced
 * `auth.user === {}` on the client.
 */

describe("resolveProps", () => {
  it("awaits a Promise prop", async () => {
    const user = { id: 1, name: "Ada" }

    expect(await resolveProps({ user: Promise.resolve(user) })).toEqual({ user })
  })

  it("awaits a Promise nested inside a plain object", async () => {
    const resolved = await resolveProps({
      auth: { user: Promise.resolve({ id: 1 }), guest: false },
    })

    expect(resolved).toEqual({ auth: { user: { id: 1 }, guest: false } })
  })

  it("awaits a non-native thenable", async () => {
    const thenable = { then: (fn: (v: unknown) => void) => fn("done") }

    expect(await resolveProps({ value: thenable })).toEqual({ value: "done" })
  })

  it("preserves a Date instead of flattening it to {}", async () => {
    const created = new Date("2024-01-01T00:00:00.000Z")
    const resolved = await resolveProps({ post: { title: "Hi", created } })

    expect((resolved.post as { created: Date }).created).toBeInstanceOf(Date)
    expect((resolved.post as { created: Date }).created.toISOString()).toBe(
      "2024-01-01T00:00:00.000Z",
    )
  })

  it("preserves a class instance", async () => {
    class Money {
      constructor(public readonly cents: number) {}
    }
    const resolved = await resolveProps({ price: new Money(500) })

    expect(resolved.price).toBeInstanceOf(Money)
    expect((resolved.price as Money).cents).toBe(500)
  })

  it("still calls lazy function props, sync and async", async () => {
    const resolved = await resolveProps({
      sync: () => 1,
      async: async () => 2,
    })

    expect(resolved).toEqual({ sync: 1, async: 2 })
  })

  it("resolves Promises inside arrays", async () => {
    const resolved = await resolveProps({
      posts: [Promise.resolve({ id: 1 }), { id: 2 }],
    })

    expect(resolved).toEqual({ posts: [{ id: 1 }, { id: 2 }] })
  })

  it("keeps null and primitive props untouched", async () => {
    const resolved = await resolveProps({ a: null, b: 0, c: "", d: false })

    expect(resolved).toEqual({ a: null, b: 0, c: "", d: false })
  })

  it("drops keys outside `only` without resolving them", async () => {
    let called = false
    const resolved = await resolveProps(
      {
        kept: Promise.resolve("yes"),
        dropped: () => {
          called = true
          return "no"
        },
      },
      ["kept"],
    )

    expect(resolved).toEqual({ kept: "yes" })
    expect(called).toBe(false)
  })
})
