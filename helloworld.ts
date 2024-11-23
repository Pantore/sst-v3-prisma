/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
import _ from 'lodash'
import {trace} from '@opentelemetry/api'
import {SeverityNumber, logs} from '@opentelemetry/api-logs'
import {SpanStatusCode} from '@opentelemetry/api'
import {prisma} from './prisma'
const tracer = trace.getTracer('app', '1.0.0')
const logger = logs.getLogger('app')
export const lambdaHandler = async (event: any, context: any) => {
    return tracer.startActiveSpan('lambdaHandler', async span => {
        let message = 'hello world'
        message = _.camelCase(message)
        // Basic debug log example
        logger.emit({
            severityText: 'DEBUG',
            severityNumber: SeverityNumber.DEBUG,
            body: message
        })
        try {
            if (Math.random() > 0.5) {
                throw new Error('testing error')
            }

            const users = await prisma.user.findMany({
                take: 5
            })
            console.log('users', users)

            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    message,
                    users
                })
            }
            span.end()
            return response
        } catch (error: any) {
            // Basic error log example
            logger.emit({
                severityText: 'ERROR',
                severityNumber: SeverityNumber.ERROR,
                body: error
            })
            // Set span status and record exception
            if (error instanceof Error) {
                span.recordException(error)
                span.setStatus({code: SpanStatusCode.ERROR, message: error.message})
                const response = {
                    statusCode: 500,
                    body: JSON.stringify({
                        error: error.message ?? 'error'
                    })
                }
                span.end()
                return response
            }
        }
    })
}
