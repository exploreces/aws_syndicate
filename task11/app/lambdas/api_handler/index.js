import AWS from 'aws-sdk';

const cognito = new AWS.CognitoIdentityServiceProvider();
const USER_POOL_ID = process.env.USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;

export const signup = async (event) => {
  try {
    console.log("Signup request received");

    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      console.warn("Invalid JSON format in request");
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid request format." }) };
    }

    const { firstName, lastName, email, password } = requestBody;

    if (!firstName || !lastName || !email || !password) {
      console.warn("Missing fields in signup request");
      return { statusCode: 400, body: JSON.stringify({ error: "All fields are required." }) };
    }

    const emailRegex = /^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      console.warn("Invalid email format");
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid email format." }) };
    }

    const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordPolicyRegex.test(password)) {
      console.warn("Invalid password format");
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid password format. Password must be at least 8 characters and include uppercase, lowercase, number, and a special character." }) };
    }

    await cognito.adminCreateUser({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
        { Name: "email", Value: email }
      ],
      MessageAction: "SUPPRESS",
    }).promise();

    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }).promise();

    await cognito.adminConfirmSignUp({
      UserPoolId: USER_POOL_ID,
      Username: email,
    }).promise();

    console.log("User signup successful:", email);
    return { statusCode: 201, body: JSON.stringify({ message: "User created successfully" }) };
  } catch (error) {
    console.error("Signup error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Signup failed due to an unexpected error." }) };
  }
};

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

    if (!data || !data.AuthenticationResult) {
      console.warn("Authentication failed for user:", email);
      return { statusCode: 400, body: JSON.stringify({ error: "Authentication failed." }) };
    }

    console.log("Signin successful for:", email);
    return {
      statusCode: 200,
      body: JSON.stringify({ accessToken: data.AuthenticationResult.AccessToken })
    };
  } catch (error) {
    console.error("Signin error:", error);

    if (error.code === "UserNotFoundException") {
      return { statusCode: 400, body: JSON.stringify({ error: "User does not exist." }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Authentication failed" }) };
  }
};
