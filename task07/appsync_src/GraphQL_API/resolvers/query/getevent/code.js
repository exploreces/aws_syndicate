/**
 * Sends a request to the attached data source
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    return {
        version: "2018-05-29",
        operation: "GetItem",
        key: {
            id: { S: ctx.arguments.id }
        }
    };
}

/**
 * Returns the resolver result
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the result
 */
export function response(ctx) {
    if (ctx.error) {
        throw new Error(`Data source error: ${ctx.error.message}`);
    }

    if (!ctx.result) {
        return null; // Handle not found case
    }

    return {
        id: ctx.result.id.S,
        userId: parseInt(ctx.result.userId.N, 10),
        createdAt: ctx.result.createdAt.S,
        payLoad: JSON.parse(ctx.result.payLoad.S)
    };
}
