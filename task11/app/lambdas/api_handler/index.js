//const AWS = require("aws-sdk");
//const bcrypt = require("bcryptjs");
//const jwt = require("jsonwebtoken");
//
//// Configure AWS SDK
//const cognito = new AWS.CognitoIdentityServiceProvider();
//const dynamoDB = new AWS.DynamoDB.DocumentClient();
//
//// Environment variables
//const USER_POOL_ID = process.env.booking_userpool;
//const TABLES_TABLE = process.env.tables_table;
//const RESERVATIONS_TABLE = process.env.reservations_table;
//const CLIENT_ID = process.env.cup_client_id;
//
//exports.handler = async (event) => {
//    console.log("Received event:", JSON.stringify(event, null, 2));
//
//    try {
//        const { httpMethod, path } = event;
//         console.log(`Processing request - Method: ${httpMethod}, Path: ${path}`);
//
//        if (httpMethod === "POST" && path === "/signup") {
//        console.log("Handling signup request.");
//            return await signup(JSON.parse(event.body));
//        }
//        if (httpMethod === "POST" && path === "/signin") {
//        console.log("Handling signin request.");
//            return await signin(JSON.parse(event.body));
//        }
//        if (httpMethod === "GET" && path === "/tables") {
//        console.log("Fetching all tables.");
//            return await getTables();
//        }
//        if (httpMethod === "POST" && path === "/tables") {
//        console.log("Creating a new table.");
//            return await createTable(JSON.parse(event.body));
//        }
//        if (httpMethod === "GET" && path.startsWith("/tables/")) {
//            const tableId = path.split("/").pop();
//             console.log(`Fetching table with ID: ${tableId}`);
//            return await getTableById(tableId);
//        }
//        if (httpMethod === "GET" && path === "/reservations") {
//         console.log("Fetching all reservations.");
//            return await getReservations();
//        }
//        if (httpMethod === "POST" && path === "/reservations") {
//        console.log("Creating a reservation.");
//            return await createReservation(JSON.parse(event.body));
//        }
//
//         console.warn("Invalid Request:", { httpMethod, path });
//        return sendResponse(400, { message: "Invalid Request" });
//    } catch (error) {
//        console.error("Error:", error);
//        return sendResponse(500, { error: "Internal Server Error" });
//    }
//};
//
//// Get the correct User Pool ID format
//async function getUserPoolId() {
//    try {
//        const response = await cognito.listUserPools({ MaxResults: 10 }).promise();
//        const userPool = response.UserPools.find(pool => pool.Name.includes("simple-booking-userpool"));
//        if (!userPool) throw new Error("User Pool not found.");
//        return userPool.Id;
//    } catch (error) {
//        console.error("Error fetching User Pool ID:", error);
//        throw error;
//    }
//}
//
//async function signup(body) {
//console.log("Processing signup:", JSON.stringify(body, null, 2));
//    const { firstName, lastName, email, password } = body;
//    console.log(`Signup request for email: ${email}`);
//
//    // Get the correctly formatted User Pool ID
//    const userPoolId = await getUserPoolId();
//    console.log(`User Pool ID: ${userPoolId}`);
//
//    const params = {
//        UserPoolId: userPoolId,
//        Username: email,  // Use email as username
//        TemporaryPassword: password,
//        UserAttributes: [
//            { Name: "email", Value: email },
//            { Name: "given_name", Value: firstName },
//            { Name: "family_name", Value: lastName }
//        ],
//        MessageAction: "SUPPRESS"  // Avoid email quota issues
//    };
//
//    try {
//    console.log("Creating user in Cognito...");
//        await cognito.adminCreateUser(params).promise();
//         console.log("User created successfully.");
//
//
//         console.log("Setting permanent password...");
//        await cognito.adminSetUserPassword({
//            UserPoolId: userPoolId,
//            Username: email,
//            Password: password,
//            Permanent: true
//        }).promise();
//         console.log("Password set successfully.");
//
//        return sendResponse(200, { message: "User registered successfully" });
//    } catch (error) {
//        console.error("Signup Error:", error);
//        return sendResponse(400, { error: error.message });
//    }
//}
//
//async function signin(body) {
//console.log("Processing signin:", JSON.stringify(body, null, 2));
//    const { email, password } = body;
//    console.log(`Signin attempt for email: ${email}`);
//
//    // Get the correctly formatted User Pool ID
//    const userPoolId = await getUserPoolId();
//     console.log(`User Pool ID: ${userPoolId}`);
//
//    const params = {
//        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
//        UserPoolId: userPoolId,  // Use the correctly formatted User Pool ID
//        ClientId: CLIENT_ID,
//        AuthParameters: {
//            USERNAME: email,
//            PASSWORD: password
//        }
//    };
//
//    try {
//        const result = await cognito.adminInitiateAuth(params).promise();
//        console.log("Authentication successful.");
//        return sendResponse(200, { accessToken: result.AuthenticationResult.IdToken });
//    } catch (error) {
//        console.error("Signin Error:", error);
//        return sendResponse(400, { error: "Invalid credentials" });
//    }
//}
//
//async function getTables() {
//    const params = { TableName: TABLES_TABLE };
//
//    try {
//        const data = await dynamoDB.scan(params).promise();
//         console.log(`Retrieved ${data.Items.length} tables.`);
//        return sendResponse(200, { tables: data.Items });
//    } catch (error) {
//    console.error("Error fetching tables:", error);
//        return sendResponse(500, { error: "Could not fetch tables" });
//    }
//}
//
//async function createTable(body) {
//console.log("Creating a new table:", JSON.stringify(body, null, 2));
//    const table = {
//        id: AWS.util.uuid.v4(),
//        number: body.number,
//        places: body.places,
//        isVip: body.isVip || false,
//        minOrder: body.minOrder || null
//    };
//
//    const params = {
//        TableName: TABLES_TABLE,
//        Item: table,
//    };
//
//    try {
//        await dynamoDB.put(params).promise();
//        console.log("Saved table to DynamoDB...");
//        return sendResponse(201, { message: "Table created", table });
//    } catch (error) {
//    console.error("Error creating table:", error);
//        return sendResponse(500, { error: "Could not create table" });
//    }
//}
//
//async function getTableById(tableId) {
//console.log(`Fetching table with ID: ${tableId}`);
//    const params = {
//        TableName: TABLES_TABLE,
//        Key: { id: tableId },
//    };
//
//    try {
//        const data = await dynamoDB.get(params).promise();
//        if (!data.Item) return sendResponse(404, { error: "Table not found" });
//
//        return sendResponse(200, { table: data.Item });
//    } catch (error) {
//        return sendResponse(500, { error: "Could not fetch table" });
//    }
//}
//
//async function getReservations() {
// console.log("Fetching reservations.");
//    const params = { TableName: RESERVATIONS_TABLE };
//
//    try {
//        const data = await dynamoDB.scan(params).promise();
//        return sendResponse(200, { reservations: data.Items });
//    } catch (error) {
//        return sendResponse(500, { error: "Could not fetch reservations" });
//    }
//}
//
//async function createReservation(body) {
// console.log("Creating reservation:", JSON.stringify(body, null, 2));
//    const reservation = {
//        id: AWS.util.uuid.v4(),
//        tableNumber: body.tableNumber,
//        clientName: body.clientName,
//        phoneNumber: body.phoneNumber,
//        date: body.date,
//        slotTimeStart: body.slotTimeStart,
//        slotTimeEnd: body.slotTimeEnd
//    };
//
//    const params = {
//        TableName: RESERVATIONS_TABLE,
//        Item: reservation,
//    };
//
//    try {
//        await dynamoDB.put(params).promise();
//         console.log("Saving reservation to DynamoDB...");
//        return sendResponse(201, { message: "Reservation created", reservation });
//    } catch (error) {
//    console.error("Error creating reservation:", error);
//        return sendResponse(500, { error: "Could not create reservation" });
//    }
//}
//
//function sendResponse(statusCode, body) {
//    return {
//        statusCode,
//        headers: { "Content-Type": "application/json" },
//        body: JSON.stringify(body),
//    };
//}
//


import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider();

// Get configuration from environment variables
const USER_POOL_ID = process.env.cup_id;
const CLIENT_ID = process.env.cup_client_id;
const TABLES_TABLE = process.env.tables_table;
const RESERVATIONS_TABLE = process.env.reservations_table;

// Main handler function
export const handler = async (event, context) => {
  console.log('===== Incoming Event =====');
  console.log(JSON.stringify(event, null, 2));

  try {
    const path = event.resource;
    const httpMethod = event.httpMethod;
    console.log(`Handling request: ${httpMethod} ${path}`);

    let response;

    if (path === '/signup' && httpMethod === 'POST') {
      console.log("🔹 Processing Signup...");
      response = await handleSignup(event);
    } else if (path === '/signin' && httpMethod === 'POST') {
      console.log("🔹 Processing Signin...");
      response = await handleSignin(event);
    } else if (path === '/tables' && httpMethod === 'GET') {
      console.log("🔹 Fetching All Tables...");
      response = await handleGetTables(event);
    } else if (path === '/tables' && httpMethod === 'POST') {
      console.log("🔹 Creating a New Table...");
      response = await handleCreateTable(event);
    } else if (path === '/tables/{tableId}' && httpMethod === 'GET') {
      console.log("🔹 Fetching Table by ID...");
      response = await handleGetTableById(event);
    } else if (path === '/reservations' && httpMethod === 'GET') {
      console.log("🔹 Fetching Reservations...");
      response = await handleGetReservations(event);
    } else if (path === '/reservations' && httpMethod === 'POST') {
      console.log("🔹 Creating a Reservation...");
      response = await handleCreateReservation(event);
    } else {
      console.warn("❌ Route Not Found!");
      response = formatResponse(404, { message: 'Not Found' });
    }

    console.log("✅ Response Sent:", JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error("🔥 ERROR:", error);
    return formatResponse(500, { message: 'Internal Server Error', error: error.message });
  }
};

// Helper functions for CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Content-Type': 'application/json'
  };
}

// Helper function for formatting responses
function formatResponse(statusCode, body) {
  console.log(`📩 Sending Response (Status ${statusCode}):`, JSON.stringify(body, null, 2));
  return { statusCode, headers: corsHeaders(), body: JSON.stringify(body) };
}

// Authentication handlers
async function handleSignup(event) {
  try {
    const { firstName, lastName, email, password } = JSON.parse(event.body);
    console.log("📌 Signup Request:", { firstName, lastName, email });

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

    console.log("✅ Signup Successful for:", email);
    return formatResponse(200, { message: "User created successfully." });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    return formatResponse(502, { error: "Signup failed." });
  }
}

async function handleSignin(event) {
  try {
    const { email, password } = JSON.parse(event.body);
    console.log("📌 Signin Request for:", email);

    const getUserParams = {
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1
    };
    const users = await cognito.listUsers(getUserParams).promise();
    console.log("👤 Cognito Users Found:", users.Users.length);

    if (!users.Users.length) return formatResponse(400, { error: "User does not exist in Cognito." });

    const username = users.Users[0].Username;
    console.log("🔑 Authenticating User:", username);

    const params = {
      AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: username, PASSWORD: password }
    };
    const authResponse = await cognito.adminInitiateAuth(params).promise();
    console.log("✅ Signin Successful for:", username);

    return formatResponse(200, { accessToken: authResponse.AuthenticationResult?.IdToken });
  } catch (error) {
    console.error("❌ Signin Error:", error);
    return formatResponse(400, { error: "Authentication failed.", details: error.message });
  }
}

// Table management handlers
async function handleGetTables(event) {
  console.log("📌 Fetching all tables from:", TABLES_TABLE);
  const result = await dynamodb.scan({ TableName: TABLES_TABLE }).promise();
  console.log("✅ Tables Retrieved:", result.Items.length);
  return formatResponse(200, result.Items);
}

async function handleCreateTable(event) {
  const body = JSON.parse(event.body);
  const { number, capacity, location } = body;
  const tableId = uuidv4();
  console.log("📌 Creating Table with:", { tableId, number, capacity, location });

  await dynamodb.put({
    TableName: TABLES_TABLE,
    Item: { id: tableId, number, capacity, location, createdAt: new Date().toISOString() }
  }).promise();

  console.log("✅ Table Created:", tableId);
  return formatResponse(200, { id: tableId, number, capacity, location });
}

// Helper function to extract username from token
function getUsernameFromToken(event) {
  try {
    console.log('🔍 Extracting Username from Token...');
    if (event.requestContext?.authorizer?.claims) {
      const username = event.requestContext.authorizer.claims['cognito:username'];
      console.log('✅ Username Extracted:', username);
      return username;
    }
    console.warn('⚠️ No valid authorization found in request.');
    return null;
  } catch (error) {
    console.error('❌ Error Extracting Username:', error);
    return null;
  }
}
