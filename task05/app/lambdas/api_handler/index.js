import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutItemCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const dynamoDBClient = new DynamoDBClient({});
const TABLE_NAME = process.env.EVENTS_TABLE_NAME || 'Events';

export const handler = async (event) => {
    try {
        // Logging the entire input event for debugging
        console.log('Received event:', JSON.stringify(event, null, 2));

        // Ensure event is parsed correctly
        const inputEvent = typeof event === 'string' ? JSON.parse(event) : event;

        // Input validation
        if (!inputEvent.principalId || inputEvent.content === undefined) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Invalid input: principalId and content are required'
                })
            };
        }

        // Validate principalId is a number
        const principalId = Number(inputEvent.principalId);
        if (isNaN(principalId)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'principalId must be a number'
                })
            };
        }

        // Generate UUID and current timestamp
        const eventId = uuidv4();
        const createdAt = new Date().toISOString();

        // Prepare event object for DynamoDB
        const eventItem = {
            id: { S: eventId },
            principalId: { N: principalId.toString() },
            createdAt: { S: createdAt },
            body: { S: JSON.stringify(inputEvent.content) }
        };

        // DynamoDB Put Command
        const command = new PutItemCommand({
            TableName: TABLE_NAME,
            Item: eventItem
        });

        // Save to DynamoDB
        await dynamoDBClient.send(command);

        // Prepare response event object
        const responseEvent = {
            id: eventId,
            principalId: principalId,
            createdAt: createdAt,
            body: inputEvent.content
        };

        // Return successful response with exactly 201 status code
        return {
            statusCode: 201,
            body: JSON.stringify({
                event: responseEvent
            })
        };

    } catch (error) {
        console.error('Error processing event:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message
            })
        };
    }
};