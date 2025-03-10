import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Environment Variables (Injected by AWS-Syndicate Aliases)
const USER_POOL_ID = process.env.booking_userpool;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const TABLES_TABLE = process.env.tables_table;
const RESERVATIONS_TABLE = process.env.reservations_table;

const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Helper: Validate Token
const validateToken = async (token) => {
    try {
        const params = { AccessToken: token };
        const response = await cognito.getUser(params).promise();
        return response;
    } catch (error) {
        return null;
    }
};

// Signup Handler
export const signup = async (event) => {
    try {
        const { firstName, lastName, email, password } = JSON.parse(event.body);
        const params = {
            UserPoolId: USER_POOL_ID,
            Username: email,
            TemporaryPassword: password,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'given_name', Value: firstName },
                { Name: 'family_name', Value: lastName }
            ],
            MessageAction: 'SUPPRESS' // Avoid email quota issues
        };
        await cognito.adminCreateUser(params).promise();
        return { statusCode: 200, body: JSON.stringify({ message: 'Signup successful' }) };
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
};

// Signin Handler
export const signin = async (event) => {
    try {
        const { email, password } = JSON.parse(event.body);
        const params = {
            AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
            UserPoolId: USER_POOL_ID,
            ClientId: COGNITO_CLIENT_ID,
            AuthParameters: { USERNAME: email, PASSWORD: password }
        };
        const data = await cognito.adminInitiateAuth(params).promise();
        return { statusCode: 200, body: JSON.stringify({ accessToken: data.AuthenticationResult.IdToken }) };
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Authentication failed' }) };
    }
};

// Get Tables
export const getTables = async (event) => {
    if (!validateToken(event.headers.Authorization)) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    try {
        const data = await dynamoDB.scan({ TableName: TABLES_TABLE }).promise();
        return { statusCode: 200, body: JSON.stringify({ tables: data.Items }) };
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Could not fetch tables' }) };
    }
};

// Create Table
export const createTable = async (event) => {
    if (!validateToken(event.headers.Authorization)) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    try {
        const table = JSON.parse(event.body);
        await dynamoDB.put({ TableName: TABLES_TABLE, Item: table }).promise();
        return { statusCode: 200, body: JSON.stringify({ id: table.id }) };
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Could not create table' }) };
    }
};

// Get Table by ID
export const getTableById = async (event) => {
    if (!validateToken(event.headers.Authorization)) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    try {
        const tableId = event.pathParameters.tableId;
        const data = await dynamoDB.get({ TableName: TABLES_TABLE, Key: { id: parseInt(tableId) } }).promise();
        if (!data.Item) return { statusCode: 404, body: JSON.stringify({ error: 'Table not found' }) };
        return { statusCode: 200, body: JSON.stringify(data.Item) };
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Could not fetch table' }) };
    }
};

// Create Reservation
export const createReservation = async (event) => {
    if (!validateToken(event.headers.Authorization)) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    try {
        const reservation = JSON.parse(event.body);
        const reservationId = uuidv4();
        await dynamoDB.put({ TableName: RESERVATIONS_TABLE, Item: { ...reservation, reservationId } }).promise();
        return { statusCode: 200, body: JSON.stringify({ reservationId }) };
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Could not create reservation' }) };
    }
};

// Get Reservations
export const getReservations = async (event) => {
    if (!validateToken(event.headers.Authorization)) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    try {
        const data = await dynamoDB.scan({ TableName: RESERVATIONS_TABLE }).promise();
        return { statusCode: 200, body: JSON.stringify({ reservations: data.Items }) };
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Could not fetch reservations' }) };
    }
};
