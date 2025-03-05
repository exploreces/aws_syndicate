const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutItemCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");


// Initialize DynamoDB client with a region
const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION || "eu-central-1" });

// Get the table name from environment variables
const TABLE_NAME = process.env.demo_table_name || "Events";

if (!TABLE_NAME) {
    console.error("Error: DYNAMODB_TABLE environment variable is not set.");
}

// Lambda function handler
export const handler = async (event) => {
    try {
        console.log("Event received:", JSON.stringify(event, null, 2));

        // Parse event body
        const inputEvent = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        console.log("Parsed Input Event:", inputEvent);

        // Validate input
       if (!inputEvent?.principalId || inputEvent?.content === undefined) {
           return {
               statusCode: 400,
               body: JSON.stringify({ message: "Invalid input: principalId and content are required" }),
           };
       }


        // Generate unique ID and timestamp
        const eventId = uuidv4();
        const createdAt = new Date().toISOString();

        // Prepare item for DynamoDB
        const eventItem = {
            id: { S: eventId },
            principalId: { N: String(inputEvent.principalId) }, // Ensure number is stored as a string
            createdAt: { S: createdAt },
            body: { S: typeof inputEvent.content === "string" ? inputEvent.content : JSON.stringify(inputEvent.content) },
        };

        console.log("Prepared DynamoDB Item:", JSON.stringify(eventItem, null, 2));

        // Save to DynamoDB
        const response = await dynamoDBClient.send(new PutItemCommand({ TableName: TABLE_NAME, Item: eventItem }));
        console.log("DynamoDB Response:", response);

        // Return success response
        return {
            statusCode: 201,
            body: JSON.stringify({
                id: eventId,
                principalId: Number(inputEvent.principalId),
                createdAt: createdAt,
                body: typeof inputEvent.content === "string"
                    ? JSON.parse(inputEvent.content)
                    : inputEvent.content
            }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error !", error: error.message }),
        };
    }
};
