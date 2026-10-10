import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import App from "../../Application";
import { AppRequest } from "../index";
import { makeConfig } from "../../__tests__/helpers";

/**
 * Cover for AppRequest file accessors.
 *
 * Uploaded files were flattened to the string `[File: name]` and the FormData
 * was not kept, so there was no supported way to hand an upload to
 * R2FileManager.upload() — despite R2 being a headline feature.
 */

describe("AppRequest file accessors", () => {
	beforeEach(() => {
		App.hono = new Hono();
		App.loadConfig(makeConfig());
		App.basicInit();

		App.hono.post("/upload", async (c) => {
			await AppRequest.initializeBody();

			const avatar = AppRequest.file("avatar");
			const photos = AppRequest.files("photos[]");

			return c.json({
				hasAvatar: AppRequest.hasFile("avatar"),
				hasMissing: AppRequest.hasFile("nope"),
				avatarName: avatar?.name ?? null,
				avatarType: avatar?.type ?? null,
				avatarText: avatar ? await avatar.text() : null,
				photoNames: photos.map((f) => f.name),
				allFileFields: Object.keys(AppRequest.allFiles()),
				data: AppRequest.all(),
				missing: AppRequest.file("nope"),
			});
		});
	});

	const post = (body: FormData) =>
		App.hono.request("/upload", { method: "POST", body });

	function form(): FormData {
		const body = new FormData();
		body.set("title", "My album");
		body.set("avatar", new File(["avatar-bytes"], "me.png", { type: "image/png" }));
		body.append("photos[]", new File(["one"], "1.jpg", { type: "image/jpeg" }));
		body.append("photos[]", new File(["two"], "2.jpg", { type: "image/jpeg" }));
		return body;
	}

	it("returns the uploaded file as a File, with its content intact", async () => {
		const body = (await (await post(form())).json()) as any;

		expect(body.hasAvatar).toBe(true);
		expect(body.avatarName).toBe("me.png");
		expect(body.avatarType).toBe("image/png");
		expect(body.avatarText).toBe("avatar-bytes");
	});

	it("keeps every file of a repeated field", async () => {
		const body = (await (await post(form())).json()) as any;

		expect(body.photoNames).toEqual(["1.jpg", "2.jpg"]);
	});

	it("groups all files by field name", async () => {
		const body = (await (await post(form())).json()) as any;

		expect(body.allFileFields.sort()).toEqual(["avatar", "photos[]"]);
	});

	it("keeps plain fields in the data bag and files out of it", async () => {
		const body = (await (await post(form())).json()) as any;

		expect(body.data).toEqual({ title: "My album" });
	});

	it("keeps query parameters alongside a multipart body", async () => {
		// The point where file handling meets the query/body merge: the form
		// branch must merge its fields over the query string, not replace it.
		const res = await App.hono.request("/upload?page=2", {
			method: "POST",
			body: form(),
		});
		const body = (await res.json()) as any;

		expect(body.data).toEqual({ page: "2", title: "My album" });
		expect(body.avatarName).toBe("me.png");
	});

	it("reports nothing for a field that carried no file", async () => {
		const body = (await (await post(form())).json()) as any;

		expect(body.hasMissing).toBe(false);
		expect(body.missing).toBeNull();
	});
});
