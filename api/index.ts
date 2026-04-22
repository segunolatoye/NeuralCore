import { createServerApp } from '../server.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await createServerApp();
  return app(req, res);
}
