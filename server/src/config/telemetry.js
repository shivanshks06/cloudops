const { NodeSDK } = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const { resourceFromAttributes } = require("@opentelemetry/resources");

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces";

const traceExporter = new OTLPTraceExporter({
  url: otlpEndpoint,
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    "service.name": "cloudops-api",
    "service.version": "1.0.0",
    "deployment.environment": process.env.NODE_ENV || "development",
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingRequestHook: (req) => req.url === "/health" || req.url === "/metrics",
      },
      "@opentelemetry/instrumentation-pg": {
        enabled: true,
        enhancedDatabaseReporting: true,
      },
    }),
  ],
});

sdk.start();
console.log(`[OpenTelemetry] Initialized -> Shipping to Jaeger (${otlpEndpoint})`);

process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("[OpenTelemetry] SDK terminated"))
    .catch((error) => console.log("[OpenTelemetry] Error terminating SDK", error))
    .finally(() => process.exit(0));
});

module.exports = sdk;
