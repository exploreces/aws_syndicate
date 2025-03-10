import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";

const { CognitoIdentityServiceProvider, DynamoDB } = AWS;
const cognito = new CognitoIdentityServiceProvider({ region: process.env.REGION });
const dynamoDb = new DynamoDB.DocumentClient();

const TABLES_TABLE = process.env.TABLES_TABLE;
const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE;
const USER_POOL_ID = process.env.cup_id;
const COGNITO_CLIENT_ID = process.env.cup_client_id;

/**
 * Helper function to validate token
 */
const validateToken = async (event) => {
  try {
    const token = event.headers?.Authorization?.split(" ")[1];
    if (!token) throw new Error("Missing token");

    const response = await cognito.getUser({ AccessToken: token }).promise();
    console.log("Token validated for user:", response.Username);
    return response;
  } catch (error) {
    console.error("Token validation failed:", error);
    throw new Error("Unauthorized");
  }
};

/**
 * Signup Handler
 */
export const signup = async (event) => {
  try {
    console.log("Signup request received");
    const { firstName, lastName, email, password } = JSON.parse(event.body);

    if (!firstName || !lastName || !email || !password) {
      console.warn("Missing fields in signup request");
      return { statusCode: 400, body: JSON.stringify({ error: "All fields are required." }) };
    }

    if (!/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      console.warn("Invalid email format");
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid email format." }) };
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[$%^*-_])[A-Za-z\d$%^*-_]{12,}$/.test(password)) {
      console.warn("Invalid password format");
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid password format." }) };
    }

    await cognito.adminCreateUser({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
        { Name: "email", Value: email }
      ],
      TemporaryPassword: password,
      MessageAction: "SUPPRESS",
    }).promise();

    console.log("User created successfully:", email);
    return { statusCode: 200, body: JSON.stringify({ message: "User created successfully." }) };

  } catch (error) {
    console.error("Signup error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Signup failed." }) };
  }
};

/**
 * Signin Handler
 */
export const signin = async (event) => {
  try {
    console.log("Signin request received");
    const { email, password } = JSON.parse(event.body);

    const params = {
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      UserPoolId: USER_POOL_ID,
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    };

    const data = await cognito.adminInitiateAuth(params).promise();
    console.log("Signin successful for:", email);

    return {
      statusCode: 200,
      body: JSON.stringify({ accessToken: data.AuthenticationResult.AccessToken })
    };
  } catch (error) {
    console.error("Signin error:", error);
    return { statusCode: 400, body: JSON.stringify({ error: "Authentication failed" }) };
  }
};

/**
 * Get Tables Handler
 */
export const getTables = async (event) => {
  try {
    await validateToken(event);
    const data = await dynamoDb.scan({ TableName: TABLES_TABLE }).promise();
    return { statusCode: 200, body: JSON.stringify({ tables: data.Items }) };
  } catch (error) {
    console.error("GetTables error:", error);
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized or failed to fetch tables." }) };
  }
};

/**
 * Get Table by ID
 */
export const getTableById = async (event) => {
  try {
    await validateToken(event);
    const { tableId } = event.pathParameters;
    const data = await dynamoDb.get({ TableName: TABLES_TABLE, Key: { id: tableId } }).promise();
    if (!data.Item) return { statusCode: 404, body: JSON.stringify({ error: "Table not found." }) };
    return { statusCode: 200, body: JSON.stringify(data.Item) };
  } catch (error) {
    console.error("GetTableById error:", error);
    return { statusCode: 400, body: JSON.stringify({ error: "Failed to fetch table." }) };
  }
};

/**
 * Add Table Handler
 */
export const addTable = async (event) => {
  try {
    await validateToken(event);
    const table = JSON.parse(event.body);
    await dynamoDb.put({ TableName: TABLES_TABLE, Item: table }).promise();
    return { statusCode: 200, body: JSON.stringify({ id: table.id }) };
  } catch (error) {
    console.error("AddTable error:", error);
    return { statusCode: 400, body: JSON.stringify({ error: "Failed to add table." }) };
  }
};

/**
 * Add Reservation Handler
 */
export const addReservation = async (event) => {
  try {
    await validateToken(event);
    const reservation = JSON.parse(event.body);
    reservation.reservationId = uuidv4();
    await dynamoDb.put({ TableName: RESERVATIONS_TABLE, Item: reservation }).promise();
    return { statusCode: 200, body: JSON.stringify({ reservationId: reservation.reservationId }) };
  } catch (error) {
    console.error("AddReservation error:", error);
    return { statusCode: 400, body: JSON.stringify({ error: "Failed to add reservation." }) };
  }
};
