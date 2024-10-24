import {prisma} from "./prisma";

export async function handler() {
    const users = await prisma.user.findMany({
        take: 10
    })
    return {
        statusCode: 201,
        body: JSON.stringify({users}),
    };
}
