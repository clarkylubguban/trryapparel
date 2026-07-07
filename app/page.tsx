import ActionCard from "../components/ActionCard";
import BottomNav from "../components/BottomNav";
import Hero from "../components/Hero";

const actions = [
  {
    title: "Shop Statement Tees",
    helper: "Ready designs + daily drops",
    tone: "pink",
  },
  {
    title: "Customize a Shirt",
    helper: "Pick color + send design",
    tone: "yellow",
  },
  {
    title: "Send Canva Link",
    helper: "We clean and prepare your file",
    tone: "teal",
  },
  {
    title: "Uniform Inquiry",
    helper: "For teams and businesses",
    tone: "purple",
  },
  {
    title: "Track My Order",
    helper: "Check production status",
    tone: "cream",
  },
] as const;

export default function HomePage() {
  return (
    <main className="appShell">
      <header className="topbar" aria-label="TRRY Apparel header">
        <strong className="brandName">TRRY APPAREL</strong>
        <span className="headerTitle">Print Shop + Merch Counter</span>
        <span className="mvpBadge">MVP</span>
      </header>

      <section className="homeContent" aria-label="TRRY Apparel home">
        <Hero />

        <section className="actionSection" aria-labelledby="action-heading">
          <div className="sectionIntro">
            <span>Start here</span>
            <h2 id="action-heading">What do you want to make?</h2>
          </div>

          <div className="actionGrid">
            {actions.map((action) => (
              <ActionCard
                key={action.title}
                title={action.title}
                helper={action.helper}
                tone={action.tone}
              />
            ))}
          </div>
        </section>
      </section>

      <BottomNav />
    </main>
  );
}
