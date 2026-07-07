export default function SubmitSuccess({ onBackHome }) {
  return (
    <div className="successCard">
      <div className="check">OK</div>
      <p className="eyebrow">Request Quote</p>
      <h2>Request received.</h2>
      <p>
        TRRY Apparel will review your details and confirm the price, design, and
        production schedule.
      </p>
      <button onClick={onBackHome} type="button">
        Back to Home
      </button>
    </div>
  );
}
