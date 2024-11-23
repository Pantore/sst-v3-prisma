const {SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base')
const {OTLPTraceExporter} = require('@opentelemetry/exporter-trace-otlp-proto')
const {registerInstrumentations} = require('@opentelemetry/instrumentation')
const {PrismaInstrumentation} = require('@prisma/instrumentation')
const {MySQLInstrumentation} = require('@opentelemetry/instrumentation-mysql')
global.configureTracerProvider = tracerProvider => {
    console.log('Configuring tracer provider with Simple Span Processor')
    const spanProcessor = new SimpleSpanProcessor(new OTLPTraceExporter())
    tracerProvider.addSpanProcessor(spanProcessor)
}
registerInstrumentations({
    instrumentations: [new PrismaInstrumentation(), new MySQLInstrumentation()]
    // instrumentations: [new MySQLInstrumentation()]
})
