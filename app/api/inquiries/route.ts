import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "../../../lib/supabaseServer";

type Method = "DTF Transfer" | "Embroidery" | "Screen Print";
type ArtworkSource = "upload" | "canva" | "send-later";

const METHODS: Method[] = ["DTF Transfer", "Embroidery", "Screen Print"];
const ARTWORK_SOURCES: ArtworkSource[] = ["upload", "canva", "send-later"];

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sizeRunSummary(value: unknown) {
  if (!isRecord(value)) return "";

  const entries = Object.entries(value)
    .filter(([, qty]) => typeof qty === "number" && Number.isFinite(qty) && qty > 0)
    .map(([size, qty]) => `${size}: ${qty}`);

  return entries.join(", ");
}

function pieceLabel(totalPieces: number) {
  return String(totalPieces) + " " + (totalPieces === 1 ? "pc" : "pcs");
}

function generateReferenceCandidate() {
  return `TRRY-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function createUniqueReference() {
  const supabase = getSupabaseAdminClient();

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = generateReferenceCandidate();
    const { data, error } = await supabase
      .from("ops_inquiries")
      .select("id")
      .eq("id", candidate)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return candidate;
    }
  }

  throw new Error("Unable to generate inquiry reference.");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid inquiry request." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid inquiry request." }, { status: 400 });
  }

  const customerName = text(body.customerName);
  const customerContact = text(body.customerContact);
  const productId = text(body.productId);
  const productName = text(body.productName);
  const method = text(body.method) as Method;
  const totalPieces = typeof body.totalPieces === "number" ? body.totalPieces : Number(body.totalPieces);
  const artworkSource = text(body.artworkSource) as ArtworkSource;
  const rightsConfirmed = body.rightsConfirmed === true;
  const canvaLink = text(body.canvaLink);
  const artworkName = text(body.artworkName);
  const notes = text(body.notes);
  const methodMoq = typeof body.methodMoq === "number" ? body.methodMoq : Number(body.methodMoq);
  const customerSubmittedAt = text(body.customerSubmittedAt);
  const neededDate = text(body.neededDate);

  if (
    !customerName ||
    !customerContact ||
    !productName ||
    !METHODS.includes(method) ||
    !Number.isFinite(totalPieces) ||
    totalPieces <= 0 ||
    !ARTWORK_SOURCES.includes(artworkSource) ||
    !rightsConfirmed
  ) {
    return NextResponse.json({ error: "Please complete the required inquiry details." }, { status: 400 });
  }

  if (artworkSource === "canva" && !/^https?:\/\/(www\.)?canva\.com\/.+/i.test(canvaLink)) {
    return NextResponse.json({ error: "Please enter a valid canva.com link." }, { status: 400 });
  }

  if (artworkSource === "upload" && !artworkName) {
    return NextResponse.json({ error: "Please choose an artwork file or another artwork option." }, { status: 400 });
  }

  const sizeSummary = sizeRunSummary(body.sizeRun);
  const quantitySummary = sizeSummary ? `${pieceLabel(totalPieces)} (${sizeSummary})` : pieceLabel(totalPieces);
  const createdAt = new Date().toISOString();

  try {
    const reference = await createUniqueReference();
    const supabase = getSupabaseAdminClient();

    const message = [
      `Product ID: ${productId || "not provided"}`,
      `Product: ${productName}`,
      `Method: ${method}`,
      `Method MOQ: ${Number.isFinite(methodMoq) ? methodMoq : "not provided"}`,
      `Total quantity: ${totalPieces}`,
      `Size run: ${sizeSummary || "Not applicable"}`,
      `Artwork source: ${artworkSource}`,
      `Canva link: ${canvaLink || "none"}`,
      `Uploaded filename: ${artworkName || "none"}`,
      `Artwork rights confirmed: ${rightsConfirmed ? "yes" : "no"}`,
      `Notes: ${notes || "none"}`,
      `Customer-side submitted at: ${customerSubmittedAt || "not provided"}`,
    ].join("\n");

    const { error } = await supabase.from("ops_inquiries").insert({
      id: reference,
      customer_name: customerName,
      contact: customerContact,
      source: "Portal",
      message,
      product: `${productName} - ${method}`,
      quantity: quantitySummary,
      priority: "normal",
      status: "new",
      next_action: "Review inquiry",
      due_date: neededDate || null,
      created_at: createdAt,
      updated_at: createdAt,
    });

    if (error) {
      return NextResponse.json({ error: "Unable to submit inquiry right now. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      reference,
      status: "FOR REVIEW",
      createdAt,
    });
  } catch (error) {
    const message = error instanceof Error && error.message === "Supabase server environment is not configured."
      ? "Inquiry service is not configured."
      : "Unable to submit inquiry right now. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
