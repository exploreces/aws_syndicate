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
  console.log('Event:', JSON.stringify(event));
  try {
    // API Gateway proxy integration
    const path = event.resource;
    const httpMethod = event.httpMethod;
    console.log(`Handling request - Path: ${path}, Method: ${httpMethod}`);

    let response;

    // Route requests based on path and method
    if (path === '/signup' && httpMethod === 'POST') {
    console.log("signup")
      response = await handleSignup(event);
    } else if (path === '/signin' && httpMethod === 'POST') {
    console.log("signin")
      response = await handleSignin(event);
    } else if (path === '/tables' && httpMethod === 'GET') {
    console.log("tables get")
      response = await handleGetTables(event);
    } else if (path === '/tables' && httpMethod === 'POST') {
    console.log("tables post")
      response = await handleCreateTable(event);
    } else if (path === '/tables/{tableId}' && httpMethod === 'GET') {
    console.log("tables / tableId")
      response = await handleGetTableById(event);
    } else if (path === '/reservations' && httpMethod === 'GET') {
    console.log("reservations get")
      response = await handleGetReservations(event);
    } else if (path === '/reservations' && httpMethod === 'POST') {
    console.log("reservations post")
      response = await handleCreateReservation(event);
    } else {
      response = {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({ message: 'Not Found' })
      };
    }

    return response;
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.message
      })
    };
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
  return {
    statusCode: statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body)
  };
}

// Authentication handlers
async function handleSignup(event) {
  try {
      const { firstName, lastName, email, password } = JSON.parse(event.body);
         console.log("Processing signup request...");
      if (!firstName || !lastName || !email || !password) {
        return formatResponse(400, { error: "All fields are required." });
      }

      if (!/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return formatResponse(400, { error: "Invalid email format." });
      }

      if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[$%^*-_])[A-Za-z\d$%^*-_]{12,}$/.test(password)) {
        return formatResponse(400, { error: "Invalid password format." });
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
      return formatResponse(200, { message: "User created successfully." });
    } catch (error) {
      console.error("Signup error:", error);
      return formatResponse(502, { error: "Signup failed." });
    }
}

async function handleSignin(event) {
  try {
  console.log("Processing signin request...");
          const { email, password} = JSON.parse(event.body);
          const getUserParams = {
              UserPoolId: USER_POOL_ID,
              Filter: `email = "${email}"`,
              Limit: 1
          };
          console.log(`Fetching user from Cognito - Email: ${email}`);
          const users = await cognito.listUsers(getUserParams).promise();
          if (!users.Users.length) {
              return formatResponse(400, { error: "User does not exist in Cognito." });
          }
          const username = users.Users[0].Username;
          const params = {
              AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
              UserPoolId: USER_POOL_ID,
              ClientId: CLIENT_ID,
              AuthParameters: {
                  USERNAME: username,
                  PASSWORD: password
              }
          };

          console.log("Attempting authentication...");
          const authResponse = await cognito.adminInitiateAuth(params).promise();
          if (authResponse.ChallengeName === "NEW_PASSWORD_REQUIRED") {
              const challengeParams = {
                  ChallengeName: "NEW_PASSWORD_REQUIRED",
                  ClientId: CLIENT_ID,
                  UserPoolId: USER_POOL_ID,
                  ChallengeResponses: {
                      USERNAME: username,
                      NEW_PASSWORD: "as@123"
                  },
                  Session: authResponse.Session
              };
              const finalAuthResponse = await cognito.adminRespondToAuthChallenge(challengeParams).promise();
              const token = finalAuthResponse.AuthenticationResult?.IdToken;
              return formatResponse(200, {
                  message: "Password updated successfully.",
                  accessToken: finalAuthResponse.AuthenticationResult?.IdToken
              });
          }
          return formatResponse(200, { accessToken: authResponse.AuthenticationResult?.IdToken });

      } catch (error) {
          let errorMessage = "Authentication failed.";
          if (error.code === "UserNotFoundException") {
              errorMessage = "User does not exist.";
          } else if (error.code === "NotAuthorizedException") {
              errorMessage = "Incorrect username or password.";
          } else if (error.code === "InvalidParameterException") {
              errorMessage = "Invalid request parameters.";
          }
          return formatResponse(400, { error: errorMessage, details: error.message });
      }
}

// Table management handlers
async function handleGetTables(event) {
console.log("handling get tables...");
  // Verify user is authenticated
  const username = getUsernameFromToken(event);

  if (!username) {
    return formatResponse(401, { message: 'Unauthorized' });
  }

  const params = {
    TableName: TABLES_TABLE
  };

  const result = await dynamodb.scan(params).promise();

  return formatResponse(200, result.Items);
}
async function handleCreateTable(event) {
console.log("handling create tables...");
  // Verify user is authenticated
  const username = getUsernameFromToken(event);

  if (!username) {
    return formatResponse(401, { message: 'Unauthorized' });
  }

  const body = JSON.parse(event.body);
  let { tableId, number, capacity, location } = body;

  if (!number || !capacity || !location) {
    return formatResponse(400, {
      message: 'Table number, capacity, and location are required'
    });
  }

  tableId = tableId || uuidv4();

  const table = {
    id: tableId,
    number: number,
    capacity: capacity,
    location: location,
    createdAt: new Date().toISOString(),
    createdBy: username
  };

  const params = {
    TableName: TABLES_TABLE,
    Item: table
  };

  await dynamodb.put(params).promise();

  return formatResponse(200, table);
}

async function handleGetTableById(event) {
console.log("handling get tables by Id...");
  // Verify user is authenticated
  const username = getUsernameFromToken(event);

  if (!username) {
    return formatResponse(401, { message: 'Unauthorized' });
  }

  const tableId = event.pathParameters.tableId;

  const params = {
    TableName: TABLES_TABLE,
    Key: {
      id: tableId
    }
  };

  const result = await dynamodb.get(params).promise();

  if (!result.Item) {
    return formatResponse(404, { message: 'Table not found' });
  }

  return formatResponse(200, result.Item);
}

// Reservation handlers
async function handleGetReservations(event) {
console.log("handling reservations  tables...");
  // Verify user is authenticated
  const username = getUsernameFromToken(event);

  if (!username) {
    return formatResponse(401, { message: 'Unauthorized' });
  }

  // Get query parameters if any
  const queryParams = event.queryStringParameters || {};

  // Start with basic scan params
  let params = {
    TableName: RESERVATIONS_TABLE
  };

  // Filter by user if not admin (simplified example)
  if (queryParams.user) {
    params.FilterExpression = "username = :username";
    params.ExpressionAttributeValues = {
      ":username": queryParams.user
    };
  }

  const result = await dynamodb.scan(params).promise();

  return formatResponse(200, result.Items);
}

async function handleCreateReservation(event) {
console.log("handling create reservations tables...");
  // Verify user is authenticated
  const username = getUsernameFromToken(event);

  if (!username) {
    return formatResponse(401, { message: 'Unauthorized' });
  }

  const body = JSON.parse(event.body);
  const { tableId, date, time, partySize } = body;

  if (!tableId || !date || !time || !partySize) {
    return formatResponse(400, {
      message: 'TableId, date, time, and party size are required'
    });
  }

  // Check if table exists
  const tableParams = {
    TableName: TABLES_TABLE,
    Key: {
      id: tableId
    }
  };
  console.log("handling table params.");

  const tableResult = await dynamodb.get(tableParams).promise();

  if (!tableResult.Item) {
    return formatResponse(404, { message: 'Table not found' });
  }

  // Check if the party size is suitable for the table
  if (partySize > tableResult.Item.capacity) {
    return formatResponse(400, {
      message: `Table capacity (${tableResult.Item.capacity}) is not enough for party size (${partySize})`
    });
  }

  // Check if table is already reserved for that time
  const reservationCheckParams = {
    TableName: RESERVATIONS_TABLE,
    FilterExpression: "tableId = :tableId AND #date = :date AND #time = :time",
    ExpressionAttributeNames: {
      "#date": "date",
      "#time": "time"
    },
    ExpressionAttributeValues: {
      ":tableId": tableId,
      ":date": date,
      ":time": time
    }
  };

  const existingReservations = await dynamodb.scan(reservationCheckParams).promise();

  if (existingReservations.Items.length > 0) {
    return formatResponse(409, {
      message: 'Table is already reserved for the selected date and time'
    });
  }

  // Create new reservation
  const reservation = {
    id: uuidv4(),
    tableId: tableId,
    tableName: tableResult.Item.number,
    username: username,
    date: date,
    time: time,
    partySize: partySize,
    createdAt: new Date().toISOString()
  };

  const reservationParams = {
    TableName: RESERVATIONS_TABLE,
    Item: reservation
  };

  await dynamodb.put(reservationParams).promise();

  return formatResponse(200, reservation);
}

// Helper function to extract username from token
function getUsernameFromToken(event) {
  try {
    // More detailed logging to help diagnose issues
    console.log('Event requestContext:', JSON.stringify(event.requestContext || {}));

    // API Gateway will add a "claims" object when Cognito authorizer is used
    if (event.requestContext &&
        event.requestContext.authorizer &&
        event.requestContext.authorizer.claims) {
      const username = event.requestContext.authorizer.claims['cognito:username'];
      console.log('Extracted username:', username);
      return username;
    }

    // Check for other authorization methods - JWT from header
    if (event.headers && event.headers.Authorization) {
      console.log('Auth header present, but not processed through requestContext.authorizer');
      // You could implement JWT parsing here if needed
    }

    console.warn('No valid authorization found in request');
    return null;
  } catch (error) {
    console.error('Error extracting username from token:', error);
    return null;
  }
}