"use client";

import { useState } from "react";
import BottomNav from "./BottomNav";
import FlowSteps from "./FlowSteps";
import FormShell from "./FormShell";
import Header from "./Header";
import ProductCard from "./ProductCard";
import ServiceCard from "./ServiceCard";
import SubmitSuccess from "./SubmitSuccess";
import { products, services } from "../data/mockData";

const homeActions = [
  {
    screen: "shop",
    title: "Shop Statement Tees",
    hint: "Ready designs + daily drops",
    className: "primaryCta",
  },
  {
    screen: "customize",
    title: "Customize a Shirt",
    hint: "Pick color + send design",
  },
  {
    screen: "canva",
    title: "Send Canva Link",
    hint: "We clean and prepare your file",
  },
  {
    screen: "uniforms",
    title: "Uniform Inquiry",
    hint: "For teams and businesses",
  },
  {
    screen: "track",
    title: "Track My Order",
    hint: "Check production status",
  },
];

export default function PublicApp() {
  const [screen, setScreen] = useState("home");

  const navigate = (nextScreen) => {
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goSuccess = (event) => {
    event.preventDefault();
    navigate("success");
  };

  return (
    <main className="app">
      <Header />

      <section className="content">
        {screen === "home" && <Home onNavigate={navigate} />}
        {screen === "shop" && <Shop onRequest={() => navigate("customize")} />}
        {screen === "customize" && <CustomizeForm goSuccess={goSuccess} />}
        {screen === "canva" && <CanvaForm goSuccess={goSuccess} />}
        {screen === "uniforms" && <UniformForm goSuccess={goSuccess} />}
        {screen === "track" && <Track />}
        {screen === "success" && <SubmitSuccess onBackHome={() => navigate("home")} />}
      </section>

      <BottomNav activeScreen={screen} onNavigate={navigate} />
    </main>
  );
}

function Home({ onNavigate }) {
  return (
    <>
      <section className="hero">
        <p className="tag">TRRY Print Pop Brutalism</p>
        <h2>Customize Your Shirt. Send Your Design. We'll Make It Real.</h2>
        <p>
          Order statement tees, send your Canva link, or request uniforms from
          TRRY Apparel.
        </p>

        <div className="laneStrip" aria-label="TRRY lanes">
          <span>TRRY Services</span>
          <span>TRRY Merch</span>
        </div>

        <div className="ctaGrid">
          {homeActions.map((action) => (
            <button
              key={action.screen}
              className={action.className || ""}
              onClick={() => onNavigate(action.screen)}
              type="button"
            >
              <span className="ctaTitle">{action.title}</span>
              <span className="ctaHint">{action.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="sectionHead">
        <p className="eyebrow">TRRY Services</p>
        <h3 className="sectionTitle">Pick a print lane</h3>
      </div>

      <div className="serviceGrid">
        {services.map((service) => (
          <ServiceCard key={service.name} service={service} />
        ))}
      </div>
    </>
  );
}

function Shop({ onRequest }) {
  return (
    <>
      <div className="pageHead merchHead">
        <p className="eyebrow">TRRY Merch</p>
        <h2>Choose a tee, then request your order.</h2>
        <p>No payment yet. TRRY will confirm price, size, and schedule.</p>
      </div>

      <div className="productGrid">
        {products.map((product) => (
          <ProductCard key={product.name} product={product} onRequest={onRequest} />
        ))}
      </div>
    </>
  );
}

function CustomizeForm({ goSuccess }) {
  return (
    <FormShell
      title="Customize a Shirt"
      subtitle="Send your product details, design, and deadline."
      onSubmit={goSuccess}
      buttonText="Submit Request"
    >
      <input placeholder="Full name" required />
      <input placeholder="Contact number or Messenger name" required />
      <select required>
        <option value="">Product type</option>
        <option>T-shirt</option>
        <option>Oversize shirt</option>
        <option>Polo shirt</option>
        <option>Hoodie</option>
      </select>
      <input placeholder="Shirt color" />
      <select required>
        <option value="">Size</option>
        <option>XS</option>
        <option>S</option>
        <option>M</option>
        <option>L</option>
        <option>XL</option>
        <option>XXL</option>
      </select>
      <input type="number" placeholder="Quantity" min="1" required />
      <select required>
        <option value="">Print type</option>
        <option>DTF</option>
        <option>Embroidery</option>
        <option>Screen Print</option>
      </select>
      <input type="file" />
      <input placeholder="Canva link, optional" />
      <textarea placeholder="Notes" />
      <input type="date" />
    </FormShell>
  );
}

function CanvaForm({ goSuccess }) {
  return (
    <FormShell
      title="Send Canva Link"
      subtitle="Paste your Canva link and tell us what product it is for."
      onSubmit={goSuccess}
      buttonText="Submit Canva Link"
    >
      <input placeholder="Full name" required />
      <input placeholder="Contact number" required />
      <input placeholder="Canva link" required />
      <input placeholder="What product is this for?" required />
      <input type="number" placeholder="Quantity" min="1" required />
      <textarea placeholder="Notes" />
    </FormShell>
  );
}

function UniformForm({ goSuccess }) {
  return (
    <FormShell
      title="Uniform Inquiry"
      subtitle="For companies, teams, schools, shops, and organizations."
      onSubmit={goSuccess}
      buttonText="Submit Inquiry"
    >
      <input placeholder="Company / business name" required />
      <input placeholder="Contact person" required />
      <input placeholder="Contact number" required />
      <input placeholder="Type of uniform" />
      <input type="number" placeholder="Quantity estimate" min="1" />
      <input placeholder="Logo placement" />
      <select>
        <option>Preferred service</option>
        <option>Embroidery</option>
        <option>DTF</option>
        <option>Screen Print</option>
      </select>
      <input type="date" />
      <textarea placeholder="Notes" />
    </FormShell>
  );
}

function Track() {
  return (
    <div className="formCard trackCard">
      <p className="eyebrow">Order Tracking</p>
      <h2>Track My Order</h2>
      <p>
        Order tracking is coming soon. For now, message TRRY Apparel for updates.
      </p>
      <FlowSteps steps={["Approved Design", "Production", "Reorder Ready"]} />
      <input placeholder="Order code or contact number" />
      <button className="submitBtn" type="button">
        Contact TRRY
      </button>
    </div>
  );
}
