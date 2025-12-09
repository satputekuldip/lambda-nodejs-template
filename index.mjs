import express from "express";
import serverless from "serverless-http";
import { sendResponse, sendError } from "./utils/response.js";
import { storeUser, getUser, updateUser } from "./functions/users.js";

const app = express();

app.use(express.json());

// This Route will not work in production
app.get("/", (req, res) => {
	return res.json({
		message: "Hello World",
	});
});

app.post("/user", async (req, res) => {
	try {
		const userData = req.body;
		const result = await storeUser(userData);
		return sendResponse(res, 201, result);
	} catch (error) {
		return sendError(res, 500, error.message);
	}
});

app.get("/user/:id", async (req, res) => {
	try {
		const userId = req.params.id;
		const result = await getUser(userId);
		return sendResponse(res, 200, result);
	} catch (error) {
		return sendError(res, 500, error.message);
	}
});

app.put("/user/:id", async (req, res) => {
	try {
		const userId = req.params.id;
		const userData = req.body;
		const result = await updateUser(userId, userData);
		return sendResponse(res, 200, result);
	} catch (error) {
		return sendError(res, 500, error.message);
	}
});

export const handler = serverless(app);
