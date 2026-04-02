import express from "express";
import type { Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import { pdf_stream } from "./controllers/pdf-controller.js";

const app = express();

// Base JSON parsing for API Gateway/ALB requests.
app.use(express.json());

// Healthcheck route.
app.get("/", pdf_stream);

app.post("/pdf-stream", pdf_stream);

// Global error handler.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error(err);
	return res.status(500).json({ message: "Internal Server Error" });
});

export const handler = serverless(app);
