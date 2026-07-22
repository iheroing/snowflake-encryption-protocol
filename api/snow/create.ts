import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runJsonEndpoint } from '../_lib/http.js';
import { createWhisper, methodNotAllowed } from '../_lib/service.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    const result = methodNotAllowed(['POST']);
    for (const [name, value] of Object.entries(result.headers ?? {})) res.setHeader(name, value);
    res.status(result.status).json(result.body);
    return;
  }
  await runJsonEndpoint(req, res, {
    route: 'create',
    limit: 20,
    windowSeconds: 60 * 60,
    handler: createWhisper,
  });
}
