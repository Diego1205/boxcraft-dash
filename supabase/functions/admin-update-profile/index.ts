import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const callerId = claims.claims.sub

    // Verify caller is platform admin
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: adminCheck } = await adminClient
      .from('platform_admins')
      .select('id')
      .eq('user_id', callerId)
      .maybeSingle()

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Not a platform admin' }), { status: 403, headers: corsHeaders })
    }

    const { target_user_id, full_name, email } = await req.json()

    if (!target_user_id) {
      return new Response(JSON.stringify({ error: 'target_user_id required' }), { status: 400, headers: corsHeaders })
    }

    // Update profile
    const profileUpdate: Record<string, string> = {}
    if (full_name !== undefined) profileUpdate.full_name = full_name
    if (email !== undefined) profileUpdate.email = email

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .update(profileUpdate)
        .eq('id', target_user_id)
      if (profileError) throw profileError
    }

    // If email changed, also update auth.users
    if (email) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(target_user_id, { email })
      if (authError) throw authError
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
