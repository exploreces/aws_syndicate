const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const AUDIT_TABLE = process.env.AUDIT_TABLE || "Audit";

exports.handler = async (event) => {
    console.log("Event received:", JSON.stringify(event, null, 2));

    try {
        for (const record of event.Records) {
            if (record.eventName === "INSERT") {
                await handleInsert(record);
            } else if (record.eventName === "MODIFY") {
                await handleModify(record);
            }
        }
        return { statusCode: 200, body: "Audit processed" };
    } catch (error) {
        console.error("Error:", error);
        return { statusCode: 500, body: "Error processing audit" };
    }
};

async function handleInsert(record) {
    const newItem = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
    const auditEntry = {
        id: uuidv4(),
        itemKey: newItem.key || "UNKNOWN_KEY",
        modificationTime: new Date().toISOString(),
        newValue: newItem
    };

    console.log("Insert Entry:", auditEntry);
    await saveToAuditTable(auditEntry);
}

async function handleModify(record) {
    const oldItem = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage);
    const newItem = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);

    let changes = {};
    for (let key in newItem) {
        if (newItem[key] !== oldItem[key]) {
            changes[key] = { old: oldItem[key], new: newItem[key] };
        }
    }

    if (Object.keys(changes).length > 0) {
        const auditEntry = {
            id: uuidv4(),
            itemKey: newItem.key || "UNKNOWN_KEY",
            modificationTime: new Date().toISOString(),
            changes
        };

        console.log("Modify Entry:", auditEntry);
        await saveToAuditTable(auditEntry);
    }
}

async function saveToAuditTable(entry) {
    await dynamodb.put({ TableName: AUDIT_TABLE, Item: entry }).promise();
}
