"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

type Screen = "home" | "catalog" | "customize" | "submitted" | "myInquiries";
type Method = "DTF Transfer" | "Embroidery" | "Screen Print";
type SizeKey = "XS" | "S" | "M" | "L" | "XL" | "2XL";
type UploadStatus = "idle" | "ready" | "error";
type ArtworkSource = "upload" | "canva" | "send-later";
type ArtworkUploadStatus = "not-needed" | "uploaded" | "failed";
type InquiryStatus = "FOR REVIEW" | "NEEDS QUOTE" | "IN PRODUCTION" | "DELIVERED" | "STATUS UPDATE" | "STATUS ERROR";

type SizeRun = Record<SizeKey, number>;

type Product = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  icon: string;
  tags: Method[];
  availableSizes: SizeKey[];
  moq: {
    minimum: number;
    note: string;
  };
  referenceRequired?: boolean;
  sizing: "sized" | "quantity-only";
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
  notes: string;
  customerName: string;
  customerContact: string;
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
  artworkLabel: string;
  statusKey: string;
  statusLabel: InquiryStatus;
};

const PRODUCTS: Product[] = [
  { id: "premium-cotton-shirt", name: "Premium Cotton Shirt", description: "Soft daily shirt for prints and slogans.", basePrice: 280, icon: "TS", tags: ["DTF Transfer", "Screen Print"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], sizing: "sized", moq: { minimum: 1, note: "Minimum order: 1 piece." } },
  { id: "caps", name: "Caps", description: "Logo caps for crews and teams.", basePrice: 180, icon: "CP", tags: ["Embroidery"], availableSizes: [], sizing: "quantity-only", moq: { minimum: 12, note: "Minimum order: 12 pieces for embroidery." }, referenceRequired: true },
  { id: "boxy-crop-shirt", name: "Boxy Crop Shirt", description: "Boxy fit merch shirt.", basePrice: 300, icon: "BX", tags: ["DTF Transfer"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], sizing: "sized", moq: { minimum: 1, note: "Minimum order: 1 piece." } },
  { id: "polo-uniform", name: "Polo Uniform", description: "Business polo with logo placement.", basePrice: 350, icon: "PL", tags: ["Embroidery", "DTF Transfer"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], sizing: "sized", moq: { minimum: 12, note: "Minimum order: 12 pieces for embroidery." }, referenceRequired: true },
  { id: "tote-bag", name: "Tote Bag", description: "Reusable merch and event bag.", basePrice: 220, icon: "TB", tags: ["DTF Transfer", "Screen Print"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], sizing: "sized", moq: { minimum: 1, note: "Minimum order: 1 piece." } },
  { id: "towels", name: "Towels", description: "Premium giveaway or team towels.", basePrice: 200, icon: "TW", tags: ["Embroidery"], availableSizes: [], sizing: "quantity-only", moq: { minimum: 12, note: "Minimum order: 12 pieces for embroidery." }, referenceRequired: true },
];

const METHOD_MOQ: Record<Method, number> = {
  "DTF Transfer": 1,
  Embroidery: 1,
  "Screen Print": 30,
};

const COLORS = [
  { name: "Black", value: "#111111" },
  { name: "White", value: "#fffdf8" },
  { name: "Sand", value: "#dfd0b5" },
  { name: "Olive", value: "#596042" },
  { name: "Maroon", value: "#64171d" },
  { name: "Navy", value: "#0c1d39" },
];

const SIZES: SizeKey[] = ["XS", "S", "M", "L", "XL", "2XL"];
const EMPTY_SIZE_RUN: SizeRun = { XS: 0, S: 0, M: 0, L: 0, XL: 0, "2XL": 0 };
const ARTWORK_EXTENSIONS = new Set(["png", "jpg", "jpeg", "pdf", "svg", "ai", "eps", "psd"]);
const MAX_ARTWORK_SIZE = 15 * 1024 * 1024;

function createSizeRunForProduct(product: Product): SizeRun {
  const nextSizeRun = { ...EMPTY_SIZE_RUN };
  product.availableSizes.forEach((size) => {
    nextSizeRun[size] = 0;
  });
  return nextSizeRun;
}
const STORAGE_KEY = "trry_inquiries_v3";
const MESSENGER_LINK = "https://m.me/trryapparel";

function formatMoney(value: number) {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function makeRef(existing: Inquiry[] = []) {
  const usedRefs = new Set(existing.map((item) => item.ref.toLowerCase()));
  let candidate = "";
  do {
    candidate = `TRRY-${Math.floor(1000 + Math.random() * 9000)}`;
  } while (usedRefs.has(candidate.toLowerCase()));
  return candidate;
}

function formatCustomerDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}
function parseTotalPiecesFromQuantity(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 0;
}


function cleanPhone(value: string) {
  return value.trim().toLowerCase();
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

function getArtworkUploadStatus(item: Record<string, unknown>, source: ArtworkSource): ArtworkUploadStatus {
  if (item.artworkUploadStatus === "uploaded" || item.artworkUploadStatus === "failed" || item.artworkUploadStatus === "not-needed") return item.artworkUploadStatus;
  if (source !== "upload") return "not-needed";
  return "uploaded";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeStatus(value: unknown): InquiryStatus {
  const status = String(value || "").trim().replace(/_/g, " ").toLowerCase();
  if (status === "new" || status === "for review") return "FOR REVIEW";
  if (status === "quote" || status === "needs quote") return "NEEDS QUOTE";
  if (status === "in production" || status === "production") return "IN PRODUCTION";
  if (status === "delivered" || status === "completed") return "DELIVERED";
  return "STATUS UPDATE";
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
        notes: typeof item.notes === "string" ? item.notes : "",
        customerName: typeof item.customerName === "string" ? item.customerName : "",
        customerContact: typeof item.customerContact === "string" ? item.customerContact : "",
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

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [activeProduct, setActiveProduct] = useState<Product>(PRODUCTS[0]);
  const [color, setColor] = useState("Sand");
  const [method, setMethod] = useState<Method>(PRODUCTS[0].tags[0]);
  const [sizeRun, setSizeRun] = useState<SizeRun>(EMPTY_SIZE_RUN);
  const [quantityOnly, setQuantityOnly] = useState(0);
  const [canvaLink, setCanvaLink] = useState("");
  const [artworkName, setArtworkName] = useState("");
  const [selectedArtworkFile, setSelectedArtworkFile] = useState<File | null>(null);
  const [artworkLater, setArtworkLater] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [previousReference, setPreviousReference] = useState("");
  const [neededDate, setNeededDate] = useState("");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
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
  const previousScreenRef = useRef<Screen>("home");
  const syncInquiriesInProgressRef = useRef(false);

  useEffect(() => {
    setInquiries(getStoredInquiries());
    setCustomerName(window.localStorage.getItem("customerName") || "");
    setCustomerContact(window.localStorage.getItem("customerContact") || "");
  }, []);
  useEffect(() => {
    const previousScreen = previousScreenRef.current;
    previousScreenRef.current = screen;

    if (screen === "myInquiries" && previousScreen !== "myInquiries") {
      void syncSavedInquiryStatuses();
    }
  }, [screen]);

  const isQuantityOnlyProduct = activeProduct.sizing === "quantity-only";
  const totalPieces = useMemo(() => isQuantityOnlyProduct ? quantityOnly : activeProduct.availableSizes.reduce((sum, size) => sum + sizeRun[size], 0), [activeProduct.availableSizes, isQuantityOnlyProduct, quantityOnly, sizeRun]);
  const canvaValid = !canvaLink.trim() || /^https?:\/\/(www\.)?canva\.com\/.+/i.test(canvaLink.trim());
  const requiredMoq = METHOD_MOQ[method];
  const remainingPieces = requiredMoq > totalPieces ? requiredMoq - totalPieces : 0;
  const moqNote = remainingPieces > 0
    ? `${method} requires at least ${requiredMoq} ${requiredMoq === 1 ? "piece" : "pieces"}. Add ${remainingPieces} more.`
    : `${method} minimum met.`;
  const moqMet = totalPieces >= requiredMoq;
  const hasArtworkPlan = Boolean(artworkName || canvaLink.trim() || artworkLater);
  const canSubmit = totalPieces > 0 && moqMet && canvaValid && hasArtworkPlan && Boolean(customerName.trim()) && Boolean(customerContact.trim()) && rightsConfirmed && !isSubmitting;
  const submitButtonText = isSubmitting ? submitStage === "uploading" ? "UPLOADING ARTWORK" : "SUBMITTING" : "SUBMIT INQUIRY";
  const messengerLink = `${MESSENGER_LINK}?text=${encodeURIComponent(`Hi TRRY, I want to ask about inquiry ${submittedInquiry?.ref || trackRef || ""}.`)}`;

  function resetFormForProduct(product: Product) {
    setActiveProduct(product);
    setColor("Sand");
    setMethod(product.tags[0]);
    setSizeRun(createSizeRunForProduct(product));
    setQuantityOnly(0);
    setCanvaLink("");
    setArtworkName("");
    setSelectedArtworkFile(null);
    setUploadStatus("idle");
    setUploadMessage("");
    setArtworkLater(false);
    setPreviousReference("");
    setNeededDate("");
    setNotes("");
    setRightsConfirmed(false);
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
    setSizeRun((current) => ({ ...current, [size]: Math.max(0, current[size] + delta) }));
  }

  function updateQuantityOnly(delta: number) {
    setQuantityOnly((current) => Math.max(0, current + delta));
  }
  function mergeServerInquiry(oldItem: Inquiry, freshInquiry: TrackedInquiry): Inquiry {
    return {
      ...oldItem,
      ...freshInquiry,
      ref: freshInquiry.id,
      createdAt: freshInquiry.submittedAt,
      productName: freshInquiry.product,
      totalPieces: parseTotalPiecesFromQuantity(freshInquiry.quantity) || oldItem.totalPieces,
      status: normalizeStatus(freshInquiry.statusLabel),
      statusKey: freshInquiry.statusKey,
      statusLabel: freshInquiry.statusLabel || "STATUS ERROR",
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
      else if (!customerName.trim() || !customerContact.trim()) setFormError("Name and contact are required near the end of the form.");
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
        notes: notes.trim(),
        customerName: customerName.trim(),
        customerContact: customerContact.trim(),
        rightsConfirmed,
        status: normalizeStatus(result.status),
        statusKey: normalizeStatus(result.status) === "FOR REVIEW" ? "new" : "submitted",
        statusLabel: normalizeStatus(result.status),
      };

      const nextList = [nextInquiry, ...savedInquiries].slice(0, 20);
      saveStoredInquiries(nextList);
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

      if (existing) {
        const refreshedLocalInquiry = mergeServerInquiry(existing, freshInquiry);
        const nextList = saved.map((item) => item.ref.toLowerCase() === refreshedLocalInquiry.ref.toLowerCase() ? refreshedLocalInquiry : item).slice(0, 20);
        saveStoredInquiries(nextList);
        setInquiries(nextList);
      }

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

  function ProductThumb({ product, large = false }: { product: Product; large?: boolean }) {
    return <div className={large ? "productThumb large" : "productThumb"}><span>{product.icon}</span></div>;
  }

  function renderHome() {
    return (
      <section className="screen homeScreen withNav" aria-labelledby="home-title">
        <div className="homeTop">
          <strong className="brandLockup">TRRY<span>*</span></strong>
          <span className="estTag">EST. 2013</span>
        </div>
        <div className="homeHero">
          <h1 id="home-title">CUSTOM APPAREL.<br />MADE SIMPLE.</h1>
          <p>Browse the catalog. No sign-in needed.</p>
        </div>
        <div className="homeChoices" aria-label="TRRY order categories">
          {["CUSTOM T-SHIRTS", "EMBROIDERY / CAPS", "UNIFORMS / BUSINESS ORDER"].map((label, index) => (
            <button className="choiceCard" key={label} onClick={openCatalog} type="button">
              <span className="choiceIcon">{index === 1 ? "CP" : index === 2 ? "UN" : "TS"}</span>
              <span><small>0{index + 1}</small><strong>{label}</strong></span>
            </button>
          ))}
        </div>
        <button className="limeCta" onClick={openCatalog} type="button">BROWSE CATALOG</button>
        <button className="textLink" onClick={() => { setTrackSearched(false); setTrackedInquiry(null); setScreen("myInquiries"); }} type="button">Track an existing inquiry</button>
        <BottomNav active="home" />
      </section>
    );
  }

  function renderCatalog() {
    return (
      <section className="screen catalogScreen withNav" aria-labelledby="catalog-title">
        <AppHeader backTo="home" />
        <div className="catalogIntro">
          <h1 id="catalog-title">CHOOSE YOUR PRODUCT.</h1>
          <p>Pick an item to start your order.</p>
        </div>
        <div className="catalogGrid">
          {PRODUCTS.map((product) => (
            <button className="productCard" key={product.id} onClick={() => openProduct(product)} type="button">
              <ProductThumb product={product} />
              <strong>{product.name}</strong>
              <span className="methodTags">{product.tags.map((tag) => <small key={tag}>{tag.replace(" Transfer", "")}</small>)}</span>
              <span className="priceLine">From {formatMoney(product.basePrice)}</span>
              <span className="blackCta">CUSTOMIZE</span>
            </button>
          ))}
        </div>
        <BottomNav active="catalog" />
      </section>
    );
  }

  function renderCustomize() {
    return (
      <section className="screen customizeScreen withNav" aria-labelledby="customize-title">
        <AppHeader backTo="catalog" />
        <form className="customizeForm" onSubmit={submitInquiry} noValidate>
          <section className="selectedProduct">
            <ProductThumb product={activeProduct} large />
            <div>
              <h1 id="customize-title">{activeProduct.name}</h1>
              <p>From {formatMoney(activeProduct.basePrice)}</p>
            </div>
          </section>

          <section className="formSection">
            <h2>COLOR</h2>
            <div className="swatches">{COLORS.map((item) => <button aria-label={item.name} className={color === item.name ? "selected" : ""} key={item.name} onClick={() => setColor(item.name)} style={{ background: item.value }} type="button" />)}</div>
          </section>

          <section className="formSection">
            <h2>PRINT METHOD</h2>
            <div className="methodCards">{activeProduct.tags.map((item) => <button className={method === item ? "selected" : ""} key={item} onClick={() => setMethod(item)} type="button"><strong>{item.toUpperCase()}</strong><small>{item === "DTF Transfer" ? "Full-color, detailed prints" : item === "Embroidery" ? "Stitched, premium finish" : "Best for bulk, bold colors"}</small></button>)}</div>
          </section>

          <section className="formSection">
            <h2>{isQuantityOnlyProduct ? "QUANTITY" : "SIZE RUN"}</h2>
            {isQuantityOnlyProduct ? <div className="quantityOnlyControl"><button onClick={() => updateQuantityOnly(-1)} type="button">-</button><strong>{quantityOnly}</strong><button onClick={() => updateQuantityOnly(1)} type="button">+</button></div> : <div className="sizeRunTable">{activeProduct.availableSizes.map((size) => <div className="sizeRunRow" key={size}><strong>{size}</strong><button onClick={() => updateSize(size, -1)} type="button">-</button><span>{sizeRun[size]}</span><button onClick={() => updateSize(size, 1)} type="button">+</button></div>)}</div>}
            <div className="totalPieces"><span>TOTAL PIECES</span><strong>{totalPieces}</strong></div>
            <p className={moqMet || totalPieces === 0 ? "moqNote" : "moqNote error"}>{moqNote}</p>
          </section>

          <section className="formSection artworkSection">
            <h2>UPLOAD DESIGN</h2>
            <label className="uploadDrop"><input accept=".png,.jpg,.jpeg,.pdf,.svg,.ai,.eps,.psd" onChange={(event) => handleUpload(event.target.files?.[0])} type="file" /><strong>{artworkName || "DROP YOUR FILE HERE"}</strong><small>Accepted: PNG, JPG, PDF, SVG, AI, EPS, PSD</small></label>
            {uploadStatus === "ready" ? <p className="uploadState good">Artwork ready for review.</p> : null}
            {uploadStatus === "error" ? <p className="uploadState bad">{uploadMessage}</p> : null}
            <label className="stackedField"><span>CANVA LINK OPTIONAL</span><input aria-invalid={!canvaValid} placeholder="https://canva.com/design/..." value={canvaLink} onChange={(event) => setCanvaLink(event.target.value)} /></label>
            <label className="rightsCheck"><input checked={artworkLater} onChange={(event) => setArtworkLater(event.target.checked)} type="checkbox" /> <span>I will send artwork after this inquiry.</span></label>
          </section>

          {method === "Embroidery" || activeProduct.referenceRequired ? (
            <section className="formSection pinkBox">
              <h2>PREVIOUS EMBROIDERY REFERENCE</h2>
              <p>Already embroidered before? Send the prior job name or reference so TRRY can check if digitizing is ready.</p>
              <input placeholder="Example: Polo logo batch 2025" value={previousReference} onChange={(event) => setPreviousReference(event.target.value)} />
              <p>New embroidery logos may need digitizing review before pricing is final.</p>
            </section>
          ) : null}

          <section className="formSection">
            <h2>NEEDED DATE</h2>
            <input value={neededDate} onChange={(event) => setNeededDate(event.target.value)} type="date" />
          </section>

          <section className="formSection">
            <h2>NOTES OPTIONAL</h2>
            <textarea placeholder="Placement, colors, deadline, etc." value={notes} onChange={(event) => setNotes(event.target.value)} />
          </section>

          <section className="formSection contactSection">
            <h2>CONTACT</h2>
            <input placeholder="Your full name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            <input placeholder="Phone number or Messenger" value={customerContact} onChange={(event) => setCustomerContact(event.target.value)} />
            <p>We'll use this to send your quote and production updates.</p>
          </section>

          <label className="rightsCheck"><input checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} type="checkbox" /> <span>I confirm I have the right to print this design.</span></label>
          {formError ? <p className="formError" role="alert">{formError}</p> : null}

          <div className="stickySubmit">
            <span>TOTAL: {totalPieces} {totalPieces === 1 ? "PC" : "PCS"}</span>
            <button className="limeCta" disabled={!canSubmit} type="submit">{submitButtonText}</button>
          </div>
        </form>
      </section>
    );
  }

  function renderSubmitted() {
    const current = submittedInquiry;
    return (
      <section className="screen submittedScreen withNav" aria-labelledby="submitted-title">
        <AppHeader />
        <h1 id="submitted-title">INQUIRY SENT!</h1>
        <p>We received your request. Our team will review it and send a quote.</p>
        <div className="receiptBox">
          <h2>TRRY INQUIRY RECEIPT</h2>
          <dl>
            <div><dt>REF NO.</dt><dd>{current?.ref}<button className="copyMini" onClick={() => current?.ref && navigator.clipboard?.writeText(current.ref)} type="button">COPY</button></dd></div>
            <div><dt>PRODUCT</dt><dd>{current?.productName}</dd></div>
            <div><dt>TOTAL PIECES</dt><dd>{current?.totalPieces}</dd></div>
            <div><dt>METHOD</dt><dd>{current?.method}</dd></div>
            <div><dt>STATUS</dt><dd><mark>{current?.statusLabel || "STATUS ERROR"}</mark></dd></div>
            <div><dt>ARTWORK</dt><dd>{getArtworkStateLabel(current)}</dd></div>
          </dl>
          <p>No quote before review.<br />No print without approval.</p>
        </div>
        {formError ? <p className="formError" role="alert">{formError}</p> : null}
        {current?.artworkSource === "upload" && current.artworkUploadStatus === "failed" ? <button className="outlineCta" disabled={retryingArtwork} onClick={retryArtworkUpload} type="button">{retryingArtwork ? "UPLOADING ARTWORK" : "RETRY ARTWORK UPLOAD"}</button> : null}
        <a className="blackButton" href={messengerLink} rel="noreferrer" target="_blank">CHAT WITH US ON MESSENGER</a>
        <TrackerCard />
        <button className="outlineCta" onClick={() => setScreen("myInquiries")} type="button">VIEW ALL INQUIRIES</button>
        <BottomNav active="myInquiries" />
      </section>
    );
  }

  function TrackerCard() {
    const steps = ["INQUIRY RECEIVED", "QUOTE AND REVIEW", "PROOF APPROVAL", "PRODUCTION", "PICKUP OR DELIVERY"];
    return <div className="trackerCard"><h2>TRACK YOUR ORDER <span>STEP 1/5</span></h2><div className="bar"><span /></div>{steps.map((step, index) => <p className={index === 0 ? "active" : ""} key={step}>{index + 1}. {step}</p>)}<small>No quote before review. No print without approval. Est. quote reply within 24 hrs.</small></div>;
  }

  function renderMyInquiries() {
    return (
      <section className="screen myInquiriesScreen withNav" aria-labelledby="my-inquiries-title">
        <AppHeader backTo="home" />
        <h1 id="my-inquiries-title">MY INQUIRIES.</h1>
        <p>Your submitted orders, by inquiry number.</p>
        <form className="trackForm" onSubmit={trackInquiry}>
          <label><span>INQUIRY NUMBER</span><input placeholder="TRRY-5921" value={trackRef} onChange={(event) => setTrackRef(event.target.value)} /></label>
          <label><span>CONTACT</span><input placeholder="Phone number or Messenger used in order" value={trackContact} onChange={(event) => setTrackContact(event.target.value)} /></label>
          <button className="limeCta" disabled={isTracking} type="submit">{isTracking ? "TRACKING" : "TRACK INQUIRY"}</button>
        </form>
        {isSyncingInquiries ? <p className="syncStatus">UPDATING INQUIRIES...</p> : null}
        {trackSearched ? trackedInquiry ? <div className="receiptBox"><h2>FOUND INQUIRY</h2><dl><div><dt>REF NO.</dt><dd>{trackedInquiry.id}</dd></div><div><dt>PRODUCT</dt><dd>{trackedInquiry.product}</dd></div><div><dt>QUANTITY</dt><dd>{trackedInquiry.quantity}</dd></div><div><dt>STATUS</dt><dd><mark>{trackedInquiry.statusLabel}</mark></dd></div><div><dt>ARTWORK</dt><dd>{trackedInquiry.artworkLabel}</dd></div></dl><p>TRRY will review your request before production.</p></div> : <div className="notFound"><p>No inquiry found. Check your reference number, or reach us directly.</p>{trackRef.trim() ? <a className="blackButton" href={`${MESSENGER_LINK}?text=${encodeURIComponent(`Hi TRRY, I need help finding inquiry ${trackRef.trim()}.`)}`} rel="noreferrer" target="_blank">CHAT WITH US ON MESSENGER</a> : null}</div> : null}
        <div className="inquiryList">
          {inquiries.length ? inquiries.map((item) => <button className="inquiryItem" key={item.ref} onClick={() => { setSubmittedInquiry(item); setScreen("submitted"); }} type="button"><strong>{item.ref}</strong><span>{item.productName} - {item.totalPieces} pcs</span><small>Submitted {formatCustomerDate(item.createdAt)}</small><small>{getArtworkStateLabel(item)}</small><mark>{item.statusLabel || "STATUS ERROR"}</mark></button>) : <p className="emptyState">No inquiries yet. Browse the catalog to start one.</p>}
        </div>
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