import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";

const { CognitoIdentityServiceProvider, DynamoDB } = AWS;

const cognito = new AWS.CognitoIdentityServiceProvider({
    region: process.env.REGION
});

const dynamoDb = new DynamoDB.DocumentClient();

const TABLES_TABLE = process.env.TABLES_TABLE;
const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE;
const USER_POOL_ID = process.env.cup_id;
const COGNITO_CLIENT_ID = process.env.cup_client_id;

export const handler = async (event) => {
    const { path } = event;
    if (path === "/signup") return signup(event);
    if (path === "/signin") return signin(event);
    if (path === "/tables") return getTables();
    if (path === "/tables/add") return addTable(event);
    if (path === "/reservations") return getReservations();
    if (path === "/reservations/add") return addReservation(event);
    return { statusCode: 404, body: JSON.stringify({ error: "Route not found" }) };
};

/**
 * Helper function to format API Gateway proxy integration responses.
 */
const formatResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    isBase64Encoded: false
});

/**
 * Signup Handler
 */
export const signup = async (event) => {
  try {
    const { firstName, lastName, email, password } = JSON.parse(event.body);

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
};

/**
 * Signin Handler
 */
export const signin = async (event) => {
    try {
        console.log("Event Body:", event.body);
        const { email, password } = JSON.parse(event.body);
        const getUserParams = {
                    UserPoolId: USER_POOL_ID,
                    Filter: `email = "${email}"`,
                    Limit: 1
                };
                const users = await cognito.listUsers(getUserParams).promise();

                if (!users.Users.length) {
                    return formatResponse(400, { error: "User does not exist in Cognito." });
                }

                const username = users.Users[0].Username;

                // Now authenticate using this username
                const params = {
                    AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
                    UserPoolId: USER_POOL_ID,
                    ClientId: COGNITO_CLIENT_ID,
                    AuthParameters: {
                        USERNAME: username,
                        PASSWORD: password
                    }
                };

                const data = await cognito.adminInitiateAuth(params).promise();
                return formatResponse(200, { accessToken: data.AuthenticationResult.IdToken  });

    } catch (error) {
        console.error("Signin error:", error);  // Log full error details

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
};


/**
 * Get Tables Handler
 */
export const getTables = async () => {
  try {
    const data = await dynamoDb.scan({ TableName: TABLES_TABLE }).promise();
    return formatResponse(200, { tables: data.Items });
  } catch (error) {
    console.error("GetTables error:", error);
    return formatResponse(400, { error: "Failed to get tables." });
  }
};

/**
 * Add Table Handler
 */
export const addTable = async (event) => {
  try {
    const table = JSON.parse(event.body);
    await dynamoDb.put({ TableName: TABLES_TABLE, Item: table }).promise();
    return formatResponse(200, { id: table.id });
  } catch (error) {
    console.error("AddTable error:", error);
    return formatResponse(400, { error: "Failed to add table." });
  }
};

/**
 * Get Reservations Handler
 */
export const getReservations = async () => {
  try {
    const data = await dynamoDb.scan({ TableName: RESERVATIONS_TABLE }).promise();
    return formatResponse(200, { reservations: data.Items });
  } catch (error) {
    console.error("GetReservations error:", error);
    return formatResponse(400, { error: "Failed to get reservations." });
  }
};

/**
 * Add Reservation Handler
 */
export const addReservation = async (event) => {
  try {
    const reservation = JSON.parse(event.body);
    reservation.reservationId = uuidv4();

    await dynamoDb.put({ TableName: RESERVATIONS_TABLE, Item: reservation }).promise();
    return formatResponse(200, { reservationId: reservation.reservationId });
  } catch (error) {
    console.error("AddReservation error:", error);
    return formatResponse(400, { error: "Failed to add reservation." });
  }
};

 