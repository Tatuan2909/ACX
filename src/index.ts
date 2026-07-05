// Supabase Edge Function: sepay-webhook
//
// Deploy:
//   supabase functions deploy sepay-webhook --no-verify-jwt
//   supabase secrets set SEPAY_WEBHOOK_API_KEY=your-chosen-secret
//
// Then in the SePay dashboard, add a webhook pointing to:
//   https://<project-ref>.supabase.co/functions/v1/sepay-webhook
// with header:
//   Authorization: Apikey your-chosen-secret
// (SePay lets you set any string as the API key it sends back to you.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SEPAY_WEBHOOK_API_KEY = Deno.env.get("SEPAY_WEBHOOK_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Order codes are generated as ACX + 9 hex chars, e.g. ACX7F3K9Q1B0
const ORDER_CODE_RE = /ACX[0-9A-F]{9}/i;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!SEPAY_WEBHOOK_API_KEY || authHeader !== `Apikey ${SEPAY_WEBHOOK_API_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // SePay's payload includes (among other fields): id, gateway, content,
  // transferAmount, transferType ("in"/"out"), referenceCode, accountNumber.
  const transferType = String(payload.transferType ?? "in");
  if (transferType !== "in") {
    // Ignore outgoing transactions
    return new Response(JSON.stringify({ success: true, ignored: "not incoming" }), { status: 200 });
  }

  const content = String(payload.content ?? payload.description ?? "");
  const amount = Number(payload.transferAmount ?? 0);
  const transactionId = String(payload.id ?? payload.referenceCode ?? "");

  const match = content.match(ORDER_CODE_RE);
  if (!match) {
    // Not one of our top-up transfers (or the note was typed wrong) — do
    // not error, so SePay doesn't keep retrying forever.
    return new Response(JSON.stringify({ success: true, note: "no order code found" }), { status: 200 });
  }
  const orderCode = match[0].toUpperCase();

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data, error } = await supabase.rpc("confirm_topup_by_order_code", {
    p_order_code: orderCode,
    p_sepay_transaction_id: transactionId,
    p_amount: amount,
  });

  if (error) {
    console.error("confirm_topup_by_order_code error", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, matched: data }), { status: 200 });
});
