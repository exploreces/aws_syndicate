const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require("uuid");

const dynamoDBClient = new DynamoDBClient({});
const AUDIT_TABLE_NAME = process.env.demo_table_name || 'Audit';

exports.handler = async (event) => {
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
    }
  }
};

const handleInsertEvent = async (record) => {
  const newImage = record.dynamodb?.NewImage;
  if (!newImage) {
    console.warn('No NewImage found in INSERT event');
    return;
  }

  const auditRecord = {
    id: { S: uuidv4() },
    itemKey: { S: newImage.key?.S || '' },
    modificationTime: { S: new Date().toISOString() },
    newValue: {
      M: {
        key: { S: newImage.key?.S || '' },
        value: { N: newImage.value?.N || '0' }
      }
    }
  };

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

  const auditRecord = {
    id: { S: uuidv4() },
    itemKey: { S: newImage.key?.S || '' },
    modificationTime: { S: new Date().toISOString() },
    oldValue: { N: oldImage.value?.N || '0' },
    newValue: { N: newImage.value?.N || '0' }
  };

  await dynamoDBClient.send(new PutItemCommand({
    TableName: AUDIT_TABLE_NAME,
    Item: auditRecord
  }));
};