import express from 'express';
import axios from 'axios';

const app = express();
app.set('trust proxy', true);
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
});

// API Route: Build Google Auth URL
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  // Use Vercel URL or fallback to detected host
  const origin = process.env.APP_URL || (req.get('host') ? `https://${req.get('host')}` : '');
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
  const origin = process.env.APP_URL || (req.get('host') ? `https://${req.get('host')}` : '');
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

    res.json(response.data);
  } catch (error: any) {
    console.error('Token exchange failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
});

// Callback page for the popup
app.get('/auth/callback', (req, res) => {
  const { code } = req.query;
  res.send(`
    <html>
      <head><title>Success</title></head>
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

// Export the handler for Vercel
export default function handler(req: any, res: any) {
  return app(req, res);
}
