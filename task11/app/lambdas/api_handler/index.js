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
//
//        if (httpMethod === "POST" && path === "/signup") {
//            return await signup(JSON.parse(event.body));
//        }
//        if (httpMethod === "POST" && path === "/signin") {
//            return await signin(JSON.parse(event.body));
//        }
//        if (httpMethod === "GET" && path === "/tables") {
//            return await getTables();
//        }
//        if (httpMethod === "POST" && path === "/tables") {
//            return await createTable(JSON.parse(event.body));
//        }
//        if (httpMethod === "GET" && path.startsWith("/tables/")) {
//            const tableId = path.split("/").pop();
//            return await getTableById(tableId);
//        }
//        if (httpMethod === "GET" && path === "/reservations") {
//            return await getReservations();
//        }
//        if (httpMethod === "POST" && path === "/reservations") {
//            return await createReservation(JSON.parse(event.body));
//        }
//
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
//    const { firstName, lastName, email, password } = body;
//
//    // Get the correctly formatted User Pool ID
//    const userPoolId = await getUserPoolId();
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
//        await cognito.adminCreateUser(params).promise();
//
//        await cognito.adminSetUserPassword({
//            UserPoolId: userPoolId,
//            Username: email,
//            Password: password,
//            Permanent: true
//        }).promise();
//
//        return sendResponse(200, { message: "User registered successfully" });
//    } catch (error) {
//        console.error("Signup Error:", error);
//        return sendResponse(400, { error: error.message });
//    }
//}
//
//async function signin(body) {
//    const { email, password } = body;
//
//    // Get the correctly formatted User Pool ID
//    const userPoolId = await getUserPoolId();
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
//        return sendResponse(200, { tables: data.Items });
//    } catch (error) {
//        return sendResponse(500, { error: "Could not fetch tables" });
//    }
//}
//
//async function createTable(body) {
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
//        return sendResponse(201, { message: "Table created", table });
//    } catch (error) {
//        return sendResponse(500, { error: "Could not create table" });
//    }
//}
//
//async function getTableById(tableId) {
//    const params = {
//        TableName: TABLES_TABLE,
//        Key: { id: tableId },
//    };
//
//    try {
//        const data = await dynamoDB.get(params).promise();
//        if (!data.Item) return sendResponse(404, { error: "Table not found" });
//        return sendResponse(200, { table: data.Item });
//    } catch (error) {
//        return sendResponse(500, { error: "Could not fetch table" });
//    }
//}
//
//async function getReservations() {
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
//        return sendResponse(201, { message: "Reservation created", reservation });
//    } catch (error) {
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


exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    try {
        const { httpMethod, path } = event;
        console.log(`Processing request - Method: ${httpMethod}, Path: ${path}`);

        if (httpMethod === "POST" && path === "/signup") {
            console.log("Handling signup request.");
            return await signup(JSON.parse(event.body));
        }
        if (httpMethod === "POST" && path === "/signin") {
            console.log("Handling signin request.");
            return await signin(JSON.parse(event.body));
        }
        if (httpMethod === "GET" && path === "/tables") {
            console.log("Fetching all tables.");
            return await getTables();
        }
        if (httpMethod === "POST" && path === "/tables") {
            console.log("Creating a new table.");
            return await createTable(JSON.parse(event.body));
        }
        if (httpMethod === "GET" && path.startsWith("/tables/")) {
            const tableId = path.split("/").pop();
            console.log(`Fetching table with ID: ${tableId}`);
            return await getTableById(tableId);
        }
        if (httpMethod === "GET" && path === "/reservations") {
            console.log("Fetching all reservations.");
            return await getReservations();
        }
        if (httpMethod === "POST" && path === "/reservations") {
            console.log("Creating a reservation.");
            return await createReservation(JSON.parse(event.body));
        }

        console.warn("Invalid Request:", { httpMethod, path });
        return sendResponse(400, { message: "Invalid Request" });
    } catch (error) {
        console.error("Error in handler:", error);
        return sendResponse(500, { error: "Internal Server Error" });
    }
};

async function signup(body) {
    console.log("Processing signup:", JSON.stringify(body, null, 2));
    const { firstName, lastName, email, password } = body;
    console.log(`Signup request for email: ${email}`);

    const userPoolId = await getUserPoolId();
    console.log(`User Pool ID: ${userPoolId}`);

    const params = {
        UserPoolId: userPoolId,
        Username: email,
        TemporaryPassword: password,
        UserAttributes: [
            { Name: "email", Value: email },
            { Name: "given_name", Value: firstName },
            { Name: "family_name", Value: lastName }
        ],
        MessageAction: "SUPPRESS"
    };

    try {
        console.log("Creating user in Cognito...");
        await cognito.adminCreateUser(params).promise();
        console.log("User created successfully.");

        console.log("Setting permanent password...");
        await cognito.adminSetUserPassword({
            UserPoolId: userPoolId,
            Username: email,
            Password: password,
            Permanent: true
        }).promise();
        console.log("Password set successfully.");

        return sendResponse(200, { message: "User registered successfully" });
    } catch (error) {
        console.error("Signup Error:", error);
        return sendResponse(400, { error: error.message });
    }
}

async function signin(body) {
    console.log("Processing signin:", JSON.stringify(body, null, 2));
    const { email, password } = body;
    console.log(`Signin attempt for email: ${email}`);

    const userPoolId = await getUserPoolId();
    console.log(`User Pool ID: ${userPoolId}`);

    const params = {
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        UserPoolId: userPoolId,
        ClientId: CLIENT_ID,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password
        }
    };

    try {
        console.log("Authenticating user...");
        const result = await cognito.adminInitiateAuth(params).promise();
        console.log("Authentication successful.");

        return sendResponse(200, { accessToken: result.AuthenticationResult.IdToken });
    } catch (error) {
        console.error("Signin Error:", error);
        return sendResponse(400, { error: "Invalid credentials" });
    }
}

async function getTables() {
    console.log("Fetching tables from DynamoDB.");
    const params = { TableName: TABLES_TABLE };

    try {
        const data = await dynamoDB.scan(params).promise();
        console.log(`Retrieved ${data.Items.length} tables.`);
        return sendResponse(200, { tables: data.Items });
    } catch (error) {
        console.error("Error fetching tables:", error);
        return sendResponse(500, { error: "Could not fetch tables" });
    }
}

async function createTable(body) {
    console.log("Creating a new table:", JSON.stringify(body, null, 2));
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
        console.log("Saving table to DynamoDB...");
        await dynamoDB.put(params).promise();
        console.log("Table created successfully.");
        return sendResponse(201, { message: "Table created", table });
    } catch (error) {
        console.error("Error creating table:", error);
        return sendResponse(500, { error: "Could not create table" });
    }
}

async function getTableById(tableId) {
    console.log(`Fetching table with ID: ${tableId}`);
    const params = {
        TableName: TABLES_TABLE,
        Key: { id: tableId },
    };

    try {
        const data = await dynamoDB.get(params).promise();
        if (!data.Item) {
            console.warn(`Table not found for ID: ${tableId}`);
            return sendResponse(404, { error: "Table not found" });
        }
        console.log("Table found:", JSON.stringify(data.Item, null, 2));
        return sendResponse(200, { table: data.Item });
    } catch (error) {
        console.error("Error fetching table:", error);
        return sendResponse(500, { error: "Could not fetch table" });
    }
}

async function getReservations() {
    console.log("Fetching reservations.");
    const params = { TableName: RESERVATIONS_TABLE };

    try {
        const data = await dynamoDB.scan(params).promise();
        console.log(`Retrieved ${data.Items.length} reservations.`);
        return sendResponse(200, { reservations: data.Items });
    } catch (error) {
        console.error("Error fetching reservations:", error);
        return sendResponse(500, { error: "Could not fetch reservations" });
    }
}

async function createReservation(body) {
    console.log("Creating reservation:", JSON.stringify(body, null, 2));
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
        console.log("Saving reservation to DynamoDB...");
        await dynamoDB.put(params).promise();
        console.log("Reservation created successfully.");
        return sendResponse(201, { message: "Reservation created", reservation });
    } catch (error) {
        console.error("Error creating reservation:", error);
        return sendResponse(500, { error: "Could not create reservation" });
    }
}
