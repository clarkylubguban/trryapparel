export default function ServiceCard({ service }) {
  return (
    <article className="serviceCard">
      <div className="serviceTopline">
        <span>{service.code}</span>
        <strong>{service.badge}</strong>
      </div>
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <div className="serviceMeta">
        <small>Start: Request quote</small>
        <small>Send: {service.start}</small>
      </div>
      <button className="miniAction" type="button">
        Send Design
      </button>
    </article>
  );
}
