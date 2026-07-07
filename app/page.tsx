"use client";

import { useCallback, useMemo, useState } from "react";
import ActionCard from "../components/ActionCard";
import BottomNav, { type NavKey } from "../components/BottomNav";
import ConfirmationCard from "../components/ConfirmationCard";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import RequestForm, { type FieldConfig, type RequestFormValues } from "../components/RequestForm";
import TrackRequest from "../components/TrackRequest";
import {
  REQUEST_STORAGE_KEY,
  buildSummary,
  createRequestId,
  type RequestKind,
  type StoredRequest,
} from "../lib/requests";

type Screen = NavKey | "canva" | "confirmation";

type HomeAction = {
  title: string;
  helper: string;
  tone: "pink" | "yellow" | "teal" | "purple" | "cream";
  screen: Screen;
};

type Product = {
  name: string;
  description: string;
  price: string;
  tone: "pink" | "yellow" | "teal" | "purple";
  actionLabel: string;
  target: Screen;
};

const actions: HomeAction[] = [
  {
    title: "Shop Statement Tees",
    helper: "Ready designs + daily drops",
    tone: "pink",
    screen: "shop",
  },
  {
    title: "Customize a Shirt",
    helper: "Pick color + send design",
    tone: "yellow",
    screen: "customize",
  },
  {
    title: "Send Canva Link",
    helper: "We clean and prepare your file",
    tone: "teal",
    screen: "canva",
  },
  {
    title: "Uniform Inquiry",
    helper: "For teams and businesses",
    tone: "purple",
    screen: "uniforms",
  },
  {
    title: "Track My Order",
    helper: "Check production status",
    tone: "cream",
    screen: "track",
  },
];

const products: Product[] = [
  {
    name: "Statement Tee",
    description: "Ready slogan shirts for everyday drops and quick gifts.",
    price: "Starts at quote",
    tone: "pink",
    actionLabel: "Customize This",
    target: "customize",
  },
  {
    name: "Basic Top",
    description: "Simple blank-style tops for clean prints and logo work.",
    price: "Ask for quote",
    tone: "yellow",
    actionLabel: "Pick Color",
    target: "customize",
  },
  {
    name: "Custom Shirt",
    description: "Send your idea, slogan, Canva file, or print notes.",
    price: "Ask for quote",
    tone: "teal",
    actionLabel: "Send Design",
    target: "canva",
  },
  {
    name: "Uniform Starter",
    description: "Company, team, school, and group order inquiries.",
    price: "Request quote",
    tone: "purple",
    actionLabel: "Request Quote",
    target: "uniforms",
  },
];

const customizeFields: FieldConfig[] = [
  { name: "customerName", label: "Customer name", required: true, placeholder: "Your full name" },
  { name: "contact", label: "Contact number or Messenger name", required: true, placeholder: "Phone or Messenger" },
  { name: "shirtColor", label: "Shirt color", required: true, placeholder: "Black, white, pink..." },
  { name: "size", label: "Size", required: true, options: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
  { name: "quantity", label: "Quantity", type: "number", required: true, placeholder: "1" },
  { name: "customizationType", label: "Customization type", required: true, options: ["Print", "Embroidery", "Print + Embroidery"] },
  { name: "designNotes", label: "Design notes", textarea: true, placeholder: "Tell us the slogan, logo placement, or design idea." },
  { name: "deadline", label: "Deadline or needed date", type: "date", required: true },
];

const canvaFields: FieldConfig[] = [
  { name: "customerName", label: "Customer name", required: true, placeholder: "Your full name" },
  { name: "contact", label: "Contact number or Messenger name", required: true, placeholder: "Phone or Messenger" },
  { name: "canvaLink", label: "Canva link", type: "url", required: true, placeholder: "https://www.canva.com/..." },
  { name: "productType", label: "Product type", required: true, options: ["Shirt", "Uniform", "Tote", "Cap", "Other"] },
  { name: "notes", label: "Notes", textarea: true, placeholder: "Any sizing, print, or file prep notes?" },
  { name: "deadline", label: "Deadline or needed date", type: "date", required: true },
];

const uniformFields: FieldConfig[] = [
  { name: "businessName", label: "Business or team name", required: true, placeholder: "Company, team, or group" },
  { name: "contactPerson", label: "Contact person", required: true, placeholder: "Who should TRRY message?" },
  { name: "contact", label: "Contact number", required: true, placeholder: "Phone or Messenger" },
  { name: "quantity", label: "Estimated quantity", type: "number", required: true, placeholder: "20" },
  { name: "serviceNeeded", label: "Service needed", required: true, options: ["DTF", "Embroidery", "Screen Print", "Full Uniform Package"] },
  { name: "deadline", label: "Deadline or needed date", type: "date", required: true },
  { name: "notes", label: "Notes", textarea: true, placeholder: "Logo placement, shirt style, fabric, or delivery notes." },
];

function getActiveNav(screen: Screen, confirmation?: StoredRequest | null): NavKey {
  if (screen === "canva") {
    return "customize";
  }

  if (screen === "confirmation") {
    if (confirmation?.type === "Uniform Inquiry") {
      return "uniforms";
    }

    return "customize";
  }

  return screen;
}

function getRequestTarget(request?: StoredRequest | null): Screen {
  if (request?.type === "Uniform Inquiry") {
    return "uniforms";
  }

  if (request?.type === "Canva Link") {
    return "canva";
  }

  return "customize";
}

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [confirmation, setConfirmation] = useState<StoredRequest | null>(null);
  const [trackQuery, setTrackQuery] = useState("");
  const [cartNotice, setCartNotice] = useState(false);

  const loadRequests = useCallback((): StoredRequest[] => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const savedRequests = window.localStorage.getItem(REQUEST_STORAGE_KEY);
      return savedRequests ? (JSON.parse(savedRequests) as StoredRequest[]) : [];
    } catch {
      return [];
    }
  }, []);

  const activeNav = useMemo(() => getActiveNav(screen, confirmation), [screen, confirmation]);

  function navigate(nextScreen: Screen) {
    if (nextScreen !== "track") {
      setTrackQuery("");
    }
    setCartNotice(false);
    setScreen(nextScreen);
  }

  function showCartNotice() {
    setCartNotice(true);
    window.setTimeout(() => setCartNotice(false), 2200);
  }

  function submitRequest(
    type: RequestKind,
    values: RequestFormValues,
    fields: FieldConfig[],
  ) {
    const existingRequests = loadRequests();
    const details = fields.reduce<Record<string, string>>((nextDetails, field) => {
      nextDetails[field.label] = values[field.name] ?? "";
      return nextDetails;
    }, {});

    const request: StoredRequest = {
      id: createRequestId(existingRequests),
      type,
      customerName: values.customerName || values.businessName || values.contactPerson || "TRRY Customer",
      contact: values.contact || "Not provided",
      status: "Pending TRRY Review",
      submittedAt: new Date().toISOString(),
      details,
      summary: buildSummary(details),
    };

    window.localStorage.setItem(
      REQUEST_STORAGE_KEY,
      JSON.stringify([...existingRequests, request]),
    );
    setConfirmation(request);
    setTrackQuery(request.id);
    setScreen("confirmation");
  }

  function renderHome() {
    return (
      <>
        <Hero />

        <section className="actionSection" aria-labelledby="action-heading">
          <div className="sectionIntro">
            <span>Start here</span>
            <h2 id="action-heading">What do you want to make?</h2>
          </div>

          <div className="actionGrid">
            {actions.map((action) => (
              <ActionCard
                helper={action.helper}
                key={action.title}
                onClick={() => navigate(action.screen)}
                title={action.title}
                tone={action.tone}
              />
            ))}
          </div>
        </section>
      </>
    );
  }

  function renderShop() {
    return (
      <section className="screenStack" aria-labelledby="shop-title">
        <div className="screenHeader shopAccent">
          <span>WALK-IN READY</span>
          <h1 id="shop-title">Shop TRRY Merch</h1>
          <p>Pick a starter item, then send the details for review and pricing.</p>
        </div>

        <div className="productGrid">
          {products.map((product) => (
            <ProductCard
              actionLabel={product.actionLabel}
              description={product.description}
              key={product.name}
              name={product.name}
              onAction={() => navigate(product.target)}
              price={product.price}
              tone={product.tone}
            />
          ))}
        </div>
      </section>
    );
  }

  function renderCustomize() {
    return (
      <section className="screenStack">
        <div className="flowStrip" aria-label="TRRY order flow">
          <span>Send Design</span>
          <span>Get Quote</span>
          <span>Confirm Order</span>
          <span>Production</span>
        </div>
        <RequestForm
          description="Tell TRRY what shirt, color, size, and print style you want. This creates a pending review request only."
          fields={customizeFields}
          kicker="CUSTOMIZE THIS"
          onSubmit={(values) => submitRequest("Custom Shirt", values, customizeFields)}
          submitLabel="Submit Custom Request"
          title="Customize a Shirt"
          tone="yellow"
        />
        <button className="inlineSwitch" onClick={() => navigate("canva")} type="button">
          Already have a Canva link? Send it here.
        </button>
      </section>
    );
  }

  function renderCanva() {
    return (
      <section className="screenStack">
        <div className="flowStrip tealFlow" aria-label="TRRY Canva flow">
          <span>Send Link</span>
          <span>File Check</span>
          <span>Quote</span>
          <span>Approval</span>
        </div>
        <RequestForm
          description="Paste your Canva link so TRRY can check the file and prepare it for quote approval."
          fields={canvaFields}
          kicker="SEND DESIGN"
          onSubmit={(values) => submitRequest("Canva Link", values, canvaFields)}
          submitLabel="Send Canva Link"
          title="Send Canva Link"
          tone="teal"
        />
      </section>
    );
  }

  function renderUniforms() {
    return (
      <section className="screenStack">
        <div className="flowStrip purpleFlow" aria-label="TRRY uniform inquiry flow">
          <span>Request Quote</span>
          <span>Logo Check</span>
          <span>Approve</span>
          <span>Produce</span>
        </div>
        <RequestForm
          description="Share your group order details so TRRY can review quantity, service, logo placement, and timeline."
          fields={uniformFields}
          kicker="UNIFORM PACKAGE"
          onSubmit={(values) => submitRequest("Uniform Inquiry", values, uniformFields)}
          submitLabel="Submit Uniform Inquiry"
          title="Uniform Inquiry"
          tone="purple"
        />
      </section>
    );
  }

  function renderConfirmation() {
    if (!confirmation) {
      return renderHome();
    }

    return (
      <ConfirmationCard
        onCreateAnother={() => navigate(getRequestTarget(confirmation))}
        onHome={() => navigate("home")}
        onTrack={() => navigate("track")}
        request={confirmation}
      />
    );
  }

  function renderScreen() {
    if (screen === "shop") {
      return renderShop();
    }

    if (screen === "customize") {
      return renderCustomize();
    }

    if (screen === "canva") {
      return renderCanva();
    }

    if (screen === "uniforms") {
      return renderUniforms();
    }

    if (screen === "track") {
      return <TrackRequest initialQuery={trackQuery} loadRequests={loadRequests} />;
    }

    if (screen === "confirmation") {
      return renderConfirmation();
    }

    return renderHome();
  }

  return (
    <main className="appShell">
      <header className="topbar" aria-label="TRRY Apparel header">
        <strong className="brandName">TRRY APPAREL</strong>
        <div className="headerActions" aria-label="Customer actions">
          <button className="iconButton profileButton" onClick={() => navigate("track")} type="button" aria-label="Open request tracking" title="Track requests">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.7-4.2 4.4-6 8-6s6.3 1.8 8 6" />
            </svg>
          </button>
          <button className="iconButton cartButton" onClick={showCartNotice} type="button" aria-label="Cart coming soon" title="Cart coming soon">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M6 6h15l-2 8H8L6 3H3" />
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
            </svg>
          </button>
        </div>
      </header>
      {cartNotice ? <div className="headerNotice" role="status">Cart coming soon</div> : null}

      <section className={screen === "home" ? "homeContent" : "screenContent"}>
        {renderScreen()}
      </section>

      <BottomNav active={activeNav} onNavigate={navigate} />
    </main>
  );
}


