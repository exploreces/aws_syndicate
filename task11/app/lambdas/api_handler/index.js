/**
 * Signup Handler (Fixed)
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

    // Try creating the user
    await cognito.adminCreateUser({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
        { Name: "email", Value: email },
      ],
      TemporaryPassword: password,
      MessageAction: "SUPPRESS",
    }).promise();

    // Set permanent password
    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true, // Makes the password permanent
    }).promise();

    console.log("User created successfully:", email);
    return { statusCode: 200, body: JSON.stringify({ message: "User created successfully." }) };

  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === "UsernameExistsException") {
      return { statusCode: 409, body: JSON.stringify({ error: "User already exists." }) };
    }

    return { statusCode: 500, body: JSON.stringify({ error: "Signup failed." }) };
  }
};

/**
 * Signin Handler (Fixed)
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

    if (error.code === "UserNotFoundException") {
      return { statusCode: 400, body: JSON.stringify({ error: "User does not exist." }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Authentication failed" }) };
  }
};
