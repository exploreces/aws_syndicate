import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutItemCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const dynamoDBClient = new DynamoDBClient({});
const TABLE_NAME = process.env.EVENTS_TABLE_NAME;

export const handler = async (event) => {
    try {
        // Parse the body if it's a string
        const inputEvent = typeof event.body === 'string'
            ? JSON.parse(event.body)
            : event.body;

        // Validate input
        if (!inputEvent.principalId || inputEvent.content === undefined) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Invalid input: principalId and content are required'
                })
            };
        }

        // Prepare event item for DynamoDB
        const eventId = uuidv4();
        const createdAt = new Date().toISOString();

        const eventItem = {
            id: { S: eventId },
            principalId: { N: inputEvent.principalId.toString() },
            createdAt: { S: createdAt },
            body: { S: JSON.stringify(inputEvent.content) }
        };

        // Save to DynamoDB
        await dynamoDBClient.send(new PutItemCommand({
            TableName: TABLE_NAME,
            Item: eventItem
        }));

        // Prepare response
        return {
            statusCode: 201,
            body: JSON.stringify({
                event: {
                    id: eventId,
                    principalId: Number(inputEvent.principalId),
                    createdAt: createdAt,
                    body: inputEvent.content
                }
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message
            })
        };
    }
};