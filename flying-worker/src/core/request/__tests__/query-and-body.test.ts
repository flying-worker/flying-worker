import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import App from "../../Application";
import { AppRequest } from "../index";
import { makeConfig } from "../../__tests__/helpers";

/**
 * Regression cover for: parsing the body discarded the query string.
 *
 * parseUrl() runs in the constructor and seeds requestData with the query
 * parameters; parseRequestBody() then assigned over the whole object, so
 * `POST /search?page=2` with a JSON body lost `page`.
 */

describe("AppRequest query + body merging", () => {
	beforeEach(() => {
		App.hono = new Hono();
		App.loadConfig(makeConfig());
		App.basicInit();

		App.hono.all("/echo", async (c) => {
			await AppRequest.initializeBody();
			return c.json(AppRequest.all());
		});
	});

	const post = (url: string, body: string, contentType: string) =>
		App.hono.request(url, {
			method: "POST",
			headers: { "content-type": contentType },
			body,
		});

	it("keeps query parameters alongside a JSON body", async () => {
		const res = await post(
			"/echo?page=2&sort=asc",
			JSON.stringify({ term: "hono" }),
			"application/json",
		);

		expect(await res.json()).toEqual({ page: "2", sort: "asc", term: "hono" });
	});

	it("keeps query parameters alongside a form body", async () => {
		const res = await post(
			"/echo?page=2",
			"term=hono",
			"application/x-www-form-urlencoded",
		);

		expect(await res.json()).toEqual({ page: "2", term: "hono" });
	});

	it("lets the body win on a key collision", async () => {
		const res = await post(
			"/echo?term=from-query",
			JSON.stringify({ term: "from-body" }),
			"application/json",
		);

		expect(await res.json()).toEqual({ term: "from-body" });
	});

	it("keeps query parameters when the body is unparseable", async () => {
		const res = await post("/echo?page=2", "{not json", "application/json");

		expect(await res.json()).toEqual({ page: "2" });
	});

	it("keeps query parameters for a GET request", async () => {
		const res = await App.hono.request("/echo?page=3");

		expect(await res.json()).toEqual({ page: "3" });
	});

	it("ignores a top-level array body rather than corrupting the data bag", async () => {
		const res = await post("/echo?page=2", JSON.stringify([1, 2]), "application/json");

		expect(await res.json()).toEqual({ page: "2" });
	});
});
