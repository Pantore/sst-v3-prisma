// import {SeverityNumber} from '@opentelemetry/api-logs'
import {SeverityNumber, logs} from '@opentelemetry/api-logs'
const logger = logs.getLogger('app')

const {trace} = require('@opentelemetry/api')
// const api = require('@opentelemetry/api-logs')
import {
    LoggerProvider,
    BatchLogRecordProcessor,
    SimpleLogRecordProcessor
} from '@opentelemetry/sdk-logs'
import {OTLPLogExporter} from '@opentelemetry/exporter-logs-otlp-http'

// // exporter options. see all options in OTLPExporterNodeConfigBase
// const collectorOptions = {
//     url: 'https://rxcto.middleware.io/v1/logs',
//     headers: {
//         // endpoint: 'https://rxcto.middleware.io/v1/logs',
//         Authorization: 'mlqxrmrfoblijrpfilgnqbotrfdmnckfyqaw'
//         // 'mw.account_key': 'mlqxrmrfoblijrpfilgnqbotrfdmnckfyqaw'
//     },
//     // url: '<opentelemetry-collector-url>', // url is optional and can be omitted - default is http://localhost:4318/v1/logs
//     concurrencyLimit: 1 // an optional limit on pending requests
// }
// const logExporter = new OTLPLogExporter(collectorOptions)
// const loggerProvider = new LoggerProvider()
//
// loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter))
//
// const logger = loggerProvider.getLogger('default', '1.0.0')

import {prisma} from './prisma'

const tracer = trace.getTracer('sst-v3-prisma', '1.0.0')

export async function handler(event: any, context: any) {
    await tracer.startActiveSpan('lambdaHandler', async (span: any) => {
        try {
            // console.log('api', api)
            span.setAttribute('event', JSON.stringify(event))

            const users = await prisma.user.findMany({
                take: 6
            })

            // Emit a log
            logger.emit({
                severityNumber: SeverityNumber.INFO,
                severityText: 'info',
                body: 'this is a log body',
                attributes: {'log.type': 'custom'}
            })

            console.log('users', users)

            span.addEvent('Lambda execution completed')

            console.error('testing...')

            if (Math.random() > 0.5) {
                throw new Error('testing error')
            }

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
            // span.end()
        }
    })
}
