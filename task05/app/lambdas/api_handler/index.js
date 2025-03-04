const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require("uuid");

const TABLE_NAME = "Events";

exports.handler = async (event) => {
    try {
        console.log("Received event:", JSON.stringify(event));

        if (!event.body) {
            throw new Error("Missing event body");
        }

        const requestBody = JSON.parse(event.body);
        if (!requestBody.title || !requestBody.description) {
            throw new Error("Missing required fields: title and/or description");
        }

        const newEvent = {
            id: uuidv4(),
            principalId: 10, // Assuming a fixed value, you can change this as needed
            createdAt: new Date().toISOString(),
            body: requestBody,
        };

        // Save event to DynamoDB
        await dynamoDB.put({
            TableName: TABLE_NAME,
            Item: newEvent,
        }).promise();

        console.log("Event saved successfully:", JSON.stringify(newEvent));

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
