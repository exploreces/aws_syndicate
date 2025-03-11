const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Configure AWS SDK
const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Environment variables
const USER_POOL_ID = process.env.booking_userpool;
const TABLES_TABLE = process.env.tables_table;
const RESERVATIONS_TABLE = process.env.reservations_table;
const CLIENT_ID = process.env.cup_client_id;

exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    try {
        const { httpMethod, path } = event;

        if (httpMethod === "POST" && path === "/signup") {
            return await signup(JSON.parse(event.body));
        }
        if (httpMethod === "POST" && path === "/signin") {
            return await signin(JSON.parse(event.body));
        }
        if (httpMethod === "GET" && path === "/tables") {
            return await getTables();
        }
        if (httpMethod === "POST" && path === "/tables") {
            return await createTable(JSON.parse(event.body));
        }
        if (httpMethod === "GET" && path.startsWith("/tables/")) {
            const tableId = path.split("/").pop();
            return await getTableById(tableId);
        }
        if (httpMethod === "GET" && path === "/reservations") {
            return await getReservations();
        }
        if (httpMethod === "POST" && path === "/reservations") {
            return await createReservation(JSON.parse(event.body));
        }

        return sendResponse(400, { message: "Invalid Request" });
    } catch (error) {
        console.error("Error:", error);
        return sendResponse(500, { error: "Internal Server Error" });
    }
};

// ✅ FIXED: Corrected signup function to use `AdminCreateUser`
async function signup(body) {
    const { firstName, lastName, email, password } = body;

    const params = {
        UserPoolId: USER_POOL_ID,
        Username: email,  // ✅ Use email as username
        TemporaryPassword: password,
        UserAttributes: [
            { Name: "email", Value: email },
            { Name: "given_name", Value: firstName },
            { Name: "family_name", Value: lastName }
        ],
        MessageAction: "SUPPRESS"  // ✅ Avoid email quota issues
    };

    try {
        await cognito.adminCreateUser(params).promise();

        // ✅ Manually set password to avoid "temporary password" issue
        await cognito.adminSetUserPassword({
            UserPoolId: CLIENT_ID,
            Username: email,
            Password: password,
            Permanent: true
        }).promise();

        return sendResponse(201, { message: "User registered successfully" });
    } catch (error) {
        console.error("Signup Error:", error);
        return sendResponse(400, { error: error.message });
    }
}

// ✅ FIXED: Corrected sign-in function to use email instead of username
async function signin(body) {
    const { email, password } = body;

    const params = {
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        UserPoolId: USER_POOL_ID,
        ClientId: CLIENT_ID,  // ✅ Ensure correct Client ID
        AuthParameters: {
            USERNAME: email,  // ✅ Use email instead of username
            PASSWORD: password
        }
    };

    try {
        const result = await cognito.adminInitiateAuth(params).promise();
        return sendResponse(200, { accessToken: result.AuthenticationResult.IdToken });
    } catch (error) {
        console.error("Signin Error:", error);
        return sendResponse(400, { error: "Invalid credentials" });
    }
}

async function getTables() {
    const params = { TableName: TABLES_TABLE };

    try {
        const data = await dynamoDB.scan(params).promise();
        return sendResponse(200, { tables: data.Items });
    } catch (error) {
        return sendResponse(500, { error: "Could not fetch tables" });
    }
}

async function createTable(body) {
    const table = {
        id: AWS.util.uuid.v4(),
        number: body.number,
        places: body.places,
        isVip: body.isVip || false,
        minOrder: body.minOrder || null
    };

    const params = {
        TableName: TABLES_TABLE,
        Item: table,
    };

    try {
        await dynamoDB.put(params).promise();
        return sendResponse(201, { message: "Table created", table });
    } catch (error) {
        return sendResponse(500, { error: "Could not create table" });
    }
}

async function getTableById(tableId) {
    const params = {
        TableName: TABLES_TABLE,
        Key: { id: tableId },
    };

    try {
        const data = await dynamoDB.get(params).promise();
        if (!data.Item) return sendResponse(404, { error: "Table not found" });
        return sendResponse(200, { table: data.Item });
    } catch (error) {
        return sendResponse(500, { error: "Could not fetch table" });
    }
}

async function getReservations() {
    const params = { TableName: RESERVATIONS_TABLE };

    try {
        const data = await dynamoDB.scan(params).promise();
        return sendResponse(200, { reservations: data.Items });
    } catch (error) {
        return sendResponse(500, { error: "Could not fetch reservations" });
    }
}

async function createReservation(body) {
    const reservation = {
        id: AWS.util.uuid.v4(),
        tableNumber: body.tableNumber,
        clientName: body.clientName,
        phoneNumber: body.phoneNumber,
        date: body.date,
        slotTimeStart: body.slotTimeStart,
        slotTimeEnd: body.slotTimeEnd
    };

    const params = {
        TableName: RESERVATIONS_TABLE,
        Item: reservation,
    };

    try {
        await dynamoDB.put(params).promise();
        return sendResponse(201, { message: "Reservation created", reservation });
    } catch (error) {
        return sendResponse(500, { error: "Could not create reservation" });
    }
}

function sendResponse(statusCode, body) {
    return {
        statusCode,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    };
}