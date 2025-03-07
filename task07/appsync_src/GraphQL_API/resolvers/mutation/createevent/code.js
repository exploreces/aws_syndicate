
/**
 * Sends a request to the attached data source
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */

export function request(ctx) {
    return {
        version: "2018-05-29",
        operation: "Invoke",
        payload: ctx.arguments // Passes input arguments to the data source
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
    return ctx.result;
}
