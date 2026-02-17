import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const invites = [
      { email: "ryan+admin@miloe.ai", role: "admin" },
      { email: "ryan+lawyer@miloe.ai", role: "user" },
      { email: "ryan+user@miloe.ai", role: "user" }
    ];

    const results = [];
    for (const invite of invites) {
      try {
        await base44.asServiceRole.users.inviteUser(invite.email, invite.role);
        results.push({ email: invite.email, status: "invited" });
      } catch (e) {
        results.push({ email: invite.email, status: "error", message: e.message });
      }
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});