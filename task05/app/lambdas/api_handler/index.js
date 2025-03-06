import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const dynamoDBClient = new DynamoDBClient();
const TABLE_NAME = process.env.TABLE_NAME || "Events";

export const handler = async (event) => {
    try {
        console.log("Received event:", JSON.stringify(event, null, 2));

        let inputEvent;
        try {
            inputEvent = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        } catch (parseError) {
            console.error("Error parsing event body:", parseError);
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Invalid JSON format in request body" })
            };
        }

        if (!inputEvent?.principalId || inputEvent?.content === undefined) {
            console.error("Validation failed: Missing required fields", inputEvent);
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Invalid input: principalId and content are required" })
            };
        }

        const eventId = uuidv4();
        const createdAt = new Date().toISOString();

        // Store 'body' as a DynamoDB Map (not a string)
        const eventItem = {
            id: { S: eventId },
            principalId: { N: inputEvent.principalId.toString() },
            createdAt: { S: createdAt },
            body: { M: inputEvent.content }  // ✅ Fix: Store as an object instead of string
        };

        console.log("Saving to DynamoDB:", JSON.stringify(eventItem, null, 2));

        await dynamoDBClient.send(new PutItemCommand({
            TableName: TABLE_NAME,
            Item: eventItem
        }));

        console.log("DynamoDB save successful");

        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Internal server error", error: error.message })
        };
    }
};