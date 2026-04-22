import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', true);
  app.use(express.json());

  // API Route: Build Google Auth URL
  app.get('/api/auth/google/url', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${origin}/auth/callback`;
    
    if (!clientId) {
      return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account'
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url });
  });

  // API Route: Exchange Code for Tokens
  app.post('/api/auth/google/callback', async (req, res) => {
    const { code } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${origin}/auth/callback`;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).json({ error: 'Missing required auth parameters' });
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const { id_token, access_token } = response.data;
      res.json({ id_token, access_token });
    } catch (error: any) {
      console.error('Token exchange failed:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to exchange code for tokens' });
    }
  });

  // Callback page for the popup to communicate back
  app.get('/auth/callback', (req, res) => {
    const { code } = req.query;
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', code: '${code}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authenticating... this window will close automatically.</p>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
