import {prisma} from "./prisma";

export async function handler() {
    const users = await prisma.user.findMany({
        take: 6
    })
    console.log('users', users)
    return {
        statusCode: 200,
        body: JSON.stringify({users}),
    };
}
