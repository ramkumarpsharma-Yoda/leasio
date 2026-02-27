// supabase/functions/aadhaar-notify/index.ts
// Deploy with: supabase functions deploy aadhaar-notify
//
// Set secrets:
//   supabase secrets set RESEND_API_KEY=re_xxxx
//   supabase secrets set ADMIN_EMAIL=you@yourdomain.com

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record  = payload.record;

    // Only fire when status becomes "pending"
    if (record.verification_status !== "pending") {
      return new Response("skipped", { status: 200 });
    }

    const RESEND_KEY  = Deno.env.get("RESEND_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "Leasio Alerts <alerts@leasio.in>",
        to:      [ADMIN_EMAIL],
        subject: "🪪 New Aadhaar Verification Request",
        html: `
          <h2>New Aadhaar Submission</h2>
          <p><strong>User ID:</strong> ${record.id}</p>
          <p><strong>Submitted at:</strong> ${record.submitted_at}</p>
          <p><strong>Aadhaar (last 4):</strong> ****${record.aadhaar_number?.slice(-4) || "—"}</p>
          <p><strong>View document:</strong>
            <a href="${record.aadhaar_image_url}">Click to open image</a>
          </p>
          <hr/>
          <p>To verify this user, run in Supabase SQL Editor:</p>
          <pre>UPDATE public.user_profiles
SET verification_status = 'verified', verified_at = now()
WHERE id = '${record.id}';</pre>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response("email failed", { status: 500 });
    }

    return new Response("notified", { status: 200 });

  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
});
