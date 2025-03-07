import { v4 as uuidv4 } from 'uuid';

export function request(ctx) {
    try {
        console.log("Incoming request arguments:", JSON.stringify(ctx.arguments));

        const { userId, payLoad } = ctx.arguments;
        const timestamp = new Date().toISOString();
        const eventId = uuidv4();

        console.log("Generated eventId:", eventId);
        console.log("Generated timestamp:", timestamp);

        const requestPayload = {
            operation: 'PutItem',
            key: { id: { S: eventId } },
            attributeValues: {
                userId: { N: userId.toString() },
                createdAt: { S: timestamp },
                payLoad: { S: JSON.stringify(payLoad) }
            }
        };

        console.log("DynamoDB request payload:", JSON.stringify(requestPayload, null, 2));

        return requestPayload;
    } catch (error) {
        console.error("Error in request resolver:", error);
        throw new Error("Failed to process request");
    }
}

export function response(ctx) {
    if (ctx.error) {
        console.error("AppSync resolver error:", JSON.stringify(ctx.error, null, 2));
        throw new Error("Internal Server Error");
    }

    console.log("DynamoDB response:", JSON.stringify(ctx.result, null, 2));

    try {
        const responsePayload = {
            id: ctx.result.id.S,
            createdAt: ctx.result.createdAt.S
        };

        console.log("Formatted response:", JSON.stringify(responsePayload));

        return responsePayload;
    } catch (parseError) {
        console.error("Error parsing response data:", parseError);
        throw new Error("Response processing failed");
    }
}
