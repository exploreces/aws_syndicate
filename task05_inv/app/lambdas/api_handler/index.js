const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutItemCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION || "eu-central-1" });
const TABLE_NAME = process.env.target_table || "Events";

export const handler = async (event) => {
    try {
        console.log("Event received:", JSON.stringify(event, null, 2));

        // Parse input event body
        const inputEvent = typeof event.body === "string"
            ? JSON.parse(event.body)
            : event.body;

        console.log("Parsed Input Event:", inputEvent);

        // Validate input
        if (!inputEvent?.principalId || inputEvent?.content === undefined) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Invalid input: principalId and content are required",
                    receivedEvent: inputEvent
                }),
            };
        }

        const eventId = uuidv4();
        const createdAt = new Date().toISOString();

        // Prepare DynamoDB item
        const eventItem = {
            id: { S: eventId },
            principalId: { N: String(inputEvent.principalId) },
            createdAt: { S: createdAt },
            body: { S: typeof inputEvent.content === "string"
                ? inputEvent.content
                : JSON.stringify(inputEvent.content)
            },
            event: { S: JSON.stringify({
                id: eventId,
                principalId: Number(inputEvent.principalId),
                createdAt: createdAt,
                body: inputEvent.content
            })}
        };

        console.log("Prepared DynamoDB Item:", JSON.stringify(eventItem, null, 2));

        // Send item to DynamoDB
        const response = await dynamoDBClient.send(
            new PutItemCommand({
                TableName: TABLE_NAME,
                Item: eventItem
            })
        );

        console.log("DynamoDB Response:", response);

        // Return response
        return {
            statusCode: 201,
            body: JSON.stringify({
                id: eventId,
                principalId: Number(inputEvent.principalId),
                createdAt: createdAt,
                body: inputEvent.content
            }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Internal server error!",
                error: error.message
            }),
        };
    }
};