exports.handler = async (event) => {
    // Extract request path and method
    const path = event.rawPath || event.path || "/";
    const method = event.requestContext?.http?.method || event.httpMethod || "UNKNOWN";

    // Handle /hello GET request
    if (path === "/hello" && method === "GET") {
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statusCode: 200, message: "Hello from Lambda" }),
        };
    }

    // Handle all other requests with a 400 error
    return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            statusCode: 400,
            message: `Bad request. Path: ${path}, Method: ${method}`,
        }),
    };
};
