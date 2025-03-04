const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require("uuid"); // Ensure UUID generation

const TABLE_NAME = "Events";

exports.handler = async (event) => {
    try {
        console.log("Received event:", JSON.stringify(event));

        const requestBody = JSON.parse(event.body);
        const newEvent = {
            id: uuidv4(),
            title: requestBody.title,
            description: requestBody.description,
            createdAt: new Date().toISOString(),
        };

        // Save event to DynamoDB
        await dynamoDB.put({
            TableName: TABLE_NAME,
            Item: newEvent,
        }).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Event created successfully", newEvent }),
        };

    } catch (error) {
        console.error("Error saving event:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};
