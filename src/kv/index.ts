import { parseLifetime } from "../cookie";
import { getEnv } from "../core";

const KvNamespace = getEnv(getEnv("KV_BINDING_NAME", "kv"));

export const KV = {
	set: async (
		key: string,
		value: any,
		expiry: string | number = "5d", // must be second in number, or 1s, 1m, 1h, 1d
	) => {
		const data = { data: value };

		const ttl = typeof expiry === "number" ? expiry : parseLifetime(expiry);

		await KvNamespace.put(key, JSON.stringify(data), {
			expirationTtl: ttl,
		});
	},
	get: async (key: string) => {
		const data = await KvNamespace.get(key);
		if (data) {
			const value = JSON.parse(data);

			return value.data;
		}

		return null;
	},
	delete: (key: string) => {
		KvNamespace.delete(key);
	},
	list: async () => {
		return await KvNamespace.list();
	},
};
