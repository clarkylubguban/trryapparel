const navItems = ["Home", "Shop", "Customize", "Uniforms", "Track"];

export default function BottomNav() {
  return (
    <nav className="bottomNav" aria-label="Primary navigation preview">
      {navItems.map((item) => (
        <button className={item === "Home" ? "active" : ""} key={item} type="button">
          {item}
        </button>
      ))}
    </nav>
  );
}
