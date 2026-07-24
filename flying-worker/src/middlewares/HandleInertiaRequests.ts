import type { Context, Next } from 'hono'
import BaseMiddleware from '../core/abstraction/BaseMiddleware'
import { shareInertia } from '../inertia'

/**
 * Extend this class and override share() to inject shared props into
 * every Inertia response. Register it in config/middlewares.ts under `web`.
 *
 * Example (example/middlewares/HandleInertiaRequests.ts):
 *
 *   import { Session, Auth } from 'flying-worker'
 *   export default class HandleInertiaRequests extends BaseHandleInertiaRequests {
 *     async share() {
 *       return {
 *         auth: {
 *           user: Auth.user(),
 *         },
 *         flash: {
 *           success: () => Session.getFlash('success'),
 *           error:   () => Session.getFlash('error'),
 *         },
 *       }
 *     }
 *   }
 */
export default class HandleInertiaRequests extends BaseMiddleware {
  /**
   * Return the props that should be shared with every Inertia response.
   * Values can be plain data or arrow functions (lazy — evaluated at render time).
   */
  async share(): Promise<Record<string, unknown>> {
    return {}
  }

  public async boot(context: Context, next: Next) {
    const shared = await this.share()
    shareInertia(shared)
    await next()
  }
}
