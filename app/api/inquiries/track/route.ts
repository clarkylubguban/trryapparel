import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "../../../../lib/supabaseServer";

type CustomerStatus = "FOR REVIEW" | "NEEDS QUOTE" | "IN PRODUCTION" | "DELIVERED" | "STATUS UPDATE" | "STATUS ERROR";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function statusKey(value: unknown) {
  return text(value).replace(/_/g, " ").toLowerCase() || "unknown";
}

function mapCustomerStatus(value: unknown): CustomerStatus {
  const status = statusKey(value);

  if (status === "new" || status === "for review") return "FOR REVIEW";
  if (status === "quote" || status === "needs quote") return "NEEDS QUOTE";
  if (status === "in production" || status === "production") return "IN PRODUCTION";
  if (status === "delivered" || status === "completed") return "DELIVERED";
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

  const inquiryNumber = text(body.inquiryNumber).toUpperCase();
  const contact = text(body.contact);

  if (!inquiryNumber || !contact) {
    return NextResponse.json({ ok: false, error: "Inquiry number and contact are required." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("ops_inquiries")
      .select("id, contact, product, quantity, status, created_at")
      .eq("id", inquiryNumber)
      .eq("contact", contact)
      .maybeSingle();

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
      },
    });
  } catch (error) {
    const message = error instanceof Error && error.message === "Supabase server environment is not configured."
      ? "Inquiry tracking service is not configured."
      : "Unable to track inquiry right now. Please try again.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}