import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runJsonEndpoint } from '../_lib/http.js';
import { deleteWhisper, methodNotAllowed } from '../_lib/service.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    const result = methodNotAllowed(['POST', 'DELETE']);
    for (const [name, value] of Object.entries(result.headers ?? {})) res.setHeader(name, value);
    res.status(result.status).json(result.body);
    return;
  }
  await runJsonEndpoint(req, res, {
    route: 'delete',
    limit: 30,
    windowSeconds: 60,
    requiredIntent: 'revoke',
    handler: deleteWhisper,
  });
}
