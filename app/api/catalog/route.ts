import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "../../../lib/supabaseServer";

const CUSTOMER_SAFE_COLUMNS = [
  "id",
  "name",
  "slug",
  "category",
  "description",
  "image_url",
  "starting_price",
  "price_label",
  "minimum_quantity",
  "available_sizes",
  "available_colors",
  "print_methods",
  "sort_order",
  "is_featured",
].join(", ");

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("catalog_products")
      .select(CUSTOMER_SAFE_COLUMNS)
      .eq("catalog_key", "trry_webapp")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Catalog is unavailable right now." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, products: data ?? [] });
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message === "Supabase server environment is not configured."
        ? "Catalog service is not configured."
        : "Catalog is unavailable right now.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
