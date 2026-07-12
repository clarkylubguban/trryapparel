"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

type Screen = "home" | "catalog" | "customize" | "submitted" | "myInquiries";
type Method = string;
type SizeKey = string;
type UploadStatus = "idle" | "ready" | "error";
type ArtworkSource = "upload" | "canva" | "send-later";
type ArtworkUploadStatus = "not-needed" | "uploaded" | "failed";
type FulfillmentMethod = "pickup" | "delivery";
type TrackingSubstatus = "ready_for_pickup" | "out_for_delivery" | "delivered" | "completed";
type InquiryStatus = "FOR REVIEW" | "NEEDS QUOTE" | "PROOF APPROVAL" | "IN PRODUCTION" | "PICKUP OR DELIVERY" | "DELIVERED" | "INQUIRY CLOSED / LOST" | "STATUS UPDATE" | "STATUS ERROR";

type SizeRun = Record<SizeKey, number>;

type DatePickerBlank = { key: string };
type DatePickerDay = { key: string; date: Date; day: number; isPast: boolean; isToday: boolean; isSelected: boolean };
type DatePickerCell = DatePickerBlank | DatePickerDay;
type Product = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  priceLabel?: string;
  icon: string;
  tags: Method[];
  availableSizes: SizeKey[];
  availableColors: ColorOption[];
  moq: {
    minimum: number;
    note: string;
  };
  referenceRequired?: boolean;
  sizing: "sized" | "quantity-only";
  imageUrl?: string;
};

type ColorOption = {
  name: string;
  value: string;
};

type CatalogProductRow = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  image_url: string | null;
  starting_price: string | number | null;
  price_label: string | null;
  minimum_quantity: number | null;
  available_sizes: unknown;
  available_colors: unknown;
  print_methods: unknown;
  sort_order: number | null;
  is_featured: boolean | null;
};

type Inquiry = {
  ref: string;
  createdAt: string;
  productId: string;
  productName: string;
  basePrice: number;
  method: Method;
  methodMoq: number;
  color: string;
  sizeRun: SizeRun;
  totalPieces: number;
  canvaLink: string;
  artworkName: string;
  artworkSource: ArtworkSource;
  artworkStoragePath: string;
  artworkUploadStatus: ArtworkUploadStatus;
  artworkUploadedAt: string;
  previousReference: string;
  neededDate: string;
  fulfillmentMethod: FulfillmentMethod | "";
  deliveryCity: string;
  deliveryAddress: string;
  deliveryLandmark: string;
  trackingSubstatus: TrackingSubstatus | "";
  trackingNote: string;
  trackingUpdatedAt: string;
  notes: string;
  customerName: string;
  customerContact: string;
  contact?: string;
  rightsConfirmed: boolean;
  status: InquiryStatus;
  statusKey: string;
  statusLabel: InquiryStatus;
};
type TrackedInquiry = {
  id: string;
  product: string;
  quantity: string;
  submittedAt: string;
  artworkLabel: string
  statusKey: string;
  statusLabel: InquiryStatus;
  fulfillmentMethod?: FulfillmentMethod | "";
  deliveryCity?: string;
  deliveryAddress?: string;
  deliveryLandmark?: string;
  trackingSubstatus?: TrackingSubstatus | "";
  trackingNote?: string;
  trackingUpdatedAt?: string;
};
type InquiryDraft = {
  version: 1;
  updatedAt: string;
  productId: string;
  color: string;
  method: Method;
  sizeRun: SizeRun;
  quantityOnly: number;
  canvaLink: string;
  artworkName: string;
  artworkLater: boolean;
  previousReference: string;
  neededDate: string;
  fulfillmentMethod: FulfillmentMethod | "";
  deliveryCity: string;
  deliveryAddress: string;
  deliveryLandmark: string;
  notes: string;
  customerName: string;
  customerContact: string;
  rightsConfirmed: boolean;
};

const FALLBACK_PRODUCTS: Product[] = [
  { id: "premium-cotton-shirt", name: "Premium Cotton Shirt", description: "Soft daily shirt for prints and slogans.", basePrice: 280, icon: "PS", tags: ["DTF Transfer", "Screen Print"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], availableColors: [], sizing: "sized", moq: { minimum: 1, note: "Minimum order: 1 piece." } },
  { id: "caps", name: "Caps", description: "Logo caps for crews and teams.", basePrice: 180, icon: "CP", tags: ["Embroidery"], availableSizes: [], availableColors: [], sizing: "quantity-only", moq: { minimum: 12, note: "Minimum order: 12 pieces." }, referenceRequired: true },
  { id: "boxy-crop-shirt", name: "Boxy Crop Shirt", description: "Boxy fit merch shirt.", basePrice: 300, icon: "BS", tags: ["DTF Transfer"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], availableColors: [], sizing: "sized", moq: { minimum: 1, note: "Minimum order: 1 piece." } },
  { id: "polo-uniform", name: "Polo Uniform", description: "Business polo with logo placement.", basePrice: 350, icon: "PU", tags: ["Embroidery", "DTF Transfer"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], availableColors: [], sizing: "sized", moq: { minimum: 12, note: "Minimum order: 12 pieces." }, referenceRequired: true },
  { id: "tote-bag", name: "Tote Bag", description: "Reusable merch and event bag.", basePrice: 220, icon: "TB", tags: ["DTF Transfer", "Screen Print"], availableSizes: [], availableColors: [], sizing: "quantity-only", moq: { minimum: 1, note: "Minimum order: 1 piece." } },
  { id: "towels", name: "Towels", description: "Premium giveaway or team towels.", basePrice: 200, icon: "TW", tags: ["Embroidery"], availableSizes: [], availableColors: [], sizing: "quantity-only", moq: { minimum: 12, note: "Minimum order: 12 pieces." }, referenceRequired: true },
];

const METHOD_MOQ: Record<string, number> = {
  "DTF Transfer": 1,
  Embroidery: 1,
  "Screen Print": 30,
};
const TRACKED_METHODS = Object.keys(METHOD_MOQ) as Method[];

const COLORS: ColorOption[] = [
  { name: "Black", value: "#111111" },
  { name: "White", value: "#fffdf8" },
  { name: "Sand", value: "#dfd0b5" },
  { name: "Olive", value: "#596042" },
  { name: "Maroon", value: "#64171d" },
  { name: "Navy", value: "#0c1d39" },
];

const SIZE_ORDER: SizeKey[] = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL"];
const DEFAULT_VISIBLE_SIZES = new Set<SizeKey>(["S", "M", "L", "XL"]);
const EMPTY_SIZE_RUN: SizeRun = {};
const ARTWORK_EXTENSIONS = new Set(["png", "jpg", "jpeg", "pdf", "svg", "ai", "eps", "psd"]);
const MAX_ARTWORK_SIZE = 15 * 1024 * 1024;

function sortCatalogSizes(sizes: SizeKey[]) {
  return [...sizes].sort((left, right) => {
    const leftIndex = SIZE_ORDER.indexOf(left);
    const rightIndex = SIZE_ORDER.indexOf(right);

    if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
    if (leftIndex >= 0) return -1;
    if (rightIndex >= 0) return 1;

    return sizes.indexOf(left) - sizes.indexOf(right);
  });
}

function createSizeRunForProduct(product: Product): SizeRun {
  const nextSizeRun: SizeRun = {};
  product.availableSizes.forEach((size) => {
    nextSizeRun[size] = 0;
  });
  return nextSizeRun;
}
const STORAGE_KEY = "trry_inquiries_v3";
const DRAFT_STORAGE_KEY = "trry_customize_draft_v1";
const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const DRAFT_SAVE_DELAY_MS = 500;

const MESSENGER_LINK = "https://m.me/trryapparel";
const TRACKER_STEPS = ["INQUIRY RECEIVED", "QUOTE AND REVIEW", "PROOF APPROVAL", "PRODUCTION", "PICKUP OR DELIVERY"];
const ALLOW_CATALOG_FALLBACK = process.env.NODE_ENV === "development";

function formatMoney(value: number) {
  return "\u20b1" + value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCustomerDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12);
}

function formatRequestedDate(value: string) {
  const date = parseDateKey(value);
  if (!date) return "Select requested date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function addCalendarMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function isDatePickerDay(item: DatePickerCell): item is DatePickerDay {
  return "day" in item;
}

function getPriceDisplay(product: Product) {
  const label = product.priceLabel?.trim();
  if (label && !/^\d+(\.\d+)?$/.test(label)) return label;
  return `STARTS AT ${formatMoney(product.basePrice)}`;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
  return initials || "TR";
}

function normalizeMethod(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  const key = normalized.toUpperCase().replace(/[_-]+/g, " ");

  if (key === "DTF") return "DTF Transfer";
  if (key === "EMBROIDERY") return "Embroidery";
  if (key === "SCREEN PRINT" || key === "SCREENPRINT" || key === "SCREEN PRINTING" || key === "SCREENPRINTING") return "Screen Print";
  if (key === "DTF TRANSFER") return "DTF Transfer";

  if (process.env.NODE_ENV === "development") {
    console.warn(`Unknown catalog print method: ${value}`);
  }

  return normalized;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];
}

function normalizeSizes(value: unknown) {
  const seen = new Set<string>();
  const sizes = toStringArray(value)
    .map((item) => item.toUpperCase())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });

  return sortCatalogSizes(sizes);
}

function normalizeColors(value: unknown) {
  const swatchByName = new Map(COLORS.map((item) => [item.name.toLowerCase(), item]));
  return toStringArray(value)
    .map((item) => swatchByName.get(item.toLowerCase()) || { name: item, value: item })
    .filter((item) => item.name);
}

function normalizeCatalogProducts(rows: CatalogProductRow[]) {
  return rows.flatMap((row): Product[] => {
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const slug = typeof row.slug === "string" ? row.slug.trim() : "";
    if (!name || !slug) return [];

    const availableSizes = normalizeSizes(row.available_sizes);
    const printMethods = toStringArray(row.print_methods).map(normalizeMethod);
    const minimumQuantity = Math.max(1, Number(row.minimum_quantity) || 1);
    const startingPrice = Number(row.starting_price);

    return [{
      id: slug,
      name,
      description: typeof row.description === "string" ? row.description : "",
      basePrice: Number.isFinite(startingPrice) ? startingPrice : 0,
      priceLabel: typeof row.price_label === "string" ? row.price_label : "",
      icon: getInitials(name),
      tags: printMethods.length ? printMethods : ["DTF Transfer"],
      availableSizes,
      availableColors: normalizeColors(row.available_colors),
      moq: {
        minimum: minimumQuantity,
        note: `Minimum order: ${minimumQuantity} ${minimumQuantity === 1 ? "piece" : "pieces"}.`,
      },
      referenceRequired: printMethods.some((item) => item === "Embroidery"),
      sizing: availableSizes.length ? "sized" : "quantity-only",
      imageUrl: typeof row.image_url === "string" ? row.image_url.trim() : "",
    }];
  });
}
function makeRef(existing: Inquiry[] = []) {
  const usedRefs = new Set(existing.map((item) => item.ref.toLowerCase()));
  let candidate = "";
  do {
    candidate = `TRRY-${Math.floor(1000 + Math.random() * 9000)}`;
  } while (usedRefs.has(candidate.toLowerCase()));
  return candidate;
}

function parseTotalPiecesFromQuantity(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function formatPieceCount(totalPieces: number) {
  return `${totalPieces} ${totalPieces === 1 ? "pc" : "pcs"}`;
}

function normalizeQuantityDisplay(value: string) {
  return value.replace(/^1\s+pcs\b/i, "1 pc");
}

function getMethodFromTrackedProduct(product: string): Method {
  return TRACKED_METHODS.find((item) => product.toLowerCase().includes(item.toLowerCase())) || "DTF Transfer";
}

function getProductNameFromTrackedProduct(product: string, method: Method) {
  const suffix = ` - ${method}`;
  return product.toLowerCase().endsWith(suffix.toLowerCase()) ? product.slice(0, -suffix.length).trim() : product;
}

function cleanPhone(value: string) {
  return value.trim().toLowerCase();
}

function normalizeContactText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validateCustomerName(value: string) {
  return value.trim().length >= 2 ? "" : "Enter your full name with at least 2 characters.";
}

const unusableContactValues = new Set(["none", "n/a", "na", "test", "testing", "null", "nil"]);

function validateCustomerContact(value: string) {
  const trimmed = normalizeContactText(value);
  const lowered = trimmed.toLowerCase();
  const compactLowered = lowered.replace(/[\s._-]+/g, "");

  if (!trimmed) return "Enter a phone number or Messenger contact.";
  if (unusableContactValues.has(lowered) || unusableContactValues.has(compactLowered)) {
    return "Enter a usable phone number or Messenger contact.";
  }

  const phoneNormalized = trimmed.replace(/[\s-]/g, "");
  const validPhilippineMobile = /^(09\d{9}|\+639\d{9}|639\d{9})$/.test(phoneNormalized);
  if (validPhilippineMobile) return "";

  const hasLetters = /[a-z]/i.test(trimmed);
  const phonePrefixAttempt = /^(09|\+?63)/.test(phoneNormalized);
  const phoneLike = /^[+\d][\d\s-]*$/.test(trimmed) || phonePrefixAttempt;

  if (phonePrefixAttempt && hasLetters) return "Phone numbers cannot include letters.";
  if (phoneLike) return "Enter a valid Philippine mobile number or Messenger contact.";

  const validProfileUrl = /^(https?:\/\/)?(www\.)?(facebook\.com|m\.me|messenger\.com)\/[a-z0-9._-]+\/?$/i.test(trimmed);
  const messengerNote = /^messenger:\s*(?=.*[a-z0-9])[a-z0-9][a-z0-9 ._'-]{1,}$/i.test(trimmed);
  const taggedUsername = /^@[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$/i.test(trimmed);
  const separatedUsername = /^(?=.*[._])[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])$/i.test(trimmed);

  if (validProfileUrl || messengerNote || taggedUsername || separatedUsername) return "";

  return "Enter a valid PH mobile number, Messenger: contact, @username, profile link, or username with . or _.";
}

function getFileExtension(filename: string) {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

function getArtworkStateLabel(inquiry: Inquiry | null | undefined) {
  if (!inquiry) return "Artwork will be sent later";
  if (inquiry.artworkSource === "canva") return "Canva link submitted";
  if (inquiry.artworkSource === "send-later") return "Artwork will be sent later";
  if (inquiry.artworkUploadStatus === "failed") return "Artwork upload needs retry";
  return "Artwork uploaded";
}

function getFulfillmentMethod(value: unknown): FulfillmentMethod | "" {
  return value === "pickup" || value === "delivery" ? value : "";
}

function getFulfillmentLabel(method: FulfillmentMethod | "") {
  if (method === "pickup") return "Pickup";
  if (method === "delivery") return "Delivery";
  return "Not selected";
}

function getDeliverySummary(city: string, address: string, landmark: string) {
  const parts = [address.trim(), city.trim(), landmark.trim() ? `Landmark: ${landmark.trim()}` : ""].filter(Boolean);
  return parts.join(" / ");
}

function getTrackingSubstatus(value: unknown): TrackingSubstatus | "" {
  return value === "ready_for_pickup" || value === "out_for_delivery" || value === "delivered" || value === "completed" ? value : "";
}

function normalizeTrackingSubstatus(value: unknown): TrackingSubstatus | "" {
  return getTrackingSubstatus(value);
}

function getTrackingSubstatusDetail(substatus: TrackingSubstatus | "", _fulfillmentMethod: FulfillmentMethod | "") {
  if (substatus === "ready_for_pickup") {
    return { title: "READY FOR PICKUP", message: "Your order is ready for pickup at TRRY Apparel, Iligan City." };
  }
  if (substatus === "out_for_delivery") {
    return { title: "OUT FOR DELIVERY", message: "Your order has been released for delivery." };
  }
  if (substatus === "delivered") {
    return { title: "DELIVERED", message: "Your order has been delivered successfully." };
  }
  if (substatus === "completed") {
    return { title: "COMPLETED", message: "Your order has been completed." };
  }
  return null;
}

function getTrackingSubstatusLabel(substatus: TrackingSubstatus | "", fulfillmentMethod: FulfillmentMethod | "") {
  return getTrackingSubstatusDetail(substatus, fulfillmentMethod)?.title || "";
}

function getCustomerFacingStatusLabel(statusLabel: unknown, trackingSubstatus: unknown) {
  const substatus = normalizeTrackingSubstatus(trackingSubstatus);

  if (substatus === "ready_for_pickup") return "READY FOR PICKUP";
  if (substatus === "out_for_delivery") return "OUT FOR DELIVERY";
  if (substatus === "delivered") return "DELIVERED";
  if (substatus === "completed") return "COMPLETED";

  return typeof statusLabel === "string" && statusLabel.trim() ? statusLabel : "STATUS UPDATE";
}
function getArtworkUploadStatus(item: Record<string, unknown>, source: ArtworkSource): ArtworkUploadStatus {
  if (item.artworkUploadStatus === "uploaded" || item.artworkUploadStatus === "failed" || item.artworkUploadStatus === "not-needed") return item.artworkUploadStatus;
  if (source !== "upload") return "not-needed";
  return "uploaded";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeTrackerStatus(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeStatus(value: unknown): InquiryStatus {
  const status = normalizeTrackerStatus(value);

  if (["new", "inquiry received", "for review", "for_review"].includes(status)) return "FOR REVIEW";
  if (["quote", "needs quote", "sent", "quote sent", "followup", "follow up"].includes(status)) return "NEEDS QUOTE";
  if (["won", "odoo created", "approved", "proof approval", "proof approved"].includes(status)) return "PROOF APPROVAL";
  if (["production", "in production"].includes(status)) return "IN PRODUCTION";
  if (["ready", "ready for pickup", "pickup", "delivery", "pickup or delivery"].includes(status)) return "PICKUP OR DELIVERY";
  if (["delivered", "completed"].includes(status)) return "DELIVERED";
  if (["lost", "cancelled", "canceled", "inquiry closed / lost"].includes(status)) return "INQUIRY CLOSED / LOST";
  return "STATUS UPDATE";
}

function getInquiryProgress(statusKey: unknown, trackingSubstatus?: unknown) {
  if (getTrackingSubstatus(trackingSubstatus)) {
    return { step: 5, label: "PICKUP OR DELIVERY", progress: 100, closed: false };
  }

  const status = normalizeTrackerStatus(statusKey);

  if (["lost", "cancelled", "canceled"].includes(status)) {
    return { step: 0, label: "INQUIRY CLOSED / LOST", progress: 0, closed: true };
  }

  if (["quote", "needs quote", "sent", "quote sent", "followup", "follow up"].includes(status)) {
    return { step: 2, label: "QUOTE AND REVIEW", progress: 40, closed: false };
  }

  if (["won", "odoo created", "approved", "proof approval", "proof approved"].includes(status)) {
    return { step: 3, label: "PROOF APPROVAL", progress: 60, closed: false };
  }

  if (["production", "in production"].includes(status)) {
    return { step: 4, label: "PRODUCTION", progress: 80, closed: false };
  }

  if (["ready", "ready for pickup", "pickup", "delivery", "delivered", "completed"].includes(status)) {
    return { step: 5, label: "PICKUP OR DELIVERY", progress: 100, closed: false };
  }

  return { step: 1, label: "INQUIRY RECEIVED", progress: 20, closed: false };
}

function getTrackerContext(statusKey: unknown, trackingSubstatus?: unknown) {
  const progress = getInquiryProgress(statusKey, trackingSubstatus);
  if (progress.closed) return "This inquiry is closed. Message TRRY with your reference if you need help.";
  if (progress.step === 2) return "TRRY is preparing or reviewing your quotation.";
  if (progress.step === 3) return "Your order has moved to proof preparation and approval.";
  if (progress.step === 4) return "Your approved order is in production.";
  if (progress.step === 5) return "Your inquiry is ready for pickup, delivery, or completion follow-up.";
  return "TRRY is checking your request details.";
}

function getNextActionLabel(statusKey: unknown, trackingSubstatus?: unknown) {
  if (getTrackingSubstatus(trackingSubstatus)) return "PICKUP OR DELIVERY";

  const status = normalizeTrackerStatus(statusKey);

  if (["lost", "cancelled", "canceled"].includes(status)) return "INQUIRY CLOSED";
  if (["ready", "ready for pickup", "pickup", "delivery", "delivered", "completed"].includes(status)) return "PICKUP OR DELIVERY";
  if (["production", "in production"].includes(status)) return "PRODUCTION IN PROGRESS";
  if (["won", "odoo created", "approved", "proof approval", "proof approved"].includes(status)) return "PROOF PREPARATION AND APPROVAL";
  if (["sent", "quote sent", "followup", "follow up"].includes(status)) return "REVIEW OR REPLY TO YOUR QUOTE";
  if (["quote", "needs quote"].includes(status)) return "TRRY PREPARES YOUR QUOTE";
  return "TRRY REVIEWS YOUR DETAILS";
}
function getArtworkSource(item: Record<string, unknown>): ArtworkSource {
  if (item.artworkSource === "upload" || item.artworkSource === "canva" || item.artworkSource === "send-later") return item.artworkSource;
  if (typeof item.canvaLink === "string" && item.canvaLink.trim()) return "canva";
  if (typeof item.artworkName === "string" && item.artworkName.trim()) return item.artworkName === "Send artwork later" ? "send-later" : "upload";
  return "send-later";
}

function getStoredInquiries(): Inquiry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isRecord).flatMap((item) => {
      const ref = typeof item.ref === "string" ? item.ref : typeof item.reference === "string" ? item.reference : "";
      const productName = typeof item.productName === "string" ? item.productName : "";
      const totalPieces = typeof item.totalPieces === "number" ? item.totalPieces : typeof item.totalQuantity === "number" ? item.totalQuantity : NaN;
      if (!ref || !productName || !Number.isFinite(totalPieces) || typeof item.status !== "string") return [];

      const method: Method = item.method === "Embroidery" || item.method === "Screen Print" || item.method === "DTF Transfer" ? item.method : "DTF Transfer";
      const artworkSource = getArtworkSource(item);

      return [{
        ref,
        createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
        productId: typeof item.productId === "string" ? item.productId : "legacy-product",
        productName,
        basePrice: typeof item.basePrice === "number" ? item.basePrice : 0,
        method,
        methodMoq: typeof item.methodMoq === "number" ? item.methodMoq : METHOD_MOQ[method],
        color: typeof item.color === "string" ? item.color : "",
        sizeRun: isRecord(item.sizeRun) ? item.sizeRun as SizeRun : { ...EMPTY_SIZE_RUN },
        totalPieces,
        canvaLink: typeof item.canvaLink === "string" ? item.canvaLink : "",
        artworkName: typeof item.artworkName === "string" ? item.artworkName : "",
        artworkSource,
        artworkStoragePath: typeof item.artworkStoragePath === "string" ? item.artworkStoragePath : "",
        artworkUploadStatus: getArtworkUploadStatus(item, artworkSource),
        artworkUploadedAt: typeof item.artworkUploadedAt === "string" ? item.artworkUploadedAt : "",
        previousReference: typeof item.previousReference === "string" ? item.previousReference : "",
        neededDate: typeof item.neededDate === "string" ? item.neededDate : "",
        fulfillmentMethod: getFulfillmentMethod(item.fulfillmentMethod),
        deliveryCity: typeof item.deliveryCity === "string" ? item.deliveryCity : "",
        deliveryAddress: typeof item.deliveryAddress === "string" ? item.deliveryAddress : "",
        deliveryLandmark: typeof item.deliveryLandmark === "string" ? item.deliveryLandmark : "",
        trackingSubstatus: getTrackingSubstatus(item.trackingSubstatus || item.tracking_substatus),
        trackingNote: typeof item.trackingNote === "string" ? item.trackingNote : typeof item.tracking_note === "string" ? item.tracking_note : "",
        trackingUpdatedAt: typeof item.trackingUpdatedAt === "string" ? item.trackingUpdatedAt : typeof item.tracking_updated_at === "string" ? item.tracking_updated_at : "",
        notes: typeof item.notes === "string" ? item.notes : "",
        customerName: typeof item.customerName === "string" ? item.customerName : "",
        customerContact: typeof item.customerContact === "string" ? item.customerContact : typeof item.contact === "string" ? item.contact : "",
        contact: typeof item.contact === "string" ? item.contact : typeof item.customerContact === "string" ? item.customerContact : "",
        rightsConfirmed: item.rightsConfirmed === true,
        status: normalizeStatus(item.status),
        statusKey: typeof item.statusKey === "string" ? item.statusKey : "legacy",
        statusLabel: typeof item.statusLabel === "string" ? normalizeStatus(item.statusLabel) : normalizeStatus(item.status),
      }];
    });
  } catch {
    return [];
  }
}

function saveStoredInquiries(items: Inquiry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function getStoredDraft(): InquiryDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(DRAFT_STORAGE_KEY) || "null"
    );

    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      typeof parsed.updatedAt !== "string" ||
      typeof parsed.productId !== "string"
    ) {
      return null;
    }

    const updatedAt = Date.parse(parsed.updatedAt);

    if (
      !Number.isFinite(updatedAt) ||
      Date.now() - updatedAt > DRAFT_EXPIRY_MS
    ) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }

    const method: Method = typeof parsed.method === "string" && parsed.method.trim()
      ? parsed.method
      : "DTF Transfer";

    const draftSizeRun = { ...EMPTY_SIZE_RUN };

    if (isRecord(parsed.sizeRun)) {
      Object.entries(parsed.sizeRun).forEach(([size, value]) => {
        if (!size) return;
        draftSizeRun[size.toUpperCase()] =
          typeof value === "number" && Number.isFinite(value)
            ? Math.max(0, Math.floor(value))
            : 0;
      });
    }

    return {
      version: 1,
      updatedAt: parsed.updatedAt,
      productId: parsed.productId,
      color: typeof parsed.color === "string" ? parsed.color : "Sand",
      method,
      sizeRun: draftSizeRun,
      quantityOnly:
        typeof parsed.quantityOnly === "number" &&
        Number.isFinite(parsed.quantityOnly)
          ? Math.max(0, Math.floor(parsed.quantityOnly))
          : 0,
      canvaLink:
        typeof parsed.canvaLink === "string" ? parsed.canvaLink : "",
      artworkName:
        typeof parsed.artworkName === "string" ? parsed.artworkName : "",
      artworkLater: parsed.artworkLater === true,
      previousReference:
        typeof parsed.previousReference === "string"
          ? parsed.previousReference
          : "",
      neededDate:
        typeof parsed.neededDate === "string" ? parsed.neededDate : "",
      fulfillmentMethod: getFulfillmentMethod(parsed.fulfillmentMethod),
      deliveryCity: typeof parsed.deliveryCity === "string" ? parsed.deliveryCity : "",
      deliveryAddress: typeof parsed.deliveryAddress === "string" ? parsed.deliveryAddress : "",
      deliveryLandmark: typeof parsed.deliveryLandmark === "string" ? parsed.deliveryLandmark : "",
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      customerName:
        typeof parsed.customerName === "string" ? parsed.customerName : "",
      customerContact:
        typeof parsed.customerContact === "string"
          ? parsed.customerContact
          : "",
      rightsConfirmed: parsed.rightsConfirmed === true,
    };
  } catch {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    return null;
  }
}

function clearStoredDraft() {
  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
}
export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "error">("loading");
  const [catalogError, setCatalogError] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product>(FALLBACK_PRODUCTS[0]);
  const [color, setColor] = useState("Sand");
  const [method, setMethod] = useState<Method>(FALLBACK_PRODUCTS[0].tags[0]);
  const [sizeRun, setSizeRun] = useState<SizeRun>(EMPTY_SIZE_RUN);
  const [sizeExtrasOpen, setSizeExtrasOpen] = useState(false);
  const [quantityOnly, setQuantityOnly] = useState(0);
  const [emptySizeInputs, setEmptySizeInputs] = useState<SizeKey[]>([]);
  const [quantityOnlyInputEmpty, setQuantityOnlyInputEmpty] = useState(false);
  const [canvaLink, setCanvaLink] = useState("");
  const [artworkName, setArtworkName] = useState("");
  const [selectedArtworkFile, setSelectedArtworkFile] = useState<File | null>(null);
  const [artworkLater, setArtworkLater] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [previousReference, setPreviousReference] = useState("");
  const [neededDate, setNeededDate] = useState("");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod | "">("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerNameTouched, setCustomerNameTouched] = useState(false);
  const [customerContactTouched, setCustomerContactTouched] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<"idle" | "submitting" | "uploading">("idle");
  const [retryingArtwork, setRetryingArtwork] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<Inquiry | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [trackRef, setTrackRef] = useState("");
  const [trackContact, setTrackContact] = useState("");
  const [trackSearched, setTrackSearched] = useState(false);
  const [trackedInquiry, setTrackedInquiry] = useState<TrackedInquiry | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isSyncingInquiries, setIsSyncingInquiries] = useState(false);
  const [, setStoredDraft] = useState<InquiryDraft | null>(null);
  const [manilaTime, setManilaTime] = useState("--:--:--");

  const previousScreenRef = useRef<Screen>("home");
  const syncInquiriesInProgressRef = useRef(false);

  useEffect(() => {
    setInquiries(getStoredInquiries());
    setCustomerName(window.localStorage.getItem("customerName") || "");
    setCustomerContact(window.localStorage.getItem("customerContact") || "");
    setStoredDraft(getStoredDraft());
  }, []);
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const updateClock = () => setManilaTime(formatter.format(new Date()));

    updateClock();
    const timer = window.setInterval(updateClock, 1000);

    return () => window.clearInterval(timer);
  }, []);
  async function loadCatalog() {
    setCatalogStatus("loading");
    setCatalogError("");

    try {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as { ok?: boolean; products?: CatalogProductRow[]; error?: string };

      if (!response.ok || !data.ok || !Array.isArray(data.products)) {
        throw new Error(data.error || "Catalog is unavailable right now.");
      }

      const normalizedProducts = normalizeCatalogProducts(data.products);
      const draft = getStoredDraft();
      const draftProductExists = draft ? normalizedProducts.some((item) => item.id === draft.productId) : false;

      setProducts(normalizedProducts);
      setCatalogStatus("ready");
      setStoredDraft(draft && draftProductExists ? draft : null);
      if (draft && !draftProductExists) clearStoredDraft();
      setActiveProduct((current) => normalizedProducts.find((item) => item.id === current.id) || normalizedProducts[0] || current);
    } catch (error) {
      const fallbackProducts = ALLOW_CATALOG_FALLBACK ? FALLBACK_PRODUCTS : [];
      const draft = getStoredDraft();
      const draftProductExists = draft ? fallbackProducts.some((item) => item.id === draft.productId) : false;

      setProducts(fallbackProducts);
      setCatalogStatus("error");
      setCatalogError(error instanceof Error ? error.message : "Catalog is unavailable right now.");
      setStoredDraft(ALLOW_CATALOG_FALLBACK && draft && draftProductExists ? draft : null);
    }
  }

  useEffect(() => {
    void loadCatalog();
  }, []);


  useEffect(() => {
    const previousScreen = previousScreenRef.current;
    previousScreenRef.current = screen;

    if (screen === "myInquiries" && previousScreen !== "myInquiries") {
      void syncSavedInquiryStatuses();
    }
  }, [screen]);

  useEffect(() => {
    if (screen !== "customize" || isSubmitting) return;

    const draft: InquiryDraft = {
      version: 1,
      updatedAt: new Date().toISOString(),
      productId: activeProduct.id,
      color,
      method,
      sizeRun,
      quantityOnly,
      canvaLink,
      artworkName,
      artworkLater,
      previousReference,
      neededDate,
      fulfillmentMethod,
      deliveryCity,
      deliveryAddress,
      deliveryLandmark,
      notes,
      customerName,
      customerContact,
      rightsConfirmed,
    };

    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify(draft)
      );

      setStoredDraft(draft);
    }, DRAFT_SAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    screen,
    isSubmitting,
    activeProduct.id,
    color,
    method,
    sizeRun,
    quantityOnly,
    canvaLink,
    artworkName,
    artworkLater,
    previousReference,
    neededDate,
      fulfillmentMethod,
      deliveryCity,
      deliveryAddress,
      deliveryLandmark,
    notes,
    customerName,
    customerContact,
    rightsConfirmed,
  ]);
  const isQuantityOnlyProduct = activeProduct.sizing === "quantity-only";
  const activeColors = activeProduct.availableColors.length ? activeProduct.availableColors : COLORS;
  const headerColorChoices = useMemo(() => {
    const findColor = (name: string) => activeColors.find((item) => item.name.toLowerCase() === name.toLowerCase());
    const white = findColor("White") || { name: "White", value: "#fffdf8" };
    const black = findColor("Black") || { name: "Black", value: "#111111" };
    const suggested = activeColors.find((item) => !["white", "black"].includes(item.name.toLowerCase())) || { name: "Suggested Color", value: "#dfd0b5" };

    return [
      { key: "white", label: "White", colorName: white.name, value: white.value },
      { key: "black", label: "Black", colorName: black.name, value: black.value },
      { key: "other", label: "Other", colorName: suggested.name, value: suggested.value },
    ];
  }, [activeColors]);
  const selectedColorLabel = color === "White" || color === "Black" ? color : `Suggested: ${color}`;
  const sortedProductSizes = useMemo(() => sortCatalogSizes(activeProduct.availableSizes), [activeProduct.availableSizes]);
  const defaultSizeKeys = useMemo(() => sortedProductSizes.filter((size) => DEFAULT_VISIBLE_SIZES.has(size)), [sortedProductSizes]);
  const extraSizeKeys = useMemo(() => sortedProductSizes.filter((size) => !DEFAULT_VISIBLE_SIZES.has(size)), [sortedProductSizes]);
  const extraSizePieces = useMemo(() => extraSizeKeys.reduce((sum, size) => sum + (sizeRun[size] ?? 0), 0), [extraSizeKeys, sizeRun]);
  const showExtraSizes = sizeExtrasOpen || extraSizePieces > 0;
  const extraSizeToggleLabel = extraSizePieces > 0 ? "EXTRA SIZES - " + formatPieceCount(extraSizePieces).toUpperCase() : (showExtraSizes ? "- HIDE EXTRA SIZES" : "+ MORE SIZES: " + extraSizeKeys.join(", "));
  const totalPieces = useMemo(() => isQuantityOnlyProduct ? quantityOnly : sortedProductSizes.reduce((sum, size) => sum + (sizeRun[size] ?? 0), 0), [isQuantityOnlyProduct, quantityOnly, sizeRun, sortedProductSizes]);
  const canvaValid = !canvaLink.trim() || /^https?:\/\/(www\.)?canva\.com\/.+/i.test(canvaLink.trim());
  const requiredMoq = METHOD_MOQ[method] ?? activeProduct.moq.minimum;
  const remainingPieces = requiredMoq > totalPieces ? requiredMoq - totalPieces : 0;
  const moqNote = remainingPieces > 0 ? method + " requires at least " + requiredMoq + " " + (requiredMoq === 1 ? "piece" : "pieces") + ". Add " + remainingPieces + " more." : method + " minimum met.";

  const moqMet = totalPieces >= requiredMoq;
  const hasArtworkPlan = Boolean(artworkName || canvaLink.trim() || artworkLater);
  const customerNameError = validateCustomerName(customerName);
  const customerContactError = validateCustomerContact(customerContact);
  const deliveryCityRequired = fulfillmentMethod === "delivery" && !deliveryCity.trim();
  const deliveryAddressRequired = fulfillmentMethod === "delivery" && !deliveryAddress.trim();
  const fulfillmentComplete = fulfillmentMethod === "pickup" || (fulfillmentMethod === "delivery" && !deliveryCityRequired && !deliveryAddressRequired);
  const fulfillmentReview = fulfillmentMethod === "delivery" ? "Delivery / " + (getDeliverySummary(deliveryCity, deliveryAddress, deliveryLandmark) || "Address needed") : fulfillmentMethod === "pickup" ? "Pickup at TRRY Apparel, Iligan City" : "Not selected";
  const canSubmit = totalPieces > 0 && moqMet && canvaValid && hasArtworkPlan && fulfillmentComplete && !customerNameError && !customerContactError && rightsConfirmed && !isSubmitting;
  const submitButtonText = isSubmitting ? (submitStage === "uploading" ? "UPLOADING ARTWORK" : "SUBMITTING") : "SUBMIT INQUIRY";
  const messengerLink = MESSENGER_LINK + "?text=" + encodeURIComponent("Hi TRRY, I want to ask about inquiry " + (submittedInquiry?.ref || trackRef || "") + ".");
  const catalogCountLabel = `${products.length} ${products.length === 1 ? "product" : "products"}`;
  const selectedArtworkSummary = artworkName ? "Upload: " + artworkName : canvaLink.trim() ? "Canva link" : artworkLater ? "Send later" : "Not set";
  const selectedArtworkStatus = artworkName ? "FILE ATTACHED" : canvaLink.trim() ? "CANVA LINK" : artworkLater ? "SEND LATER" : "NOT SET";
  const attachedArtworkMeta = selectedArtworkFile ? (selectedArtworkFile.type || getFileExtension(selectedArtworkFile.name).toUpperCase()) + " / " + Math.max(1, Math.round(selectedArtworkFile.size / 1024)) + " KB" : "Ready for review";
  const reviewContact = customerName.trim() || customerContact.trim() ? (customerName.trim() || "Name needed") + " / " + (customerContact.trim() || "Contact needed") : "Contact needed";
  const todayKey = toDateKey(new Date());
  const selectedDateLabel = formatRequestedDate(neededDate);
  const datePickerMonthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(datePickerMonth);
  const datePickerDays = useMemo(() => {
    const start = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), 1, 12);
    const daysInMonth = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() + 1, 0).getDate();
    const blanks: DatePickerBlank[] = Array.from({ length: start.getDay() }, (_, index) => ({ key: `blank-${index}` }));
    const days: DatePickerDay[] = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), index + 1, 12);
      const key = toDateKey(date);
      return { key, date, day: index + 1, isPast: key < todayKey, isToday: key === todayKey, isSelected: key === neededDate };
    });
    return [...blanks, ...days];
  }, [datePickerMonth, neededDate, todayKey]);

  function resetFormForProduct(product: Product) {
    setActiveProduct(product);
    setColor((product.availableColors.length ? product.availableColors : COLORS)[0]?.name || "Sand");
    setMethod(product.tags[0]);
    setSizeRun(createSizeRunForProduct(product));
    setSizeExtrasOpen(false);
    setQuantityOnly(0);
    setEmptySizeInputs([]);
    setQuantityOnlyInputEmpty(false);
    setCanvaLink("");
    setArtworkName("");
    setSelectedArtworkFile(null);
    setUploadStatus("idle");
    setUploadMessage("");
    setArtworkLater(false);
    setPreviousReference("");
    setNeededDate("");
    setFulfillmentMethod("");
    setDeliveryCity("");
    setDeliveryAddress("");
    setDeliveryLandmark("");
    setDatePickerOpen(false);
    setNotes("");
    setRightsConfirmed(false);
    setCustomerNameTouched(false);
    setCustomerContactTouched(false);
    setFormError("");
    setIsSubmitting(false);
    setSubmitStage("idle");
    }
function openCatalog() {
  setScreen("catalog");
}

  function openProduct(product: Product) {
    resetFormForProduct(product);
    setScreen("customize");
  }

  function updateSize(size: SizeKey, delta: number) {
    setSizeRun((current) => ({ ...current, [size]: Math.max(0, (current[size] ?? 0) + delta) }));
    setEmptySizeInputs((current) => current.filter((item) => item !== size));
  }

  function updateSizeInput(size: SizeKey, value: string) {
    if (value === "") {
      setSizeRun((current) => ({ ...current, [size]: 0 }));
      setEmptySizeInputs((current) => current.includes(size) ? current : [...current, size]);
      return;
    }

    if (!/^\d+$/.test(value)) return;

    setSizeRun((current) => ({ ...current, [size]: Number(value) }));
    setEmptySizeInputs((current) => current.filter((item) => item !== size));
  }

  function resolveSizeInput(size: SizeKey) {
    setEmptySizeInputs((current) => current.filter((item) => item !== size));
  }

  function updateQuantityOnly(delta: number) {
    setQuantityOnly((current) => Math.max(0, current + delta));
    setQuantityOnlyInputEmpty(false);
  }

  function updateQuantityOnlyInput(value: string) {
    if (value === "") {
      setQuantityOnly(0);
      setQuantityOnlyInputEmpty(true);
      return;
    }

    if (!/^\d+$/.test(value)) return;

    setQuantityOnly(Number(value));
    setQuantityOnlyInputEmpty(false);
  }
  function mergeServerInquiry(oldItem: Inquiry, freshInquiry: TrackedInquiry): Inquiry {
    return {
      ...oldItem,
      ...freshInquiry,
      ref: freshInquiry.id,
      createdAt: freshInquiry.submittedAt,
      productName: freshInquiry.product,
      totalPieces: parseTotalPiecesFromQuantity(freshInquiry.quantity) || oldItem.totalPieces,
      customerContact: oldItem.customerContact,
      contact: oldItem.contact || oldItem.customerContact,
      status: normalizeStatus(freshInquiry.statusLabel),
      statusKey: freshInquiry.statusKey,
      statusLabel: freshInquiry.statusLabel || "STATUS ERROR",
      fulfillmentMethod: getFulfillmentMethod(freshInquiry.fulfillmentMethod) || oldItem.fulfillmentMethod,
      deliveryCity: freshInquiry.deliveryCity || oldItem.deliveryCity,
      deliveryAddress: freshInquiry.deliveryAddress || oldItem.deliveryAddress,
      deliveryLandmark: freshInquiry.deliveryLandmark || oldItem.deliveryLandmark,
      trackingSubstatus: getTrackingSubstatus(freshInquiry.trackingSubstatus) || oldItem.trackingSubstatus,
      trackingNote: freshInquiry.trackingNote || oldItem.trackingNote,
      trackingUpdatedAt: freshInquiry.trackingUpdatedAt || oldItem.trackingUpdatedAt,
    };
  }

  function createInquiryFromTracked(freshInquiry: TrackedInquiry, contact: string): Inquiry {
    const method = getMethodFromTrackedProduct(freshInquiry.product);

    return {
      ref: freshInquiry.id,
      createdAt: freshInquiry.submittedAt,
      productId: "tracked-inquiry",
      productName: getProductNameFromTrackedProduct(freshInquiry.product, method),
      basePrice: 0,
      method,
      methodMoq: METHOD_MOQ[method],
      color: "",
      sizeRun: { ...EMPTY_SIZE_RUN },
      totalPieces: parseTotalPiecesFromQuantity(freshInquiry.quantity),
      canvaLink: "",
      artworkName: "",
      artworkSource: "send-later",
      artworkStoragePath: "",
      artworkUploadStatus: "not-needed",
      artworkUploadedAt: "",
      previousReference: "",
      neededDate: "",
      notes: "",
      customerName: "",
      customerContact: contact,
      contact,
      rightsConfirmed: false,
      status: normalizeStatus(freshInquiry.statusLabel),
      statusKey: freshInquiry.statusKey,
      statusLabel: freshInquiry.statusLabel || "STATUS ERROR",
      fulfillmentMethod: getFulfillmentMethod(freshInquiry.fulfillmentMethod),
      deliveryCity: freshInquiry.deliveryCity || "",
      deliveryAddress: freshInquiry.deliveryAddress || "",
      deliveryLandmark: freshInquiry.deliveryLandmark || "",
      trackingSubstatus: getTrackingSubstatus(freshInquiry.trackingSubstatus),
      trackingNote: freshInquiry.trackingNote || "",
      trackingUpdatedAt: freshInquiry.trackingUpdatedAt || "",
    };
  }

  async function fetchTrackedInquiry(id: string, contact: string) {
    const response = await fetch("/api/inquiries/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, contact }),
    });

    const data = await response.json().catch(() => ({})) as {
      ok?: boolean;
      inquiry?: TrackedInquiry;
      error?: string;
    };

    if (!response.ok || !data.ok || !data.inquiry) {
      throw new Error("Inquiry status unavailable.");
    }

    return {
      ...data.inquiry,
      statusLabel: data.inquiry.statusLabel || "STATUS ERROR",
    };
  }

  async function syncSavedInquiryStatuses() {
    if (syncInquiriesInProgressRef.current) return;

    const saved = getStoredInquiries();
    const syncable = saved.filter((item) => item.ref.trim() && item.customerContact.trim());

    setInquiries(saved);
    if (!syncable.length) return;

    syncInquiriesInProgressRef.current = true;
    setIsSyncingInquiries(true);

    try {
      const results = await Promise.allSettled(syncable.map((item) => fetchTrackedInquiry(item.ref, item.customerContact)));
      const freshById = new Map<string, TrackedInquiry>();

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          freshById.set(result.value.id.toLowerCase(), result.value);
        }
      });

      const refreshed = saved.map((item) => {
        const freshInquiry = freshById.get(item.ref.toLowerCase());
        return freshInquiry ? mergeServerInquiry(item, freshInquiry) : item;
      });

      saveStoredInquiries(refreshed);
      setInquiries(refreshed);
    } finally {
      syncInquiriesInProgressRef.current = false;
      setIsSyncingInquiries(false);
    }
  }

  function handleUpload(file: File | undefined) {
    if (!file) return;

    const extension = getFileExtension(file.name);
    if (!ARTWORK_EXTENSIONS.has(extension)) {
      setSelectedArtworkFile(null);
      setArtworkName("");
      setUploadStatus("error");
      setUploadMessage("Unsupported format. Upload PNG, JPG, PDF, SVG, AI, EPS, or PSD.");
      return;
    }

    if (file.size <= 0) {
      setSelectedArtworkFile(null);
      setArtworkName("");
      setUploadStatus("error");
      setUploadMessage("Artwork file is empty. Please choose another file.");
      return;
    }

    if (file.size > MAX_ARTWORK_SIZE) {
      setSelectedArtworkFile(null);
      setArtworkName("");
      setUploadStatus("error");
      setUploadMessage("Artwork file is too large. Upload a file up to 15 MB.");
      return;
    }

    setSelectedArtworkFile(file);
    setArtworkName(file.name);
    setUploadStatus("ready");
    setUploadMessage("Artwork ready for private upload after inquiry submission.");
  }

  function removeArtworkUpload() {
    setSelectedArtworkFile(null);
    setArtworkName("");
    setUploadStatus("idle");
    setUploadMessage("");
  }

  async function uploadArtworkForInquiry(reference: string, contact: string, file: File) {
    const formData = new FormData();
    formData.append("reference", reference);
    formData.append("contact", contact);
    formData.append("file", file);

    const response = await fetch("/api/inquiry-artworks", {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => ({})) as { storagePath?: string; originalFilename?: string; uploadedAt?: string; error?: string };

    if (!response.ok || !result.storagePath) {
      throw new Error(result.error || "Artwork upload failed. Please try again.");
    }

    return result;
  }

  function saveInquiryUpdate(updatedInquiry: Inquiry) {
    const nextList = [updatedInquiry, ...getStoredInquiries().filter((item) => item.ref !== updatedInquiry.ref)].slice(0, 20);

saveStoredInquiries(nextList);
setInquiries(nextList);

    setSubmittedInquiry(updatedInquiry);
  }

  async function retryArtworkUpload() {
    if (!submittedInquiry || submittedInquiry.artworkSource !== "upload") return;
    if (!selectedArtworkFile) {
      setFormError("Choose the artwork file again from the form to retry upload.");
      return;
    }

    setRetryingArtwork(true);
    setFormError("");

    try {
      const uploadResult = await uploadArtworkForInquiry(submittedInquiry.ref, submittedInquiry.customerContact, selectedArtworkFile);
      const updatedInquiry: Inquiry = {
        ...submittedInquiry,
        artworkName: uploadResult.originalFilename || submittedInquiry.artworkName,
        artworkStoragePath: uploadResult.storagePath,
        artworkUploadStatus: "uploaded",
        artworkUploadedAt: uploadResult.uploadedAt || new Date().toISOString(),
      };
      saveInquiryUpdate(updatedInquiry);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Artwork upload failed. Please try again.");
    } finally {
      setRetryingArtwork(false);
    }
  }
  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      if (!totalPieces) setFormError(isQuantityOnlyProduct ? "Add a quantity before submitting." : "Add at least one size quantity before submitting.");
      else if (!moqMet) setFormError(moqNote);
      else if (!canvaValid) setFormError("Canva link must be a valid canva.com link.");
      else if (!hasArtworkPlan) setFormError("Upload artwork, paste a Canva link, or choose send artwork later.");
      else if (!fulfillmentMethod) setFormError("Choose pickup or delivery before submitting.");
      else if (deliveryCityRequired) setFormError("Enter your city or barangay for delivery.");
      else if (deliveryAddressRequired) setFormError("Enter your complete delivery address.");
      else if (customerNameError) {
        setCustomerNameTouched(true);
        setFormError(customerNameError);
      } else if (customerContactError) {
        setCustomerContactTouched(true);
        setFormError(customerContactError);
      }
      else if (!rightsConfirmed) setFormError("Confirm that you own or are allowed to use the artwork.");
      return;
    }

    const artworkSource: ArtworkSource = artworkName ? "upload" : canvaLink.trim() ? "canva" : "send-later";
    if (artworkSource === "upload" && !selectedArtworkFile) {
      setFormError("Choose the artwork file again before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStage("submitting");
    setFormError("");

    const customerSubmittedAt = new Date().toISOString();

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: activeProduct.id,
          productName: activeProduct.name,
          basePrice: activeProduct.basePrice,
          method,
          methodMoq: requiredMoq,
          color,
          sizeRun: isQuantityOnlyProduct ? {} : sizeRun,
          totalPieces,
          canvaLink: canvaLink.trim(),
          artworkName,
          artworkSource,
          previousReference: previousReference.trim(),
          neededDate,
          fulfillmentMethod,
          deliveryCity: deliveryCity.trim(),
          deliveryAddress: deliveryAddress.trim(),
          deliveryLandmark: deliveryLandmark.trim(),
        trackingSubstatus: "",
        trackingNote: "",
        trackingUpdatedAt: "",
          notes: notes.trim(),
          customerName: customerName.trim(),
          customerContact: customerContact.trim(),
          rightsConfirmed,
          customerSubmittedAt,
        }),
      });

      const result = await response.json().catch(() => ({})) as { reference?: string; status?: string; createdAt?: string; error?: string };

      if (!response.ok || !result.reference) {
        throw new Error(result.error || "Unable to submit inquiry right now. Please try again.");
      }

      let artworkStoragePath = "";
      let artworkUploadStatus: ArtworkUploadStatus = artworkSource === "upload" ? "failed" : "not-needed";
      let artworkUploadedAt = "";
      let uploadedArtworkName = artworkLater && !artworkName ? "Send artwork later" : artworkName;
      let uploadFailureMessage = "";

      if (artworkSource === "upload" && selectedArtworkFile) {
        setSubmitStage("uploading");
        try {
          const uploadResult = await uploadArtworkForInquiry(result.reference, customerContact.trim(), selectedArtworkFile);
          artworkStoragePath = uploadResult.storagePath;
          artworkUploadStatus = "uploaded";
          artworkUploadedAt = uploadResult.uploadedAt || new Date().toISOString();
          uploadedArtworkName = uploadResult.originalFilename || uploadedArtworkName;
        } catch (error) {
          uploadFailureMessage = error instanceof Error ? error.message : "Artwork upload failed. Please try again.";
          artworkUploadStatus = "failed";
        }
      }

      window.localStorage.setItem("customerName", customerName.trim());
      window.localStorage.setItem("customerContact", customerContact.trim());

      const savedInquiries = getStoredInquiries();
      const nextInquiry: Inquiry = {
        ref: result.reference,
        createdAt: result.createdAt || customerSubmittedAt,
        productId: activeProduct.id,
        productName: activeProduct.name,
        basePrice: activeProduct.basePrice,
        method,
        methodMoq: requiredMoq,
        color,
        sizeRun: isQuantityOnlyProduct ? { ...EMPTY_SIZE_RUN } : sizeRun,
        totalPieces,
        canvaLink: canvaLink.trim(),
        artworkName: uploadedArtworkName,
        artworkSource,
        artworkStoragePath,
        artworkUploadStatus,
        artworkUploadedAt,
        previousReference: previousReference.trim(),
        neededDate,
          fulfillmentMethod,
          deliveryCity: deliveryCity.trim(),
          deliveryAddress: deliveryAddress.trim(),
          deliveryLandmark: deliveryLandmark.trim(),
        trackingSubstatus: "",
        trackingNote: "",
        trackingUpdatedAt: "",
        notes: notes.trim(),
        customerName: customerName.trim(),
        customerContact: customerContact.trim(),
        contact: customerContact.trim(),
        rightsConfirmed,
        status: normalizeStatus(result.status),
        statusKey: normalizeStatus(result.status) === "FOR REVIEW" ? "new" : "submitted",
        statusLabel: normalizeStatus(result.status),
      };

      const nextList = [nextInquiry, ...savedInquiries].slice(0, 20);
saveStoredInquiries(nextList);
clearStoredDraft();
setStoredDraft(null);
setInquiries(nextList);
setSubmittedInquiry(nextInquiry);
      setTrackRef(nextInquiry.ref);
      setTrackContact(nextInquiry.customerContact);
      setFormError(uploadFailureMessage ? `Inquiry received, but ${uploadFailureMessage}` : "");
      setScreen("submitted");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to submit inquiry right now. Please try again.");
    } finally {
      setIsSubmitting(false);
      setSubmitStage("idle");
    }
  }
  async function trackInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const inquiryNumber = trackRef.trim();
    const contact = trackContact.trim();

    setTrackSearched(false);
    setTrackedInquiry(null);

    if (!inquiryNumber || !contact) {
      setTrackSearched(true);
      return;
    }

    setIsTracking(true);

    try {
      const freshInquiry = await fetchTrackedInquiry(inquiryNumber, contact);
      const saved = getStoredInquiries();
      const existing = saved.find((item) => item.ref.toLowerCase() === freshInquiry.id.toLowerCase());

      const refreshedLocalInquiry = existing
        ? mergeServerInquiry(existing, freshInquiry)
        : createInquiryFromTracked(freshInquiry, contact);
      const nextList = existing
        ? saved.map((item) => item.ref.toLowerCase() === refreshedLocalInquiry.ref.toLowerCase() ? refreshedLocalInquiry : item).slice(0, 20)
        : [refreshedLocalInquiry, ...saved].slice(0, 20);

      saveStoredInquiries(nextList);
      setInquiries(nextList);

      setTrackedInquiry(freshInquiry);
      setTrackSearched(true);
    } catch {
      setTrackSearched(true);
    } finally {
      setIsTracking(false);
    }
  }

  function BottomNav({ active }: { active: "home" | "catalog" | "myInquiries" }) {
    return (
      <nav className="bottomNav" aria-label="TRRY navigation">
        <button className={active === "home" ? "active" : ""} onClick={() => setScreen("home")} type="button">HOME</button>
        <button className={active === "catalog" ? "active" : ""} onClick={openCatalog} type="button">CATALOG</button>
        <button className={active === "myInquiries" ? "active" : ""} onClick={() => setScreen("myInquiries")} type="button">MY INQUIRIES</button>
      </nav>
    );
  }

  function AppHeader({ backTo, rightLabel }: { backTo?: Screen; rightLabel?: string }) {
    return (
      <header className="appHeader">
        {backTo ? <button className="plainLink" onClick={() => setScreen(backTo)} type="button">BACK</button> : <span />}
        <strong className="trryLogo">TRRY<span>*</span></strong>
        {rightLabel ? <span className="headerTag">{rightLabel}</span> : <span />}
      </header>
    );
  }

  function SectionHeading({ number, title, helper, meta, metaTone }: { number: string; title: string; helper: string; meta?: string; metaTone?: "active" }) {
    return <div className="sectionHeading"><span>{number}</span><div><h2>{title}</h2><p>{helper}</p></div>{meta ? <strong className={metaTone === "active" ? "activeMeta" : undefined}>{meta}</strong> : null}</div>;
  }


  function ProductThumb({ product, large = false }: { product: Product; large?: boolean }) {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
      setImageFailed(false);
    }, [product.imageUrl]);

    return (
      <div className={large ? "productThumb large" : "productThumb"}>
        {product.imageUrl && !imageFailed ? <img src={product.imageUrl} alt="" onError={() => setImageFailed(true)} /> : <span>{product.icon}</span>}
      </div>
    );
  }
  function renderHome() {
    return (
      <section className="screen homeScreen approvedHome withNav" aria-labelledby="home-title">
        <header className="approvedHomeHeader">
          <strong className="approvedBrand">TRRY<span>*</span></strong>
          <div className="approvedMeta" aria-hidden="true">
            <span><b suppressHydrationWarning>{manilaTime}</b> ILIGAN CITY</span>
            <span>EST 2013</span>
          </div>
        </header>
        <div className="approvedDivider" aria-hidden="true" />
        <section className="approvedHero">
  <h1 id="home-title"><span>CUSTOM</span><span>APPAREL,</span><span>MADE SIMPLE.</span></h1>

  <p>Browse the catalog. No sign-in needed.</p>
</section>
        <section className="approvedServices" aria-label="Services">
          <h2>SERVICES</h2>
          <div className="approvedServiceLedger">
            <div className="approvedServiceRow">
              <span className="approvedServiceIcon" aria-hidden="true"><svg viewBox="0 0 32 32" role="img"><path d="M11 5h10l5 4-3 5-3-2v15H12V12l-3 2-3-5 5-4Z" /></svg></span>
              <strong>Custom t-shirts</strong>
              <span>DTF / SCREEN</span>
            </div>
            <div className="approvedServiceRow">
              <span className="approvedServiceIcon" aria-hidden="true"><svg viewBox="0 0 32 32" role="img"><path d="M5 21c.8-6.3 5.2-10 11-10s10.2 3.7 11 10H5Z" /><path d="M16 7v4" /><path d="M4 21h24" /></svg></span>
              <strong>Embroidery and caps</strong>
              <span>HOOP 20CM</span>
            </div>
            <div className="approvedServiceRow">
              <span className="approvedServiceIcon" aria-hidden="true"><svg viewBox="0 0 32 32" role="img"><path d="M12 5h8l4 4-3 4-2-2v16h-6V11l-2 2-3-4 4-4Z" /><path d="M14 5l2 4 2-4" /></svg></span>
              <strong>Uniforms and business</strong>
              <span>MOQ 30</span>
            </div>
          </div>
        </section>
        <div className="approvedHomeActions">
          <button className="approvedBrowseCta" onClick={openCatalog} type="button">Browse catalog</button>
          <button className="approvedTrackLink" onClick={() => { setTrackSearched(false); setTrackedInquiry(null); setScreen("myInquiries"); }} type="button">Track an existing inquiry</button>
        </div>
        <BottomNav active="home" />
      </section>
    );
  }
  function renderCatalog() {
    return (
      <section className="screen catalogScreen withNav" aria-labelledby="catalog-title">
        <AppHeader backTo="home" rightLabel={catalogCountLabel.toUpperCase()} />
        <div className="catalogIntro"><span className="eyebrow">LIVE CATALOG</span><h1 id="catalog-title">CHOOSE YOUR PRODUCT.</h1><p>Final price depends on garment, print method, print size, placement, and quantity.</p></div>
        {catalogStatus === "loading" ? <div className="catalogSkeleton" aria-label="Loading catalog"><span /><span /><span /><span /></div> : null}
        {catalogStatus === "error" ? <div className="formError" role="alert"><p>{catalogError}{ALLOW_CATALOG_FALLBACK ? " Showing local catalog fallback." : ""}</p><button className="outlineCta" onClick={loadCatalog} type="button">RETRY CATALOG</button></div> : null}
        {catalogStatus === "ready" && !products.length ? <p className="emptyState">Catalog is being prepared. Please check again soon.</p> : null}
        {catalogStatus !== "loading" && products.length ? <div className="catalogGrid">{products.map((product) => <button className="productCard" key={product.id} onClick={() => openProduct(product)} type="button"><ProductThumb product={product} /><span className="productMeta"><small>{product.sizing === "quantity-only" ? "QUANTITY ORDER" : "SIZE RUN"}</small><strong>{product.name}</strong></span>{product.description ? <span className="productDescription">{product.description}</span> : null}<span className="methodTags">{product.tags.map((tag) => <small key={tag}>{tag.replace(" Transfer", "")}</small>)}</span><span className="priceLine">{getPriceDisplay(product)}</span>{product.moq.minimum > 1 ? <span className="moqChip">MOQ {product.moq.minimum} PCS</span> : null}<span className="blackCta">CUSTOMIZE</span></button>)}</div> : null}
        <BottomNav active="catalog" />
      </section>
    );
  }  function renderCustomize() {
    return (
      <section className="screen customizeScreen withNav" aria-labelledby="customize-title">
        <AppHeader backTo="catalog" rightLabel="INQUIRY" />
        <form className="customizeForm" onSubmit={submitInquiry} noValidate>
          <section className="selectedProduct">
            <ProductThumb product={activeProduct} large />
            <div className="selectedProductDetails">
              <h1 id="customize-title">{activeProduct.name}</h1>
              {activeProduct.description ? <p>{activeProduct.description}</p> : null}
              <strong>{getPriceDisplay(activeProduct)}</strong>
              <small>{activeProduct.moq.note}</small>
              <div className="productColorPicker" aria-label="Garment color">
                <span>COLOR</span>
                <div className="productColorSwatches">
                  {headerColorChoices.map((item) => (
                    <span className="productColorOption" key={item.key}>
                      <button aria-label={`Select ${item.label} color`} className={color === item.colorName ? "selected" : ""} onClick={() => setColor(item.colorName)} style={{ background: item.value }} type="button" />
                      <small>{item.label}</small>
                    </span>
                  ))}
                </div>
                <b>{selectedColorLabel}</b>
              </div>
            </div>
          </section>

          <section className="formSection methodSection">
            <SectionHeading number="01" title="PRINT METHOD" helper="Choose how TRRY should decorate this item." />
            <div className="methodCards">
              {activeProduct.tags.map((item) => (
                <button className={method === item ? "selected" : ""} key={item} onClick={() => setMethod(item)} type="button">
                  <span>
                    <strong>{item.toUpperCase()}</strong>
                    {method === item ? <b>SELECTED</b> : null}
                  </span>
                  <small>{item === "DTF Transfer" ? "Full-color, detailed prints" : item === "Embroidery" ? "Stitched, premium finish" : "Best for bulk, bold colors"}</small>
                </button>
              ))}
            </div>
          </section>


          <section className="formSection quantitySection">
            <SectionHeading number="03" title={isQuantityOnlyProduct ? "QUANTITY" : "SIZE & QUANTITY"} helper={isQuantityOnlyProduct ? "Set total pieces for this product." : "Enter pieces per size. Total updates live."} meta={formatPieceCount(totalPieces)} />
            {isQuantityOnlyProduct ? (
              <div className="quantityOnlyControl">
                <button aria-label="Decrease quantity" onClick={() => updateQuantityOnly(-1)} type="button">-</button>
                <input aria-label="Quantity" inputMode="numeric" min="0" onBlur={() => setQuantityOnlyInputEmpty(false)} onChange={(event) => updateQuantityOnlyInput(event.target.value)} pattern="[0-9]*" step="1" type="number" value={quantityOnlyInputEmpty ? "" : quantityOnly} />
                <button aria-label="Increase quantity" onClick={() => updateQuantityOnly(1)} type="button">+</button>
              </div>
            ) : (
              <div className="sizeRunCompact">
                {defaultSizeKeys.length ? (
                  <div className="sizeRunGrid">
                    {defaultSizeKeys.map((size) => (
                      <div className="sizeRunRow compact" key={size}>
                        <strong>{size}</strong>
                        <button aria-label={`Decrease ${size}`} onClick={() => updateSize(size, -1)} type="button">-</button>
                        <input aria-label={`${size} quantity`} inputMode="numeric" min="0" onBlur={() => resolveSizeInput(size)} onChange={(event) => updateSizeInput(size, event.target.value)} pattern="[0-9]*" step="1" type="number" value={emptySizeInputs.includes(size) ? "" : (sizeRun[size] ?? 0)} />
                        <button aria-label={`Increase ${size}`} onClick={() => updateSize(size, 1)} type="button">+</button>
                      </div>
                    ))}
                  </div>
                ) : null}
                {extraSizeKeys.length ? (
                  <>
                    {showExtraSizes ? (
                      <div className="sizeRunGrid extraSizes">
                        {extraSizeKeys.map((size) => (
                          <div className="sizeRunRow compact" key={size}>
                            <strong>{size}</strong>
                            <button aria-label={`Decrease ${size}`} onClick={() => updateSize(size, -1)} type="button">-</button>
                            <input aria-label={`${size} quantity`} inputMode="numeric" min="0" onBlur={() => resolveSizeInput(size)} onChange={(event) => updateSizeInput(size, event.target.value)} pattern="[0-9]*" step="1" type="number" value={emptySizeInputs.includes(size) ? "" : (sizeRun[size] ?? 0)} />
                            <button aria-label={`Increase ${size}`} onClick={() => updateSize(size, 1)} type="button">+</button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <button className={extraSizePieces > 0 ? "sizeToggle hasPieces" : "sizeToggle"} onClick={() => setSizeExtrasOpen((current) => extraSizePieces > 0 ? true : !current)} type="button">
                      {extraSizeToggleLabel}
                    </button>
                  </>
                ) : null}
              </div>
            )}
            <p className={moqMet || totalPieces === 0 ? "moqNote" : "moqNote error"}>{moqNote}</p>
          </section>

          <section className="formSection artworkSection">
            <SectionHeading number="04" title="ARTWORK" helper="Upload first, or use Canva/send later." meta={selectedArtworkStatus} metaTone={hasArtworkPlan ? "active" : undefined} />
            <div className="uploadPanel">
              <div className="uploadPanelHeader">UPLOAD DESIGN</div>
              {artworkName ? (
                <div className="attachedFileBox">
                  <span className="attachmentStatus">1 FILE ATTACHED</span>
                  <strong>{artworkName}</strong>
                  <small>{attachedArtworkMeta}</small>
                  <button className="plainLink" onClick={removeArtworkUpload} type="button">REMOVE</button>
                </div>
              ) : (
                <label className={uploadStatus === "error" ? "uploadDrop hasError" : "uploadDrop"}>
                  <input accept=".png,.jpg,.jpeg,.pdf,.svg,.ai,.eps,.psd" onChange={(event) => handleUpload(event.target.files?.[0])} type="file" />
                  <span aria-hidden="true" className="uploadIcon">UPLOAD</span>
                  <strong>TAP TO ADD YOUR FILE</strong>
                  <small>PNG, JPG, PDF, SVG, AI, EPS, PSD</small>
                </label>
              )}
            </div>
            {uploadStatus === "ready" ? <p className="uploadState good">Artwork ready for review.</p> : null}
            {uploadStatus === "error" ? <p className="uploadState bad">{uploadMessage}</p> : null}
            <div className="artworkDivider">OR USE ANOTHER OPTION</div>
            <label className="stackedField canvaField">
              <span>PASTE CANVA LINK</span>
              <small>Make sure link access is set to Anyone with the link.</small>
              <input aria-invalid={!canvaValid} placeholder="https://canva.com/design/..." value={canvaLink} onChange={(event) => setCanvaLink(event.target.value)} />
            </label>
            <label className="rightsCheck sendLaterCheck">
              <input checked={artworkLater} onChange={(event) => setArtworkLater(event.target.checked)} type="checkbox" />
              <span>I will send artwork after this inquiry.</span>
            </label>
          </section>

                    <section className="formSection fulfillmentSection">
            <SectionHeading number="05" title="FULFILLMENT" helper="Choose how you want to receive the order after approval." />
            <div className="fulfillmentOptions" role="radiogroup" aria-label="Fulfillment method">
              <button aria-checked={fulfillmentMethod === "pickup"} className={fulfillmentMethod === "pickup" ? "selected" : ""} onClick={() => setFulfillmentMethod("pickup")} role="radio" type="button">
                <strong>PICKUP</strong>
                <small>Pickup at TRRY Apparel, Iligan City.</small>
              </button>
              <button aria-checked={fulfillmentMethod === "delivery"} className={fulfillmentMethod === "delivery" ? "selected" : ""} onClick={() => setFulfillmentMethod("delivery")} role="radio" type="button">
                <strong>DELIVERY</strong>
                <small>Delivery fee will be confirmed after review.</small>
              </button>
            </div>
            {fulfillmentMethod === "pickup" ? <p className="fulfillmentNote">Pickup at TRRY Apparel, Iligan City.</p> : null}
            {fulfillmentMethod === "delivery" ? (
              <div className="deliveryFields">
                <p className="fulfillmentNote">Delivery fee will be confirmed after review.</p>
                <label className="stackedField">
                  <span>CITY / BARANGAY</span>
                  <input aria-invalid={deliveryCityRequired} placeholder="Iligan City / Barangay" value={deliveryCity} onChange={(event) => setDeliveryCity(event.target.value)} />
                </label>
                <label className="stackedField">
                  <span>COMPLETE DELIVERY ADDRESS</span>
                  <input aria-invalid={deliveryAddressRequired} placeholder="House no., street, building, area" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} />
                </label>
                <label className="stackedField">
                  <span>LANDMARK OPTIONAL</span>
                  <input placeholder="Near school, store, terminal..." value={deliveryLandmark} onChange={(event) => setDeliveryLandmark(event.target.value)} />
                </label>
              </div>
            ) : null}
            <button className={neededDate ? "dateTrigger hasDate" : "dateTrigger"} onClick={() => { const selected = parseDateKey(neededDate); setDatePickerMonth(selected ? new Date(selected.getFullYear(), selected.getMonth(), 1, 12) : new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12)); setDatePickerOpen(true); }} type="button" aria-haspopup="dialog" aria-expanded={datePickerOpen}>
              <span>REQUESTED DATE</span>
              <strong>{selectedDateLabel}</strong>
            </button>
            {method === "Embroidery" ? (
              <div className="pinkBox inline">
                <h2>PREVIOUS EMBROIDERY REFERENCE</h2>
                <p>Already embroidered before? Send the prior job name or reference so TRRY can check if digitizing is ready.</p>
                <input placeholder="Example: Polo logo batch 2025" value={previousReference} onChange={(event) => setPreviousReference(event.target.value)} />
              </div>
            ) : null}
          </section>
<section className="formSection contactSection">
            <SectionHeading number="06" title="CONTACT" helper="No account needed. This is for quote updates only." />
            <label className="stackedField">
              <span>NAME</span>
              <input aria-describedby="customer-name-error" aria-invalid={customerNameTouched && Boolean(customerNameError)} placeholder="Your full name" value={customerName} onBlur={() => { setCustomerNameTouched(true); setCustomerName(customerName.trim()); }} onChange={(event) => setCustomerName(event.target.value)} />
            </label>
            {customerNameTouched && customerNameError ? <p className="fieldError" id="customer-name-error" role="alert">{customerNameError}</p> : null}
            <label className="stackedField">
              <span>CONTACT NUMBER OR MESSENGER</span>
              <input aria-describedby="customer-contact-error" aria-invalid={customerContactTouched && Boolean(customerContactError)} placeholder="Phone number or Messenger" value={customerContact} onBlur={() => setCustomerContactTouched(true)} onChange={(event) => setCustomerContact(event.target.value)} />
            </label>
            {customerContactTouched && customerContactError ? <p className="fieldError" id="customer-contact-error" role="alert">{customerContactError}</p> : null}
            <p>We'll use this to send your quote and production updates.</p>
          </section>

          <section className="formSection reviewSection">
            <SectionHeading number="07" title="REVIEW" helper="Check the inquiry summary before sending." />
            <dl>
              <div><dt>PRODUCT</dt><dd>{activeProduct.name}</dd></div>
              <div><dt>METHOD</dt><dd>{method}</dd></div>
              <div><dt>COLOR</dt><dd>{color}</dd></div>
              <div><dt>QUANTITY</dt><dd>{formatPieceCount(totalPieces)}</dd></div>
              <div><dt>FULFILLMENT</dt><dd>{fulfillmentReview}</dd></div><div><dt>NEEDED DATE</dt><dd>{neededDate ? `Needed by ${neededDate}` : "Date not set"}</dd></div>
              <div><dt>ARTWORK</dt><dd>{selectedArtworkSummary}</dd></div>
              <div><dt>CONTACT</dt><dd>{reviewContact}</dd></div>
            </dl>
          </section>

          <section className="formSection notesSection">
            <SectionHeading number="NOTE" title="NOTES OPTIONAL" helper="Placement, color notes, deadline, or other details." />
            <textarea placeholder="Placement, colors, deadline, etc." value={notes} onChange={(event) => setNotes(event.target.value)} />
          </section>

          <label className="rightsCheck">
            <input checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} type="checkbox" />
            <span>I confirm I have the right to print this design.</span>
          </label>
          {formError ? <p className="formError" role="alert">{formError}</p> : null}
          <div className="stickySubmit">
            <div className="submitTotalRow">
              <span>TOTAL</span>
              <strong>{totalPieces} PCS</strong>
            </div>
            <button className="limeCta" disabled={!canSubmit} type="submit">{submitButtonText}</button>
          </div>
        </form>
        {datePickerOpen ? (
          <div className="dateSheetOverlay" onClick={() => setDatePickerOpen(false)} role="presentation">
            <section aria-label="Select requested date" aria-modal="true" className="dateSheet" onClick={(event) => event.stopPropagation()} role="dialog">
              <div className="dateSheetHeader">
                <span>SELECT DATE</span>
                <button aria-label="Close date picker" onClick={() => setDatePickerOpen(false)} type="button">CLOSE</button>
              </div>
              <div className="dateMonthNav">
                <button aria-label="Previous month" onClick={() => setDatePickerMonth((current) => addCalendarMonths(current, -1))} type="button">PREV</button>
                <strong>{datePickerMonthLabel}</strong>
                <button aria-label="Next month" onClick={() => setDatePickerMonth((current) => addCalendarMonths(current, 1))} type="button">NEXT</button>
              </div>
              <div className="dateWeekdays" aria-hidden="true">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="dateGrid">
                {datePickerDays.map((item) => isDatePickerDay(item) ? (
                  <button aria-label={`${item.isSelected ? 'Selected date, ' : ''}${item.date.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}`} className={[item.isSelected ? 'selected' : '', item.isToday ? 'today' : ''].filter(Boolean).join(' ')} disabled={item.isPast} key={item.key} onClick={() => setNeededDate(item.key)} type="button">
                    {item.day}
                  </button>
                ) : <span aria-hidden="true" key={item.key} />)}
              </div>
              <div className="dateSheetActions">
                <button className="outlineCta" onClick={() => setNeededDate("")} type="button">RESET</button>
                <button className="limeCta" onClick={() => setDatePickerOpen(false)} type="button">CONFIRM DATE</button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    );
  }
  function TrackingSubstatusPanel({ statusKey: _statusKey, fulfillmentMethod, trackingSubstatus, trackingNote, trackingUpdatedAt }: { statusKey?: string; fulfillmentMethod?: FulfillmentMethod | ""; trackingSubstatus?: TrackingSubstatus | ""; trackingNote?: string; trackingUpdatedAt?: string }) {
    const detail = getTrackingSubstatusDetail(getTrackingSubstatus(trackingSubstatus), fulfillmentMethod || "");
    if (!detail) return null;

    return (
      <div className="trackingSubstatusPanel">
        <span>STEP 5 UPDATE</span>
        <strong>{detail.title}</strong>
        <p>{detail.message}</p>
        {trackingNote ? <p>{trackingNote}</p> : null}
        {trackingUpdatedAt ? <small>Updated {formatCustomerDate(trackingUpdatedAt)}</small> : null}
      </div>
    );
  }
  function renderSubmitted() {
    const current = submittedInquiry;
    return (
      <section className="screen submittedScreen withNav" aria-labelledby="submitted-title">
        <AppHeader rightLabel="RECEIPT" />
        <div className="successHeader"><span>INQUIRY RECEIVED</span><h1 id="submitted-title">REFERENCE<br />{current?.ref || "TRRY"}</h1><p>We'll review your request and prepare your quotation. Screenshot this receipt for easy tracking.</p></div>
        <div className="receiptBox"><h2>TRRY INQUIRY RECEIPT</h2><dl><div><dt>REF NO.</dt><dd>{current?.ref}<button className="copyMini" onClick={() => current?.ref && navigator.clipboard?.writeText(current.ref)} type="button">COPY</button></dd></div><div><dt>PRODUCT</dt><dd>{current?.productName}</dd></div><div><dt>QUANTITY</dt><dd>{current ? formatPieceCount(current.totalPieces) : ""}</dd></div><div><dt>METHOD</dt><dd>{current?.method}</dd></div><div><dt>STATUS</dt><dd><mark>{getCustomerFacingStatusLabel(current?.statusLabel, current?.trackingSubstatus)}</mark></dd></div><div><dt>FULFILLMENT</dt><dd>{getFulfillmentLabel(current?.fulfillmentMethod || "")}</dd></div>{current?.fulfillmentMethod === "delivery" ? <div><dt>DELIVERY ADDRESS</dt><dd>{getDeliverySummary(current.deliveryCity, current.deliveryAddress, current.deliveryLandmark) || "Address pending"}</dd></div> : null}<div><dt>ARTWORK</dt><dd>{getArtworkStateLabel(current)}</dd></div></dl><p>No quote before review. No print without approval.</p></div>
        {formError ? <p className="formError" role="alert">{formError}</p> : null}
        {current?.artworkSource === "upload" && current.artworkUploadStatus === "failed" ? <button className="outlineCta" disabled={retryingArtwork} onClick={retryArtworkUpload} type="button">{retryingArtwork ? "UPLOADING ARTWORK" : "RETRY ARTWORK UPLOAD"}</button> : null}
        <TrackerCard statusKey={current?.statusKey} fulfillmentMethod={current?.fulfillmentMethod} trackingSubstatus={current?.trackingSubstatus} trackingNote={current?.trackingNote} trackingUpdatedAt={current?.trackingUpdatedAt} />
        <a className="blackButton" href={messengerLink} rel="noreferrer" target="_blank">CHAT WITH US ON MESSENGER</a>
        <button className="outlineCta" onClick={() => setScreen("myInquiries")} type="button">VIEW ALL INQUIRIES</button>
        <BottomNav active="myInquiries" />
      </section>
    );
  }
  function TrackerCard({ statusKey, fulfillmentMethod, trackingSubstatus, trackingNote, trackingUpdatedAt }: { statusKey?: string; fulfillmentMethod?: FulfillmentMethod | ""; trackingSubstatus?: TrackingSubstatus | ""; trackingNote?: string; trackingUpdatedAt?: string }) {
    const progress = getInquiryProgress(statusKey, trackingSubstatus);
    const context = getTrackerContext(statusKey, trackingSubstatus);

    if (progress.closed) return <div className="trackerCard closed"><h2>TRACK YOUR INQUIRY <span>CLOSED</span></h2><p className="active">{progress.label}</p><small>{context}</small></div>;

    return <div className="trackerCard"><h2>TRACK YOUR INQUIRY <span>STEP {progress.step}/5</span></h2><div className="bar"><span style={{ width: `${progress.progress}%` }} /></div>{TRACKER_STEPS.map((step, index) => <p className={index === progress.step - 1 ? "active" : index < progress.step - 1 ? "done" : ""} key={step}>{index + 1}. {step}</p>)}<small>{context}</small><TrackingSubstatusPanel statusKey={statusKey} fulfillmentMethod={fulfillmentMethod} trackingSubstatus={trackingSubstatus} trackingNote={trackingNote} trackingUpdatedAt={trackingUpdatedAt} /></div>;
  }

  function renderMyInquiries() {
    return (
      <section className="screen myInquiriesScreen withNav" aria-labelledby="my-inquiries-title">
        <AppHeader backTo="home" rightLabel={`${inquiries.length} SAVED`} />
        <div className="myIntro"><span className="eyebrow">TRACKING DESK</span><h1 id="my-inquiries-title">MY INQUIRIES.</h1><p>Saved inquiries refresh when this screen opens.</p></div>
        <form className="trackForm" onSubmit={trackInquiry}>
          <SectionHeading number="LOOKUP" title="TRACK AN INQUIRY" helper="Enter the reference and the same contact used for the request." />
          <label><span>INQUIRY NUMBER</span><input placeholder="TRRY-5921" value={trackRef} onChange={(event) => setTrackRef(event.target.value)} /></label>
          <label><span>CONTACT</span><input placeholder="Phone number or Messenger used in order" value={trackContact} onChange={(event) => setTrackContact(event.target.value)} /></label>
          <button className="limeCta" disabled={isTracking} type="submit">{isTracking ? "TRACKING" : "TRACK INQUIRY"}</button>
        </form>
        {isSyncingInquiries ? <p className="syncStatus">UPDATING INQUIRIES...</p> : null}
        {trackSearched ? trackedInquiry ? <div className="receiptBox foundInquiry"><h2>FOUND INQUIRY</h2><dl><div><dt>REF NO.</dt><dd>{trackedInquiry.id}</dd></div><div><dt>PRODUCT</dt><dd>{trackedInquiry.product}</dd></div><div><dt>QUANTITY</dt><dd>{normalizeQuantityDisplay(trackedInquiry.quantity)}</dd></div><div><dt>STATUS</dt><dd><mark>{getCustomerFacingStatusLabel(trackedInquiry.statusLabel, trackedInquiry.trackingSubstatus)}</mark></dd></div><div><dt>FULFILLMENT</dt><dd>{getFulfillmentLabel(trackedInquiry.fulfillmentMethod || "")}</dd></div>{trackedInquiry.fulfillmentMethod === "delivery" ? <div><dt>DELIVERY ADDRESS</dt><dd>{getDeliverySummary(trackedInquiry.deliveryCity || "", trackedInquiry.deliveryAddress || "", trackedInquiry.deliveryLandmark || "") || "Address pending"}</dd></div> : null}<div><dt>ARTWORK</dt><dd>{trackedInquiry.artworkLabel}</dd></div></dl><TrackingSubstatusPanel statusKey={trackedInquiry.statusKey} fulfillmentMethod={trackedInquiry.fulfillmentMethod} trackingSubstatus={trackedInquiry.trackingSubstatus} trackingNote={trackedInquiry.trackingNote} trackingUpdatedAt={trackedInquiry.trackingUpdatedAt} /><p>Saved to My Inquiries for future status refresh.</p></div> : <div className="notFound"><p>No inquiry found. Check your reference number, or reach us directly.</p>{trackRef.trim() ? <a className="blackButton" href={`${MESSENGER_LINK}?text=${encodeURIComponent(`Hi TRRY, I need help finding inquiry ${trackRef.trim()}.`)}`} rel="noreferrer" target="_blank">CHAT WITH US ON MESSENGER</a> : null}</div> : null}
        <div className="inquiryListHeader"><h2>SAVED INQUIRIES</h2></div>
        <div className="inquiryList">{inquiries.length ? inquiries.map((item) => { const nextAction = getNextActionLabel(item.statusKey, item.trackingSubstatus); return <button className="inquiryItem" key={item.ref} onClick={() => { setSubmittedInquiry(item); setScreen("submitted"); }} type="button"><span className="inquiryTop"><strong>{item.productName}</strong><mark>{getCustomerFacingStatusLabel(item.statusLabel, item.trackingSubstatus)}</mark></span><span>{item.ref} / {formatPieceCount(item.totalPieces)}</span><small>Submitted {formatCustomerDate(item.createdAt)}</small><small>{getArtworkStateLabel(item)}</small><small>{getFulfillmentLabel(item.fulfillmentMethod)}{item.fulfillmentMethod === "delivery" ? ` / ${getDeliverySummary(item.deliveryCity, item.deliveryAddress, item.deliveryLandmark)}` : ""}</small>{getTrackingSubstatusLabel(item.trackingSubstatus, item.fulfillmentMethod) ? <small>{getTrackingSubstatusLabel(item.trackingSubstatus, item.fulfillmentMethod)}</small> : null}<TrackingSubstatusPanel statusKey={item.statusKey} fulfillmentMethod={item.fulfillmentMethod} trackingSubstatus={item.trackingSubstatus} trackingNote={item.trackingNote} trackingUpdatedAt={item.trackingUpdatedAt} /><small>NEXT: {nextAction}</small><b>VIEW DETAILS</b></button>; }) : <p className="emptyState">No saved inquiries yet. Browse the catalog to start one, or use the tracking form above.</p>}</div>
        <BottomNav active="myInquiries" />
      </section>
    );
  }
  return (
    <main className="phoneFrame">
      {screen === "home" ? renderHome() : null}
      {screen === "catalog" ? renderCatalog() : null}
      {screen === "customize" ? renderCustomize() : null}
      {screen === "submitted" ? renderSubmitted() : null}
      {screen === "myInquiries" ? renderMyInquiries() : null}
    </main>
  );
}







