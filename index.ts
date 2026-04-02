import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
	event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
	let response: APIGatewayProxyResult;
	try {
		response = {
			statusCode: 200,
			body: JSON.stringify({
				message: "hello SAM",
			}),
		};
	} catch (err) {
		console.log(err);
		response = {
			statusCode: 500,
			body: JSON.stringify({
				message: "some error happened",
			}),
		};
	}

	return response;
};
