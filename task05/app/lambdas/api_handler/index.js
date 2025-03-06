import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import pkg from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const dynamoDBClient = new DynamoDBClient();
const { PutItemCommand } = pkg;

// Ensure TABLE_NAME is correctly set, or use the expected table name
const TABLE_NAME = process.env.TABLE_NAME || "Events";

export const handler = async (event) => {
    try {
        console.log("Received event:", JSON.stringify(event, null, 2));

        // Ensure event.body is parsed correctly
        let inputEvent;
        try {
            inputEvent = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        } catch (parseError) {
            console.error("Error parsing event body:", parseError);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid JSON format in request body" })
            };
        }

        // Validate input fields
        if (!inputEvent?.principalId || inputEvent?.content === undefined) {
            console.error("Validation failed: Missing required fields", inputEvent);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid input: principalId and content are required" })
            };
        }

        // Prepare event data
        const eventId = uuidv4();
        const createdAt = new Date().toISOString();

        const eventItem = {
            id: { S: eventId },
            principalId: { N: inputEvent.principalId.toString() },
            createdAt: { S: createdAt },
            body: { S: JSON.stringify(inputEvent.content) }
        };

        console.log("Saving to DynamoDB:", JSON.stringify(eventItem, null, 2));

        // Store in DynamoDB

        const response = await dynamoDBClient.send(new PutItemCommand({
            TableName: TABLE_NAME,
            Item: eventItem
        }));

        console.log("DynamoDB Response:", response);

        // Prepare and return successful response
        return {
            statusCode: 201,
            body: JSON.stringify({
                event: {
                    id: eventId,
                    principalId: Number(inputEvent.principalId),
                    createdAt,
                    body: inputEvent.content
                }
            })
        };
    } catch (error) {
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error", error: error.message })
        };
    }
};
