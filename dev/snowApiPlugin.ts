import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { InMemorySnowStore } from '../api/_lib/memoryStore';
import {
  consumeWhisper,
  createWhisper,
  deleteWhisper,
  getWhisperStatus,
  methodNotAllowed,
  validationErrorResult,
} from '../api/_lib/service';
import { MAX_REQUEST_BYTES, RequestValidationError } from '../api/_lib/validation';
import type { ApiResult } from '../api/_lib/contracts';
import { withAppBase } from '../utils/appPaths';

const developmentStore = new InMemorySnowStore();

const routeHandlers = new Map<string, (body: unknown) => Promise<ApiResult>>([
  ['/api/snow/create', (body) => createWhisper(developmentStore, body)],
  ['/api/snow/status', (body) => getWhisperStatus(developmentStore, body)],
  ['/api/snow/consume', (body) => consumeWhisper(developmentStore, body)],
  ['/api/snow/delete', (body) => deleteWhisper(developmentStore, body)],
]);

for (const [path, handler] of [...routeHandlers]) {
  routeHandlers.set(withAppBase(path), handler);
}

function sendJson(response: ServerResponse, result: ApiResult): void {
  response.statusCode = result.status;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [name, value] of Object.entries(result.headers ?? {})) {
    response.setHeader(name, value);
  }
  response.end(JSON.stringify(result.body));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of request) {
    const bytes = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk;
    total += bytes.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      throw new RequestValidationError('BODY_TOO_LARGE', 'Request body exceeds 8 KiB', 413);
    }
    chunks.push(bytes);
  }

  try {
    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
  } catch {
    throw new RequestValidationError('INVALID_JSON', 'Request body must be valid JSON');
  }
}

/** Local-only API parity for browser testing. State is cleared whenever Vite restarts. */
export function snowflakeDevelopmentApi(): Plugin {
  return {
    name: 'snowflake-development-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        const handler = routeHandlers.get(pathname);
        if (!handler) {
          next();
          return;
        }

        void (async () => {
          if (request.method !== 'POST') {
            sendJson(response, methodNotAllowed(['POST']));
            return;
          }

          try {
            sendJson(response, await handler(await readJsonBody(request)));
          } catch (reason) {
            sendJson(response, validationErrorResult(reason));
          }
        })();
      });
    },
  };
}
