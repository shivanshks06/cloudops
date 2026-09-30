const pino = require("pino");
const { trace, context } = require("@opentelemetry/api");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: {
    service: "cloudops-api",
    env: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  mixin() {
    const activeSpan = trace.getSpan(context.active());
    if (activeSpan) {
      const spanContext = activeSpan.spanContext();
      return {
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
      };
    }
    return {};
  },
});

module.exports = logger;
