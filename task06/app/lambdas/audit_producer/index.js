const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require("uuid");

const dynamoDBClient = new DynamoDBClient({});
const AUDIT_TABLE_NAME = process.env.AUDIT_TABLE_NAME || 'Audit';

exports.handler = async (event) => {
  console.log('Processing event:', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      console.log('Processing record:', JSON.stringify(record));

      switch (record.eventName) {
        case 'INSERT':
          await handleInsertEvent(record);
          break;
        case 'MODIFY':
          await handleModifyEvent(record);
          break;
      }
    } catch (error) {
      console.error('Error processing record:', error);
      throw error; // Rethrow to ensure Lambda fails and retries
    }
  }

  return { statusCode: 200 };
};

const handleInsertEvent = async (record) => {
  const newImage = record.dynamodb?.NewImage;
  if (!newImage) {
    console.warn('No NewImage found in INSERT event');
    return;
  }

  const key = newImage.key?.S;
  const value = parseInt(newImage.value?.N || '0');

  const auditRecord = {
    id: { S: uuidv4() },
    itemKey: { S: key || '' },
    modificationTime: { S: new Date().toISOString() },
    newValue: {
      M: {
        key: { S: key || '' },
        value: { N: value.toString() }
      }
    }
  };

  console.log('Saving INSERT audit record:', JSON.stringify(auditRecord));

  await dynamoDBClient.send(new PutItemCommand({
    TableName: AUDIT_TABLE_NAME,
    Item: auditRecord
  }));
};

const handleModifyEvent = async (record) => {
  const newImage = record.dynamodb?.NewImage;
  const oldImage = record.dynamodb?.OldImage;
  if (!newImage || !oldImage) {
    console.warn('Missing NewImage or OldImage in MODIFY event');
    return;
  }

  const key = newImage.key?.S;
  const newValue = parseInt(newImage.value?.N || '0');
  const oldValue = parseInt(oldImage.value?.N || '0');

  const auditRecord = {
    id: { S: uuidv4() },
    itemKey: { S: key || '' },
    modificationTime: { S: new Date().toISOString() },
    updatedAttribute: { S: "value" },
    oldValue: { N: oldValue.toString() },
    newValue: { N: newValue.toString() }
  };

  console.log('Saving MODIFY audit record:', JSON.stringify(auditRecord));

  await dynamoDBClient.send(new PutItemCommand({
    TableName: AUDIT_TABLE_NAME,
    Item: auditRecord
  }));
};