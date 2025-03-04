const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

// Initialize DynamoDB Document Client
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Events"; // DynamoDB table name

exports.handler = async (event) => {
    try {
        // Parse request body
        const requestBody = JSON.parse(event.body);
        const { principalId, content } = requestBody;

        // Validate input
        if (!principalId || typeof content !== "object") {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid request payload" }),
            };
        }

        // Generate unique event ID and timestamp
        const newEvent = {
            id: uuidv4(),
            principalId: principalId,
            createdAt: new Date().toISOString(),
            body: content,
        };

        // Save event to DynamoDB
        await dynamoDB.put({
            TableName: TABLE_NAME,
            Item: newEvent,
        }).promise();

        // Return successful response
        return {
            statusCode: 201,
            body: JSON.stringify({ statusCode: 201, event: newEvent }),
        };
    } catch (error) {
        console.error("Error saving event:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
