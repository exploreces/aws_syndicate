/**
 * Sends a request to the attached data source
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    return {
        version: "2018-05-29",
        operation: "GetItem",
        key: { id: { S: ctx.arguments.id } }
    };
}

/**
 * Returns the resolver result
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the result
 */
export function response(ctx) {
    if (!ctx.result) {
        throw new Error("Event not found");
    }

    return {
        id: ctx.result.id.S,
        userId: parseInt(ctx.result.userId.N, 10),
        createdAt: ctx.result.createdAt.S,
        payLoad: {
            meta: {
                key1: parseInt(ctx.result.payLoad.M.meta.M.key1.N, 10),
                key2: ctx.result.payLoad.M.meta.M.key2.S
            }
        }
    };
}
