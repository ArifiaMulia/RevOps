import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const router = Router();

const LARK_APP_ID = process.env.LARK_APP_ID || '';
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || '';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Standard Login (Email/Password)
router.post('/login', (req, res) => {
  try {
      const { email, password } = req.body;
      
      console.log(`Login attempt for: ${email}`);

      if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
      }

      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      // Hardcoded Super Administrator Credentials (as requested)
      // In a real database scenario, this would check against a Users table with hashed passwords.
      if (cleanEmail === 'arifia.mulia@prasetia.co.id' && cleanPassword === 'Prasetia2025!@') {
        const user = {
          id: 'super_admin_001',
          name: 'Arifia Mulia',
          email: 'arifia.mulia@prasetia.co.id',
          role: 'admin',
          avatar: 'https://ui-avatars.com/api/?name=Arifia+Mulia&background=0D8ABC&color=fff',
          title: 'Super Administrator',
          department: 'Management'
        };

        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
        
        console.log(`Login success for: ${cleanEmail}`);
        return res.json({ token, user });
      }

      console.log(`Login failed for: ${cleanEmail} (Invalid credentials)`);
      // Fallback / Invalid Credentials
      return res.status(401).json({ error: 'Invalid email or password' });
  } catch (error) {
      console.error('Login Route Error:', error);
      return res.status(500).json({ error: 'Internal Server Error during Login' });
  }
});

// Lark OAuth Callback
router.post('/lark/callback', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // 1. Get App Access Token (Internal)
    const appTokenRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal', {
      app_id: LARK_APP_ID,
      app_secret: LARK_APP_SECRET
    });
    
    const appAccessToken = appTokenRes.data.app_access_token;

    // 2. Get User Access Token
    const userTokenRes = await axios.post('https://open.larksuite.com/open-apis/authen/v1/oidc/access_token', {
      grant_type: 'authorization_code',
      code: code
    }, {
      headers: { Authorization: `Bearer ${appAccessToken}` }
    });

    const userAccessToken = userTokenRes.data.data.access_token;

    // 3. Get User Info
    const userInfoRes = await axios.get('https://open.larksuite.com/open-apis/authen/v1/user_info', {
      headers: { Authorization: `Bearer ${userAccessToken}` }
    });

    const larkUser = userInfoRes.data.data;

    // 4. Create Session JWT
    const token = jwt.sign({
      id: larkUser.open_id,
      name: larkUser.name,
      email: larkUser.email || `${larkUser.name}@prasetia.co.id`, // Fallback if email permission not granted
      avatar: larkUser.avatar_url,
      role: (larkUser.email && larkUser.email.includes('admin')) ? 'admin' : 'user' // Simple role logic based on email
    }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({ token, user: larkUser });

  } catch (error: any) {
    console.error('Lark Auth Error:', error.response?.data || error.message);
    // For demo continuity if credentials fail (sandbox mode), return a fallback user if allowed
    if (process.env.ALLOW_MOCK_AUTH === 'true') {
        const mockToken = jwt.sign({
            id: 'mock_user_id',
            name: 'Demo User (Fallback)',
            email: 'demo@prasetia.co.id',
            role: 'admin'
        }, JWT_SECRET);
        return res.json({ token: mockToken, user: { name: 'Demo User' }, warning: 'Using Mock Auth due to Lark Failure' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
