import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "../../../lib/supabaseServer";

const BUCKET = "inquiry-artworks";
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "pdf", "svg", "ai", "eps", "psd"]);

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanContact(value: string) {
  return value.trim().toLowerCase();
}

function getExtension(filename: string) {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

function sanitizeFilename(filename: string) {
  const normalized = filename.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const sanitized = normalized.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  return sanitized || "artwork-file";
}

function safeError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return safeError("Invalid artwork upload request.");
  }

  const reference = text(formData.get("reference"));
  const contact = text(formData.get("contact"));
  const fileValue = formData.get("file");

  if (!reference || !contact || !(fileValue instanceof File)) {
    return safeError("Reference, contact, and artwork file are required.");
  }

  if (fileValue.size <= 0) {
    return safeError("Artwork file is empty. Please choose another file.");
  }

  if (fileValue.size > MAX_FILE_SIZE) {
    return safeError("Artwork file is too large. Please upload a file up to 15 MB.");
  }

  const sanitizedFilename = sanitizeFilename(fileValue.name);
  const extension = getExtension(sanitizedFilename);

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return safeError("Unsupported artwork format. Upload PNG, JPG, PDF, SVG, AI, EPS, or PSD.");
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: inquiry, error: inquiryError } = await supabase
      .from("ops_inquiries")
      .select("id, contact")
      .eq("id", reference)
      .maybeSingle();

    if (inquiryError) {
      return safeError("Unable to verify inquiry right now. Please try again.", 500);
    }

    if (!inquiry || cleanContact(String(inquiry.contact || "")) !== cleanContact(contact)) {
      return safeError("Inquiry not found for this reference and contact.", 404);
    }

    const storagePath = `${reference}/${crypto.randomUUID()}-${sanitizedFilename}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileValue, {
        cacheControl: "3600",
        contentType: fileValue.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return safeError("Artwork upload failed. Please try again.", 500);
    }

    return NextResponse.json({
      storagePath,
      originalFilename: fileValue.name,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error && error.message === "Supabase server environment is not configured."
      ? "Artwork upload service is not configured."
      : "Artwork upload failed. Please try again.";

    return safeError(message, 500);
  }
}