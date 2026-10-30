import 'dotenv/config';
import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// If running in development environment, synchronize missing keys from .dev.env.json if present
if (fs.existsSync('/app/.dev.env.json')) {
  try {
    const devEnv = JSON.parse(fs.readFileSync('/app/.dev.env.json', 'utf8'));
    for (const [k, v] of Object.entries(devEnv)) {
      if (!process.env[k] && typeof v === 'string') {
        process.env[k] = v;
      }
    }
  } catch {
    // Ignore JSON parse errors in dev env file
  }
}

export const app = express();
app.use(express.json());

// Initialize Supabase Admin client
const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || '';
const matchUrl = rawSupabaseUrl.match(/(https:\/\/[a-z0-9-]+\.supabase\.co)/i);
const supabaseUrl = matchUrl ? matchUrl[1] : rawSupabaseUrl.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export let supabaseAdmin: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  console.warn('SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL not set. Server-side Supabase features disabled.');
}

// In-memory rate limiter: max 10 requests per minute per IP / caller
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  return true;
}

export const ALLOWED_ROLES = [
  'Owner / Administrator',
  'Manager',
  'Salesperson',
  'Storekeeper',
  'Accountant',
  'Delivery Driver'
] as const;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper to authenticate caller and verify active Owner/Admin role
async function verifyActiveAdminCaller(req: Request, res: Response): Promise<{
  user: any;
  profile: any;
  token: string;
} | null> {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Backend administrative service is not configured.' });
    return null;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or malformed Bearer token.' });
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Empty token provided.' });
    return null;
  }

  // 1. Verify user with Supabase Auth
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token.' });
    return null;
  }

  // Rate limit by verified user ID
  if (!checkRateLimit(`user_${user.id}`)) {
    res.status(429).json({ error: 'Too many requests. Please wait a minute before retrying.' });
    return null;
  }

  // 2. Query authoritative profile from DB
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, user_id, company_id, role, status')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    res.status(403).json({ error: 'Forbidden: No ERP user profile found for authenticated account.' });
    return null;
  }

  if (profile.status !== 'active') {
    res.status(403).json({ error: 'Forbidden: Caller account is deactivated or suspended.' });
    return null;
  }

  if (profile.role !== 'Owner / Administrator') {
    res.status(403).json({ error: 'Forbidden: Only active Owner / Administrator accounts can perform this action.' });
    return null;
  }

  if (!profile.company_id) {
    res.status(403).json({ error: 'Forbidden: Caller profile is not bound to a tenant company.' });
    return null;
  }

  // 3. Verify caller's company is active
  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .select('id, status')
    .eq('id', profile.company_id)
    .single();

  if (companyError || !company || company.status !== 'active') {
    res.status(403).json({ error: 'Forbidden: Tenant company is inactive or not found.' });
    return null;
  }

  return { user, profile, token };
}

// 1. POST /api/invite-user
app.post('/api/invite-user', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(`ip_${ip}`)) {
    return res.status(429).json({ error: 'Too many requests from this IP. Please slow down.' });
  }

  const callerContext = await verifyActiveAdminCaller(req, res);
  if (!callerContext) return; // Response already sent

  const { profile } = callerContext;

  // 1. Sanitize & validate request parameters
  const rawEmail = typeof req.body?.email === 'string' ? req.body.email : '';
  const cleanEmail = rawEmail.trim().toLowerCase();
  const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const requestedRole = req.body?.role;

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: 'Valid recipient email address is required.' });
  }

  if (!rawName) {
    return res.status(400).json({ error: 'Recipient name is required.' });
  }

  if (!requestedRole || !ALLOWED_ROLES.includes(requestedRole)) {
    return res.status(400).json({ 
      error: `Invalid role specified. Allowed roles: ${ALLOWED_ROLES.join(', ')}` 
    });
  }

  // 2. Query pending invitations for THIS tenant company and normalized email
  const { data: invitations, error: inviteQueryError } = await supabaseAdmin
    .from('user_invitations')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('email', cleanEmail)
    .eq('status', 'pending');

  if (inviteQueryError) {
    return res.status(500).json({ error: 'Failed to query company invitation records.' });
  }

  if (!invitations || invitations.length === 0) {
    return res.status(404).json({ 
      error: 'No pending invitation record found for this email in caller company. Record invitation first via admin_invite_user.' 
    });
  }

  if (invitations.length > 1) {
    return res.status(409).json({ 
      error: 'Ambiguous invitation state: multiple pending invitations exist for this email. Contact system administrator.' 
    });
  }

  const invitation = invitations[0];

  // 3. Verify security-sensitive fields match stored invitation (prevent role/parameter spoofing)
  if (invitation.role !== requestedRole) {
    return res.status(400).json({ 
      error: `Security role mismatch: requested role (${requestedRole}) does not match recorded invitation role (${invitation.role}).` 
    });
  }

  // 4. Dispatch invitation via Supabase Auth Admin API
  const { data: authData, error: authInviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanEmail, {
    data: {
      name: invitation.name,
      display_name: invitation.display_name || invitation.name,
      role: invitation.role,
      company_id: profile.company_id, // Authoritative company ID from caller DB profile
      assigned_warehouse: invitation.assigned_warehouse || null,
    }
  });

  if (authInviteError) {
    // Record delivery failure in database for safe retry and reconciliation
    await supabaseAdmin
      .from('user_invitations')
      .update({
        delivery_status: 'delivery_failed',
        delivery_error: authInviteError.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    return res.status(502).json({
      success: false,
      error: `Auth email delivery failed: ${authInviteError.message}`,
      deliveryStatus: 'delivery_failed',
      invitationId: invitation.id
    });
  }

  // 5. Delivery confirmed: update invitation tracking
  await supabaseAdmin
    .from('user_invitations')
    .update({
      delivery_status: 'delivered',
      delivery_error: null,
      last_delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', invitation.id);

  return res.status(200).json({
    success: true,
    message: `Invitation email successfully dispatched to ${cleanEmail}.`,
    deliveryStatus: 'delivered',
    invitationId: invitation.id,
    authUserId: authData?.user?.id
  });
});

// 2. POST /api/admin/delete-user
app.post('/api/admin/delete-user', async (req: Request, res: Response) => {
  const callerContext = await verifyActiveAdminCaller(req, res);
  if (!callerContext) return;

  const { user: callerUser, profile: callerProfile } = callerContext;
  const targetProfileId = req.body?.profileId;

  if (!targetProfileId || typeof targetProfileId !== 'string') {
    return res.status(400).json({ error: 'Valid target profileId is required.' });
  }

  // 1. Fetch target profile belonging to the SAME company
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, user_id, email, company_id, role, status')
    .eq('id', targetProfileId)
    .eq('company_id', callerProfile.company_id)
    .single();

  if (targetError || !targetProfile) {
    return res.status(404).json({ error: 'Target user profile not found in your company.' });
  }

  // 2. Prevent self-deletion
  if (targetProfile.user_id === callerUser.id) {
    return res.status(400).json({ error: 'Administrators cannot delete their own account.' });
  }

  // 3. If target is Owner / Admin, check that at least one other active owner remains
  if (targetProfile.role === 'Owner / Administrator') {
    const { count, error: countError } = await supabaseAdmin
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', callerProfile.company_id)
      .eq('role', 'Owner / Administrator')
      .eq('status', 'active');

    if (countError || (count !== null && count <= 1)) {
      return res.status(400).json({ error: 'Cannot remove the last active Owner / Administrator of the company.' });
    }
  }

  // 4. Call database RPC admin_delete_user to delete profile and enforce database triggers/RLS
  const { error: rpcError } = await supabaseAdmin.rpc('admin_delete_user', {
    p_profile_id: targetProfileId
  });

  if (rpcError) {
    return res.status(400).json({ error: `User deletion failed in database: ${rpcError.message}` });
  }

  // 5. Delete underlying Auth user if user_id exists
  let authDeleted = false;
  if (targetProfile.user_id) {
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetProfile.user_id);
    if (!authDeleteError) {
      authDeleted = true;
    } else {
      console.warn(`Database profile removed, but Auth user cleanup failed: ${authDeleteError.message}`);
    }
  }

  return res.status(200).json({
    success: true,
    message: authDeleted 
      ? 'User profile and authentication account permanently removed.'
      : 'User profile permanently removed. Database RLS guarantees user has no tenant access.',
    profileId: targetProfileId,
    authDeleted
  });
});

// Vite middleware mounting for development
import { fileURLToPath } from 'url';
import http from 'http';

const isDirectRun = Boolean(process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]);
if (isDirectRun && process.env.NODE_ENV !== 'test') {
  const server = http.createServer(app);
  const vite = await import('vite');
  const viteServer = await vite.createServer({
    server: { 
      middlewareMode: true,
      hmr: { server }
    },
    appType: 'spa',
  });
  app.use(viteServer.middlewares);

  server.listen(3000, () => {
    console.log('Zaid Trading ERP Server running on http://localhost:3000');
  });
}

