import { createBackendApp } from '../backend/app.ts';

const app = createBackendApp();

export default async function handler(req: any, res: any) {
  return app(req, res);
}
