import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "../../../../lib/supabaseServer";

type CustomerStatus = "FOR REVIEW" | "NEEDS QUOTE" | "IN PRODUCTION" | "DELIVERED" | "STATUS UPDATE";
type Method = "DTF Transfer" | "Embroidery" | "Screen Print";

const METHODS: Method[] = ["DTF Transfer", "Embroidery", "Screen Print"];

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mapCustomerStatus(value: unknown): CustomerStatus {
  const status = String(value || "").trim().replace(/_/g, " ").toLowerCase();

  if (status === "new" || status === "for review") return "FOR REVIEW";
  if (status === "quote" || status === "needs quote") return "NEEDS QUOTE";
  if (status === "in production" || status === "production") return "IN PRODUCTION";
  if (status === "delivered" || status === "completed") return "DELIVERED";
  return "STATUS UPDATE";
}

function parseProductAndMethod(value: unknown) {
  const product = text(value);
  const method = METHODS.find((item) => product.endsWith(` - ${item}`));

  if (!method) {
    return { productName: product || "TRRY Inquiry", method: "DTF Transfer" as Method };
  }

  return {
    productName: product.slice(0, -` - ${method}`.length) || product,
    method,
  };
}

function parseTotalPieces(value: unknown) {
  const quantity = text(value);
  const match = quantity.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid tracking request." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid tracking request." }, { status: 400 });
  }

  const inquiryNumber = text(body.inquiryNumber).toUpperCase();
  const contact = text(body.contact);

  if (!inquiryNumber || !contact) {
    return NextResponse.json({ error: "Inquiry number and contact are required." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("ops_inquiries")
      .select("id, customer_name, contact, product, quantity, status, created_at, next_action")
      .eq("id", inquiryNumber)
      .eq("contact", contact)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Unable to track inquiry right now. Please try again." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "No inquiry found." }, { status: 404 });
    }

    const { productName, method } = parseProductAndMethod(data.product);

    return NextResponse.json({
      inquiry: {
        ref: String(data.id),
        createdAt: typeof data.created_at === "string" ? data.created_at : new Date().toISOString(),
        productName,
        method,
        totalPieces: parseTotalPieces(data.quantity),
        quantitySummary: text(data.quantity),
        customerName: text(data.customer_name),
        customerContact: text(data.contact),
        status: mapCustomerStatus(data.status),
        nextAction: text(data.next_action),
      },
    });
  } catch (error) {
    const message = error instanceof Error && error.message === "Supabase server environment is not configured."
      ? "Inquiry tracking service is not configured."
      : "Unable to track inquiry right now. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}