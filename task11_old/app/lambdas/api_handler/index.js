const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({ region: 'us-east-1' });
const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const USER_POOL_ID = process.env.booking_userpool;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const TABLES_TABLE = process.env.tables_table;
const RESERVATIONS_TABLE = process.env.reservations_table;

async function validateToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.split(' ')[1];
    try {
        const user = await cognito.getUser({ AccessToken: token }).promise();
        return user;
    } catch (err) {
        return false;
    }
}

exports.handler = async (event) => {
    try {
        const { path, httpMethod, body, headers } = event;
        let requestBody = body ? JSON.parse(body) : {};

        if (path === '/signup' && httpMethod === 'POST') {
            const { firstName, lastName, email, password } = requestBody;
            if (!email || !password.match(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[$%^*-_])[A-Za-z\d$%^*-_]{12,}$/)) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request' }) };
            }

            await cognito.adminCreateUser({
                UserPoolId: USER_POOL_ID,
                Username: email,
                UserAttributes: [
                    { Name: 'email', Value: email },
                    { Name: 'given_name', Value: firstName },
                    { Name: 'family_name', Value: lastName }
                ],
                MessageAction: 'SUPPRESS'
            }).promise();

            await cognito.adminSetUserPassword({
                UserPoolId: USER_POOL_ID,
                Username: email,
                Password: password,
                Permanent: true
            }).promise();

            return { statusCode: 200, body: JSON.stringify({ message: 'Signup successful' }) };
        }

        if (path === '/signin' && httpMethod === 'POST') {
            const { email, password } = requestBody;
            const params = {
                AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
                UserPoolId: USER_POOL_ID,
                ClientId: CLIENT_ID,
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password
                }
            };

            const data = await cognito.adminInitiateAuth(params).promise();
            return { statusCode: 200, body: JSON.stringify({ id_token: data.AuthenticationResult.IdToken }) };
        }

        if (path === '/tables' && httpMethod === 'GET') {
            if (!await validateToken(headers.Authorization)) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Unauthorized' }) };
            }
            const tables = await dynamoDb.scan({ TableName: TABLES_TABLE }).promise();
            return { statusCode: 200, body: JSON.stringify({ tables: tables.Items }) };
        }

        if (path === '/tables' && httpMethod === 'POST') {
            if (!await validateToken(headers.Authorization)) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Unauthorized' }) };
            }
            const { id, number, places, isVip, minOrder } = requestBody;
            if (!id || !number || !places || typeof isVip !== 'boolean') {
                return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request' }) };
            }
            await dynamoDb.put({ TableName: TABLES_TABLE, Item: requestBody }).promise();
            return { statusCode: 200, body: JSON.stringify({ id }) };
        }

        if (path.startsWith('/tables/') && httpMethod === 'GET') {
            if (!await validateToken(headers.Authorization)) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Unauthorized' }) };
            }
            const tableId = path.split('/')[2];
            const result = await dynamoDb.get({ TableName: TABLES_TABLE, Key: { id: tableId } }).promise();
            if (!result.Item) return { statusCode: 404, body: JSON.stringify({ message: 'Table not found' }) };
            return { statusCode: 200, body: JSON.stringify(result.Item) };
        }

        if (path === '/reservations' && httpMethod === 'POST') {
            if (!await validateToken(headers.Authorization)) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Unauthorized' }) };
            }
            const { tableNumber, clientName, phoneNumber, date, slotTimeStart, slotTimeEnd } = requestBody;
            if (!tableNumber || !clientName || !phoneNumber || !date.match(/^\d{4}-\d{2}-\d{2}$/) || !slotTimeStart.match(/^\d{2}:\d{2}$/) || !slotTimeEnd.match(/^\d{2}:\d{2}$/)) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request' }) };
            }

            const table = await dynamoDb.get({ TableName: TABLES_TABLE, Key: { id: tableNumber.toString() } }).promise();
            if (!table.Item) return { statusCode: 400, body: JSON.stringify({ message: 'Table not found' }) };

            const reservationId = uuidv4();
            await dynamoDb.put({
                TableName: RESERVATIONS_TABLE,
                Item: { reservationId, tableNumber, clientName, phoneNumber, date, slotTimeStart, slotTimeEnd }
            }).promise();
            return { statusCode: 200, body: JSON.stringify({ reservationId }) };
        }

        if (path === '/reservations' && httpMethod === 'GET') {
            if (!await validateToken(headers.Authorization)) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Unauthorized' }) };
            }
            const reservations = await dynamoDb.scan({ TableName: RESERVATIONS_TABLE }).promise();
            return { statusCode: 200, body: JSON.stringify({ reservations: reservations.Items }) };
        }

        return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request' }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: 'Server error', error: error.message }) };
    }
};
