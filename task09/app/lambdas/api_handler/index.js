const { getWeatherData } = require('/opt/weather-sdk');  // Import from Lambda Layer

exports.handler = async (event) => {
    const path = event?.path || '/';
    const method = event?.httpMethod || 'GET';

    if (path !== "/weather" || method !== "GET") {
        return {
            statusCode: 400,
            body: JSON.stringify({
                statusCode: 400,
                message: `Bad request syntax or unsupported method. Request path: ${path}. HTTP method: ${method}`
            }),
            headers: { "content-type": "application/json" },
            isBase64Encoded: false
        };
    }

    try {
        const weatherData = await getWeatherData();
        return {
            statusCode: 200,
            body: JSON.stringify(weatherData),
            headers: { "content-type": "application/json" },
            isBase64Encoded: false
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
            headers: { "content-type": "application/json" },
            isBase64Encoded: false
        };
    }
};
