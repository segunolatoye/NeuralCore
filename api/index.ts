import { createServerApp } from '../server.ts';

export default async function handler(req: any, res: any) {
  try {
    const app = await createServerApp();
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel Function Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
