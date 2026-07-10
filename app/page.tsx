"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type Screen = "home" | "catalog" | "customize" | "submitted" | "myInquiries" | "trackInquiry";
type Method = "DTF Transfer" | "Embroidery" | "Screen Print";
type SizeKey = "XS" | "S" | "M" | "L" | "XL" | "2XL";
type UploadStatus = "idle" | "ready" | "error";

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
};

type Inquiry = {
  ref: string;
  createdAt: string;
  productId: string;
  productName: string;
  basePrice: number;
  method: Method;
  color: string;
  sizeRun: SizeRun;
  totalPieces: number;
  canvaLink: string;
  artworkName: string;
  previousReference: string;
  neededDate: string;
  notes: string;
  customerName: string;
  customerContact: string;
  rightsConfirmed: boolean;
  status: "FOR_REVIEW" | "IN_PRODUCTION" | "DELIVERED";
};

const PRODUCTS: Product[] = [
  { id: "premium-cotton-shirt", name: "Premium Cotton Shirt", description: "Soft daily shirt for prints and slogans.", basePrice: 280, icon: "TS", tags: ["DTF Transfer", "Screen Print"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], moq: { minimum: 1, note: "Minimum order: 1 piece." } },
  { id: "caps", name: "Caps", description: "Logo caps for crews and teams.", basePrice: 180, icon: "CP", tags: ["Embroidery"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], moq: { minimum: 12, note: "Minimum order: 12 pieces for embroidery." }, referenceRequired: true },
  { id: "boxy-crop-shirt", name: "Boxy Crop Shirt", description: "Boxy fit merch shirt.", basePrice: 300, icon: "BX", tags: ["DTF Transfer"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], moq: { minimum: 1, note: "Minimum order: 1 piece." } },
  { id: "polo-uniform", name: "Polo Uniform", description: "Business polo with logo placement.", basePrice: 350, icon: "PL", tags: ["Embroidery", "DTF Transfer"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], moq: { minimum: 12, note: "Minimum order: 12 pieces for embroidery." }, referenceRequired: true },
  { id: "tote-bag", name: "Tote Bag", description: "Reusable merch and event bag.", basePrice: 220, icon: "TB", tags: ["DTF Transfer", "Screen Print"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], moq: { minimum: 1, note: "Minimum order: 1 piece." } },
  { id: "towels", name: "Towels", description: "Premium giveaway or team towels.", basePrice: 200, icon: "TW", tags: ["Embroidery"], availableSizes: ["XS", "S", "M", "L", "XL", "2XL"], moq: { minimum: 12, note: "Minimum order: 12 pieces for embroidery." }, referenceRequired: true },
];

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
  return `₱${value.toFixed(2)}`;
}

function makeRef() {
  return `TRRY-${Math.floor(1000 + Math.random() * 9000)}`;
}

function todayLabel() {
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(new Date());
}

function cleanPhone(value: string) {
  return value.trim().toLowerCase();
}

function getStoredInquiries(): Inquiry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
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
  const [canvaLink, setCanvaLink] = useState("");
  const [artworkName, setArtworkName] = useState("");
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
  const [submittedInquiry, setSubmittedInquiry] = useState<Inquiry | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [trackRef, setTrackRef] = useState("");
  const [trackContact, setTrackContact] = useState("");
  const [trackSearched, setTrackSearched] = useState(false);

  useEffect(() => {
    setInquiries(getStoredInquiries());
    setCustomerName(window.localStorage.getItem("customerName") || "");
    setCustomerContact(window.localStorage.getItem("customerContact") || "");
  }, []);

  const totalPieces = useMemo(() => activeProduct.availableSizes.reduce((sum, size) => sum + sizeRun[size], 0), [activeProduct.availableSizes, sizeRun]);
  const canvaValid = !canvaLink.trim() || /^https?:\/\/(www\.)?canva\.com\/.+/i.test(canvaLink.trim());
  const moqMet = totalPieces >= activeProduct.moq.minimum;
  const canSubmit = totalPieces > 0 && moqMet && canvaValid && Boolean(customerName.trim()) && Boolean(customerContact.trim()) && rightsConfirmed && !isSubmitting;
  const matchedInquiry = inquiries.find((item) => item.ref.toLowerCase() === trackRef.trim().toLowerCase() && cleanPhone(item.customerContact) === cleanPhone(trackContact));

  function resetFormForProduct(product: Product) {
    setActiveProduct(product);
    setColor("Sand");
    setMethod(product.tags[0]);
    setSizeRun(createSizeRunForProduct(product));
    setCanvaLink("");
    setArtworkName("");
    setUploadStatus("idle");
    setUploadMessage("");
    setPreviousReference("");
    setNeededDate("");
    setNotes("");
    setRightsConfirmed(false);
    setFormError("");
    setIsSubmitting(false);
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

  function handleUpload(file: File | undefined) {
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "application/pdf", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setArtworkName("");
      setUploadStatus("error");
      setUploadMessage("File format not supported. Upload PNG, JPG, PDF, or SVG.");
      return;
    }
    setArtworkName(file.name);
    setUploadStatus("ready");
    setUploadMessage("Artwork saved locally for inquiry preview.");
  }

  function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      if (!totalPieces) setFormError("Add at least one size quantity before submitting.");
      else if (!moqMet) setFormError(activeProduct.moq.note);
      else if (!canvaValid) setFormError("Canva link must be a valid canva.com link.");
      else if (!customerName.trim() || !customerContact.trim()) setFormError("Name and contact are required near the end of the form.");
      else if (!rightsConfirmed) setFormError("Confirm that you own or are allowed to use the artwork.");
      return;
    }

    setIsSubmitting(true);
    window.localStorage.setItem("customerName", customerName.trim());
    window.localStorage.setItem("customerContact", customerContact.trim());

    const nextInquiry: Inquiry = {
      ref: makeRef(),
      createdAt: todayLabel(),
      productId: activeProduct.id,
      productName: activeProduct.name,
      basePrice: activeProduct.basePrice,
      method,
      color,
      sizeRun,
      totalPieces,
      canvaLink: canvaLink.trim(),
      artworkName,
      previousReference: previousReference.trim(),
      neededDate,
      notes: notes.trim(),
      customerName: customerName.trim(),
      customerContact: customerContact.trim(),
      rightsConfirmed,
      status: "FOR_REVIEW",
    };

    const nextList = [nextInquiry, ...getStoredInquiries()].slice(0, 20);
    saveStoredInquiries(nextList);
    setInquiries(nextList);
    setSubmittedInquiry(nextInquiry);
    setTrackRef(nextInquiry.ref);
    setTrackContact(nextInquiry.customerContact);
    setFormError("");
    setIsSubmitting(false);
    setScreen("submitted");
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
        <button className="textLink" onClick={() => setScreen("trackInquiry")} type="button">Track an existing inquiry</button>
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
              <span>NACI</span>
              <strong>TRRY</strong>
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
            <h2>SIZE RUN</h2>
            <div className="sizeRunTable">{activeProduct.availableSizes.map((size) => <div className="sizeRunRow" key={size}><strong>{size}</strong><button onClick={() => updateSize(size, -1)} type="button">-</button><span>{sizeRun[size]}</span><button onClick={() => updateSize(size, 1)} type="button">+</button></div>)}</div>
            <div className="totalPieces"><span>TOTAL PIECES</span><strong>{totalPieces}</strong></div>
            <p className={moqMet || totalPieces === 0 ? "moqNote" : "moqNote error"}>{activeProduct.moq.note}</p>
          </section>

          <section className="formSection artworkSection">
            <h2>UPLOAD DESIGN</h2>
            <label className="uploadDrop"><input accept=".png,.jpg,.jpeg,.pdf,.svg" onChange={(event) => handleUpload(event.target.files?.[0])} type="file" /><strong>{artworkName || "DROP YOUR FILE HERE"}</strong><small>Accepted: PNG, JPG, PDF, SVG</small></label>
            {uploadStatus === "ready" ? <p className="uploadState good">Artwork ready for review.</p> : null}
            {uploadStatus === "error" ? <p className="uploadState bad">{uploadMessage}</p> : null}
            <label className="stackedField"><span>CANVA LINK OPTIONAL</span><input aria-invalid={!canvaValid} placeholder="https://canva.com/design/..." value={canvaLink} onChange={(event) => setCanvaLink(event.target.value)} /></label>
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
            <span>TOTAL: {totalPieces} PCS</span>
            <button className="limeCta" disabled={!canSubmit} type="submit">{isSubmitting ? "SUBMITTING" : "SUBMIT INQUIRY"}</button>
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
            <div><dt>STATUS</dt><dd><mark>For Review</mark></dd></div>
          </dl>
          <p>No quote before review.<br />No print without approval.</p>
        </div>
        <a className="blackButton" href={MESSENGER_LINK} rel="noreferrer" target="_blank">CHAT WITH US ON MESSENGER</a>
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
        <button className="outlineCta" onClick={() => setScreen("trackInquiry")} type="button">TRACK AN INQUIRY</button>
        <div className="inquiryList">
          {inquiries.length ? inquiries.map((item) => <button className="inquiryItem" key={item.ref} onClick={() => { setSubmittedInquiry(item); setScreen("submitted"); }} type="button"><strong>{item.ref}</strong><span>{item.productName} - {item.totalPieces} pcs</span><small>Submitted {item.createdAt}</small><mark>{item.status === "FOR_REVIEW" ? "FOR REVIEW" : item.status.replace("_", " ")}</mark></button>) : <p className="emptyState">No inquiries yet. Browse the catalog to start one.</p>}
        </div>
        <BottomNav active="myInquiries" />
      </section>
    );
  }

  function renderTrackInquiry() {
    return (
      <section className="screen trackInquiryScreen" aria-labelledby="track-title">
        <AppHeader backTo="home" />
        <h1 id="track-title">TRACK YOUR INQUIRY.</h1>
        <p>Enter your inquiry number and contact to check its status.</p>
        <form className="trackForm" onSubmit={(event) => { event.preventDefault(); setTrackSearched(true); }}>
          <label><span>INQUIRY NUMBER</span><input placeholder="TRRY-5921" value={trackRef} onChange={(event) => setTrackRef(event.target.value)} /></label>
          <label><span>CONTACT</span><input placeholder="Phone number or Messenger used in order" value={trackContact} onChange={(event) => setTrackContact(event.target.value)} /></label>
          <button className="limeCta" type="submit">TRACK INQUIRY</button>
        </form>
        {trackSearched ? matchedInquiry ? <div className="receiptBox"><h2>FOUND INQUIRY</h2><dl><div><dt>REF NO.</dt><dd>{matchedInquiry.ref}</dd></div><div><dt>PRODUCT</dt><dd>{matchedInquiry.productName}</dd></div><div><dt>STATUS</dt><dd><mark>For Review</mark></dd></div></dl><p>TRRY will review your request before production.</p></div> : <div className="notFound"><p>No inquiry found. Check your reference number, or reach us directly.</p><a className="blackButton" href={MESSENGER_LINK} rel="noreferrer" target="_blank">CHAT WITH US ON MESSENGER</a></div> : null}
        <button className="textLink" onClick={() => setScreen("home")} type="button">Back to Home</button>
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
      {screen === "trackInquiry" ? renderTrackInquiry() : null}
    </main>
  );
}


