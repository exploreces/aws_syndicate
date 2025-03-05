import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutItemCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const dynamoDBClient = new DynamoDBClient({});
const TABLE_NAME = process.env.EVENTS_TABLE_NAME || 'Events';

export const handler = async (event) => {
    try {
        // Input validation
        if (!event.principalId || !event.content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'Invalid input: principalId and content are required' 
                })
            };
        }

        // Validate principalId is a number
        const principalId = Number(event.principalId);
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
            id: eventId,
            principalId: principalId,
            createdAt: createdAt,
            body: event.content
        };

        // DynamoDB Put Command
        const command = new PutItemCommand({
            TableName: TABLE_NAME,
            Item: eventItem
        });

        // Save to DynamoDB
        await dynamoDBClient.send(command);

        // Return successful response
        return {
            statusCode: 201,
            body: JSON.stringify({
                event: eventItem
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