import { Context } from "hono";
import ApiAuth from "../src/auth/ApiAuth"
import MainEventListener from "../Listener/MainEventListener"
import {Str} from "../src/supports";
import {getEnv} from "../src/core";
import {csrfToken} from "../src/supports";
import {Event} from "../src/event";

import { eventListener } from "../config/event-listener";



export class UserController {
	async index(context: Context) {

		const dd = getEnv('kv')
		console.log(dd)

		// const user: ApiTokenPayload = {
		// 	name: "test",
		// 	user: {
		// 		id: 2,
		// 		name: "Admin",
		// 		email: "admin@admin.com",
		// 	},
		// 	permissions: ["admin"],
		// 	expiresInDays: 100,
		// };


		return context.json({
			payload: await ApiAuth.user(),
			//token: token,
		});


	}

	async testWeb(c: Context) {


		// dd.delete("hello", "okokokok")

		// const dd = await JwtAuth.createToken({
		// 	name: "basic test",
		// 	user: {
		// 		id: 2,
		// 		name: "Emran",
		// 		email: "emran@doplac.com"
		// 	},
		// 	guard: 'api',
		// 	permissions: ['admin'],
		// 	maxAge: '5d'
		//
		// });


		/**
		 * @type {keyof typeof eventListener}
		 */
		const eventName: string = 'test-event'

		await Event.dispatch(eventName,     "emran").delay()


		// await Event.dispatch(eventName).process()

		return c.json({
			message:  "Event Test success !",
		});
	}



	async user(c: Context) {

		const now = (Date.now() / 1e3) | 0;
		return c.json({
			user:  Str.slug("hello & bd"),
		});
	}

	delete(c: Context) {
		return c.text("DELETE /users/:id");
	}
}
