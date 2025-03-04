exports.handler = async (event) => {
    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusCode: 200, message: "Hello from Lambda" }),
    };
};
