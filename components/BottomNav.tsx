"use client";

export type NavKey = "home" | "shop" | "customize" | "uniforms" | "track";

type NavItem = {
  key: NavKey;
  label: string;
};

const navItems: NavItem[] = [
  { key: "home", label: "Home" },
  { key: "shop", label: "Shop" },
  { key: "customize", label: "Customize" },
  { key: "uniforms", label: "Uniforms" },
  { key: "track", label: "Track" },
];

type BottomNavProps = {
  active: NavKey;
  onNavigate: (screen: NavKey) => void;
};

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottomNav" aria-label="Primary navigation">
      {navItems.map((item) => (
        <button
          aria-current={active === item.key ? "page" : undefined}
          className={active === item.key ? "active" : ""}
          key={item.key}
          onClick={() => onNavigate(item.key)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
