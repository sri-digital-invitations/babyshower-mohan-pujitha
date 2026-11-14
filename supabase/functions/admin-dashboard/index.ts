
// Supabase Edge Function: admin-dashboard

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
  });

function constantTimeEqual(a: string, b: string): boolean {

  const encoder = new TextEncoder();

  const aa = encoder.encode(a);
  const bb = encoder.encode(b);

  let diff = aa.length ^ bb.length;

  const length = Math.max(aa.length, bb.length);

  for (let i = 0; i < length; i++) {
    diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  }

  return diff === 0;
}

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  if (req.method !== "POST") {
    return json(
      { error: "Method not allowed." },
      405
    );
  }

  //const expectedPassword = "MoPu@1234";
const expectedPassword = Deno.env.get("ADMIN_PASSWORD") ?? "";
  const supabaseUrl =
    Deno.env.get("SUPABASE_URL") ?? "";

  const serviceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!expectedPassword || !supabaseUrl || !serviceKey) {
    return json({
      error: "Admin function is not configured. Check its Supabase secrets."
    }, 500);
  }

  // Verify shared admin password
  const suppliedPassword =
    req.headers.get("x-admin-password") ?? "";

  if (!constantTimeEqual(suppliedPassword, expectedPassword)) {
    return json(
      { error: "Incorrect admin password." },
      401
    );
  }

  let body: {
    action?: string;
    id?: number;
    approved?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return json(
      { error: "Invalid request body." },
      400
    );
  }

  const base =
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1`;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  async function rest(
    path: string,
    init: RequestInit = {}
  ) {

    const response = await fetch(
      `${base}/${path}`,
      {
        ...init,
        headers: {
          ...headers,
          ...(init.headers || {})
        }
      }
    );

    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `Database request failed (${response.status}): ${text.slice(0, 300)}`
      );
    }

    return text ? JSON.parse(text) : null;
  }

  try {

    // Load all dashboard data
    if (body.action === "dashboard") {

      const [
        rsvps,
        wishes,
        predictionRows
      ] = await Promise.all([

        rest(
          "guest_rsvps?select=id,guest_name,attending,guest_count,created_at&order=created_at.desc"
        ),

        rest(
          "guest_wishes?select=id,guest_name,message,approved,created_at&order=created_at.desc"
        ),

        rest(
          "guest_predictions?select=choice"
        )

      ]);

      const predictions = {

        girl_count: predictionRows.filter(
          (r: { choice: string }) => r.choice === "girl"
        ).length,

        boy_count: predictionRows.filter(
          (r: { choice: string }) => r.choice === "boy"
        ).length,

      };

      return json({
        rsvps,
        wishes,
        predictions
      });

    }

    // Approve or unapprove a wish
    if (body.action === "review_wish") {

      const id = Number(body.id);
      const approved = body.approved;

      if (
        !Number.isSafeInteger(id) ||
        id < 1 ||
        typeof approved !== "boolean"
      ) {
        return json(
          { error: "Invalid wish review request." },
          400
        );
      }

      const updated = await rest(
        `guest_wishes?id=eq.${id}`,
        {
          method: "PATCH",

          headers: {
            Prefer: "return=representation"
          },

          body: JSON.stringify({
            approved
          }),
        }
      );

      if (!Array.isArray(updated) || updated.length === 0) {
        return json(
          { error: "Wish not found." },
          404
        );
      }

      return json({
        success: true,
        wish: updated[0]
      });

    }

    return json(
      { error: "Unknown action." },
      400
    );

  } catch (error) {

    console.error(error);

    return json({
      error:
        error instanceof Error
          ? error.message
          : "Unexpected server error."
    }, 500);

  }

});
