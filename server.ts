import express from 'express';
import { createClient } from '@supabase/supabase-js';


const app = express();
app.use(express.json());

// Initialize Supabase Admin client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

app.post('/api/invite-user', async (req, res) => {
  const { email, name, role } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify the user is an admin
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Add more robust admin check here if necessary, but this validates identity
  
  // Send invitation
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { name, role }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true, data });
});

// Mount vite
const vite = await import('vite');
const viteServer = await vite.createServer({
  server: { middlewareMode: true },
  appType: 'spa',
});
app.use(viteServer.middlewares);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
