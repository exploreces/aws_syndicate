import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutItemCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const dynamoDBClient = new DynamoDBClient({});
const TABLE_NAME = process.env.DYNAMODB_TABLE || "Events";

export const handler = async (event) => {
    try {
        console.log("Event received:", JSON.stringify(event, null, 2));

        // Parse event body
        const inputEvent = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

        // Validate input
        if (!inputEvent.principalId || inputEvent.content === undefined) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid input: principalId and content are required" })
            };
        }

        // Generate ID and timestamp
        const eventId = uuidv4();
        const createdAt = new Date().toISOString();

        // Prepare item for DynamoDB
        const eventItem = {
            id: { S: String(eventId) },
            principalId: { N: Number(inputEvent.principalId) },
            createdAt: { S: createdAt },
            body: { S: typeof inputEvent.content === "string" ? inputEvent.content : JSON.stringify(inputEvent.content) }
        };

        // Save to DynamoDB
        const response = await dynamoDBClient.send(new PutItemCommand({ TableName: TABLE_NAME, Item: eventItem }));
        console.log("DynamoDB response:", response);

        // Prepare response
        return {
            statusCode: 201,
            body: JSON.stringify({
                id: eventId,
                principalId: Number(inputEvent.principalId),
                createdAt: createdAt,
                body: typeof inputEvent.content === "string"
                    ? JSON.parse(inputEvent.content)
                    : inputEvent.content
            })
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error", error: error.message })
        };
    }
};
