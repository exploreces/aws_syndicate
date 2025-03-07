export function request(ctx) {
    try {
        console.log("Incoming request arguments:", JSON.stringify(ctx.arguments)); // Log input

        return {
            operation: 'GetItem',
            key: { id: { S: ctx.arguments.id } }
        };
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

    if (!ctx.result) {
        console.warn("No result found for ID:", ctx.arguments.id);
        return null;
    }

    console.log("DB result:", JSON.stringify(ctx.result, null, 2)); // Log raw DynamoDB response

    try {
        const event = {
            id: ctx.result.id.S,
            userId: parseInt(ctx.result.userId.N, 10),
            createdAt: ctx.result.createdAt.S,
            payLoad: JSON.parse(ctx.result.payLoad.S)
        };

        console.log("Parsed response:", JSON.stringify(event)); // Log formatted response
        return event;
    } catch (parseError) {
        console.error("Error parsing response data:", parseError);
        throw new Error("Response processing failed");
    }
}
