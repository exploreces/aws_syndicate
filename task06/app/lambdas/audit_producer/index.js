import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { 
  DynamoDBClient, 
  PutItemCommand 
} from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const dynamoDBClient = new DynamoDBClient({});
const AUDIT_TABLE_NAME = process.env.AUDIT_TABLE_NAME || 'Audit';

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  for (const record of event.Records) {
    switch (record.eventName) {
      case 'INSERT':
        await handleInsertEvent(record);
        break;
      case 'MODIFY':
        await handleModifyEvent(record);
        break;
    }
  }
};

const handleInsertEvent = async (record: DynamoDBRecord): Promise<void> => {
  const newImage = record.dynamodb?.NewImage;
  if (!newImage) return;

  const auditRecord = {
    id: { S: uuidv4() },
    itemKey: { S: newImage.key.S || '' },
    modificationTime: { S: new Date().toISOString() },
    newValue: { 
      M: {
        key: { S: newImage.key.S || '' },
        value: { N: newImage.value.N || '0' }
      }
    }
  };

  await dynamoDBClient.send(new PutItemCommand({
    TableName: AUDIT_TABLE_NAME,
    Item: auditRecord
  }));
};

const handleModifyEvent = async (record: DynamoDBRecord): Promise<void> => {
  const newImage = record.dynamodb?.NewImage;
  const oldImage = record.dynamodb?.OldImage;
  if (!newImage || !oldImage) return;

  const auditRecord = {
    id: { S: uuidv4() },
    itemKey: { S: newImage.key.S || '' },
    modificationTime: { S: new Date().toISOString() },
    oldValue: { N: oldImage.value.N || '0' },
    newValue: { N: newImage.value.N || '0' }
  };

  await dynamoDBClient.send(new PutItemCommand({
    TableName: AUDIT_TABLE_NAME,
    Item: auditRecord
  }));
};