const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutItemCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");


const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION || "eu-central-1" });
const TABLE_NAME = "Events";


if (!TABLE_NAME) {
    console.error("Error: DYNAMODB_TABLE environment variable is not set.");
}


export const handler = async (event) => {
    try {
        console.log("Event received:", JSON.stringify(event, null, 2));

        const inputEvent = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        console.log("Parsed Input Event:", inputEvent);

       if (!inputEvent?.principalId || inputEvent?.content === undefined) {
           return {
               statusCode: 400,
               body: JSON.stringify({ message: "Invalid input: principalId and content are required" }),
           };
       }

        const eventId = uuidv4();
        const createdAt = new Date().toISOString();

        const eventItem = {
            id: { S: eventId },
            principalId: { N: String(inputEvent.principalId) },
            createdAt: { S: createdAt },
            body: { S: typeof inputEvent.content === "string" ? inputEvent.content : JSON.stringify(inputEvent.content) },
        };

        console.log("Prepared DynamoDB Item:", JSON.stringify(eventItem, null, 2));

        const response = await dynamoDBClient.send(new PutItemCommand({ TableName: TABLE_NAME, Item: eventItem }));
        console.log("DynamoDB Response:", response);

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




