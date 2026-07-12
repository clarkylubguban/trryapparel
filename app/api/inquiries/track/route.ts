import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "../../../../lib/supabaseServer";

type CustomerStatus = "FOR REVIEW" | "NEEDS QUOTE" | "PROOF APPROVAL" | "IN PRODUCTION" | "PICKUP OR DELIVERY" | "DELIVERED" | "INQUIRY CLOSED / LOST" | "STATUS UPDATE" | "STATUS ERROR";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function statusKey(value: unknown) {
  return text(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ") || "unknown";
}

function mapCustomerStatus(value: unknown): CustomerStatus {
  const status = statusKey(value);

  if (["new", "inquiry received", "for review"].includes(status)) return "FOR REVIEW";
  if (["quote", "needs quote", "sent", "quote sent", "followup", "follow up"].includes(status)) return "NEEDS QUOTE";
  if (["won", "odoo created", "approved", "proof approval", "proof approved"].includes(status)) return "PROOF APPROVAL";
  if (["production", "in production"].includes(status)) return "IN PRODUCTION";
  if (["ready", "ready for pickup", "pickup", "delivery"].includes(status)) return "PICKUP OR DELIVERY";
  if (["delivered", "completed"].includes(status)) return "DELIVERED";
  if (["lost", "cancelled", "canceled"].includes(status)) return "INQUIRY CLOSED / LOST";
  return "STATUS UPDATE";
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid tracking request." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "Invalid tracking request." }, { status: 400 });
  }

  const inquiryNumber = text(body.inquiryNumber || body.id).toUpperCase();
  const contact = text(body.contact);

  if (!inquiryNumber || !contact) {
    return NextResponse.json({ ok: false, error: "Inquiry number and contact are required." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const initialLookup = await supabase
      .from("ops_inquiries")
      .select("id, contact, product, quantity, status, created_at, fulfillment_method, delivery_city, delivery_address, delivery_landmark")
      .eq("id", inquiryNumber)
      .eq("contact", contact)
      .maybeSingle();

    let data: Record<string, unknown> | null = initialLookup.data;
    let error = initialLookup.error;

    if (error && /fulfillment_method|delivery_city|delivery_address|delivery_landmark|schema cache|could not find/i.test(error.message || "")) {
      const fallback = await supabase
        .from("ops_inquiries")
        .select("id, contact, product, quantity, status, created_at")
        .eq("id", inquiryNumber)
        .eq("contact", contact)
        .maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ ok: false, error: "Unable to track inquiry right now. Please try again." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: "No inquiry found." }, { status: 404 });
    }

    const key = statusKey(data.status);

    return NextResponse.json({
      ok: true,
      inquiry: {
        id: String(data.id),
        product: text(data.product) || "TRRY Inquiry",
        quantity: text(data.quantity) || "Quantity pending review",
        submittedAt: typeof data.created_at === "string" ? data.created_at : new Date().toISOString(),
        artworkLabel: "Artwork details saved with inquiry",
        statusKey: key,
        statusLabel: mapCustomerStatus(key),
        fulfillmentMethod: text(data.fulfillment_method),
        deliveryCity: text(data.delivery_city),
        deliveryAddress: text(data.delivery_address),
        deliveryLandmark: text(data.delivery_landmark),
      },
    });
  } catch (error) {
    const message = error instanceof Error && error.message === "Supabase server environment is not configured."
      ? "Inquiry tracking service is not configured."
      : "Unable to track inquiry right now. Please try again.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}