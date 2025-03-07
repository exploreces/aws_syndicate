import { v4 as uuidv4 } from 'uuid';

/**
 * Sends a request to the attached data source
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const id = uuidv4(); // Generate UUID
    const createdAt = new Date().toISOString(); // ISO 8601 format
    const payLoad = JSON.parse(ctx.arguments.payLoad); // Convert JSON string to an object

    return {
        version: "2018-05-29",
        operation: "PutItem",
        key: { id: { S: id } },
        attributeValues: {
            id: { S: id },
            userId: { N: String(ctx.arguments.userId) }, // Store userId as a Number
            createdAt: { S: createdAt },
            payLoad: {
                M: {
                    meta: {
                        M: {
                            key1: { N: String(payLoad.meta.key1) },
                            key2: { S: payLoad.meta.key2 }
                        }
                    }
                }
            }
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
    return {
        id: ctx.result.id.S,
        createdAt: ctx.result.createdAt.S
    };
}
