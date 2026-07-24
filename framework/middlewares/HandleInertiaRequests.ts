import { HandleInertiaRequests as BaseHandleInertiaRequests } from 'flying-worker/middlewares'
import { Session } from 'flying-worker/session'

export default class HandleInertiaRequests extends BaseHandleInertiaRequests {
  async share() {
    return {
      flash: {
        success: () => Session.get('success'),
        error:   () => Session.get('error'),
      },
    }
  }
}
