import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";

describe("Demo Test", () => {
	let req: Partial<Request>;
	let res: Partial<Response>;

	beforeEach(() => {
		req = {};
		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should return a successful response", () => {
		// Simulate a successful response
		res.status(200).json({ message: "Success" });

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ message: "Success" });
	});
});
