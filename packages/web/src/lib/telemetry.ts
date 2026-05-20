import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

/**
 * Browser RUM. No-op unless VITE_OTEL_EXPORTER_OTLP_ENDPOINT is set at build
 * time — local dev and any build without a collector stay uninstrumented.
 *
 * Note: the OTLP endpoint must allow CORS from the SPA origin, since spans are
 * POSTed directly from the browser. SigNoz's collector needs CORS configured
 * for this to deliver.
 */
export function initTelemetry(): void {
  const endpoint = import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;

  // Cross-origin API calls (dev: web:3000 → api:3001) need the `traceparent`
  // header allowed through CORS to stitch browser spans to server spans.
  const apiUrl = import.meta.env.VITE_API_URL;
  const propagateTo: (string | RegExp)[] = apiUrl ? [apiUrl] : [/\/api\//];

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'philosophy-explorer-web',
      'deployment.environment': import.meta.env.MODE,
    }),
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({ url: `${endpoint.replace(/\/$/, '')}/v1/traces` }),
      ),
    ],
  });

  provider.register({ contextManager: new ZoneContextManager() });

  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-fetch': {
          propagateTraceHeaderCorsUrls: propagateTo,
          clearTimingResources: true,
        },
        '@opentelemetry/instrumentation-xml-http-request': {
          propagateTraceHeaderCorsUrls: propagateTo,
        },
      }),
    ],
  });
}
