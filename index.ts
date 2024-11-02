const {trace} = require('@opentelemetry/api')

import {prisma} from './prisma'

const tracer = trace.getTracer('sst-v3-prisma', '1.0.0')

export async function handler(event: any, context: any) {
    const span = tracer.startSpan('lambdaHandler')

    try {
        span.setAttribute('event', JSON.stringify(event))

        const users = await prisma.user.findMany({
            take: 6
        })

        console.log('users', users)

        span.addEvent('Lambda execution completed')

        console.error('testing...')

        // throw new Error('testing error')

        return {
            statusCode: 200,
            body: JSON.stringify({users})
        }
    } catch (error: any) {
        span.recordException(error)
        return {
            statusCode: 500,
            body: JSON.stringify({error: error.message})
        }
    } finally {
        span.end()
    }
}
