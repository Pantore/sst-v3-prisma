const {SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base')
const {OTLPTraceExporter} = require('@opentelemetry/exporter-trace-otlp-proto')

global.configureTracerProvider = tracerProvider => {
    console.log('Configuring tracer provider with Simple Span Processor')
    const spanProcessor = new SimpleSpanProcessor(new OTLPTraceExporter())
    tracerProvider.addSpanProcessor(spanProcessor)
}
