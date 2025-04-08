import { App, getEnv } from "../core";

export const queue = {
	send: async (
		event: string,
		payload: { [key: string]: any },
		delaySeconds: number,
	) => {
		const getQueueConneciton = getEnv(App.config.queue.bindingName);

		await getQueueConneciton.send(
			{ event: event, payload: payload },
			{ delaySeconds: delaySeconds },
		);
	},
};
