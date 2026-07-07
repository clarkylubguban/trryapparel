export default function ProductCard({ product, onRequest }) {
  const colors = product.colors.split(" / ");

  return (
    <article className="productCard">
      <div className="productVisual">
        <div className="shirtMockup">TEE</div>
        <strong className="priceBadge">{product.price}</strong>
      </div>

      <div className="productCopy">
        <span className="cardBadge">{product.badge}</span>
        <h3>{product.name}</h3>
        <p>Can be customized after request confirmation.</p>
      </div>

      <div className="chipGroup" aria-label={`Color options: ${product.colors}`}>
        {colors.map((color) => (
          <span key={color}>{color}</span>
        ))}
      </div>

      <div className="productFooter">
        <strong>{product.price}</strong>
        <button onClick={onRequest} type="button">
          Customize This
        </button>
      </div>
    </article>
  );
}
