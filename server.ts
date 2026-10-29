import express from 'express';
import { createClient } from '@supabase/supabase-js';


const app = express();
app.use(express.json());

// Initialize Supabase Admin client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn('SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL not set. Backend features will be disabled.');
}

app.post('/api/invite-user', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Backend service not configured.' });
  }

  const { email, name, role } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  // 1. Verify user
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
  if (userError || !user) return res.status(401).json({ error: 'Unauthorized' });

  // 2. Verify admin status & company
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('company_id, role')
    .eq('user_id', user.id)
    .single();
  
  if (profileError || profile.role !== 'Owner / Administrator') {
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }

  // 3. Validate input
  const cleanEmail = email?.trim().toLowerCase();
  const allowedRoles = ['Manager', 'Salesperson', 'Storekeeper', 'Accountant', 'Delivery Driver'];
  if (!cleanEmail || !allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid request data.' });
  }

  // 4. Verify pending invitation exists for THIS company
  const { data: invitation, error: inviteError } = await supabaseAdmin
    .from('user_invitations')
    .select('id')
    .eq('company_id', profile.company_id)
    .eq('email', cleanEmail)
    .eq('status', 'pending')
    .single();

  if (inviteError || !invitation) {
    return res.status(404).json({ error: 'No pending invitation found for this user.' });
  }
  
  // 5. Send invitation
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanEmail, {
    data: { name, role, company_id: profile.company_id }
  });

  if (error) return res.status(400).json({ error: error.message });

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
