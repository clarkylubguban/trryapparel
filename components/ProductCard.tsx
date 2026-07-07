"use client";

type ProductCardProps = {
  name: string;
  description: string;
  price: string;
  tone: "pink" | "yellow" | "teal" | "purple";
  actionLabel: string;
  onAction: () => void;
};

export default function ProductCard({
  name,
  description,
  price,
  tone,
  actionLabel,
  onAction,
}: ProductCardProps) {
  return (
    <article className={`productCard ${tone}`}>
      <div className="productVisual" aria-hidden="true">
        <span>{name.split(" ")[0]}</span>
      </div>
      <div className="productCopy">
        <div className="priceBadge">{price}</div>
        <h3>{name}</h3>
        <p>{description}</p>
      </div>
      <button className="cardButton" onClick={onAction} type="button">
        {actionLabel}
      </button>
    </article>
  );
}
