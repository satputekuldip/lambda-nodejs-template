import type { Request, Response, NextFunction } from "express";

export const pdf_stream = async (
	_req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		res.status(200).json({
			message: "hello SAM aassaa",
		});
	} catch (err) {
		next(err);
	}
};
