import FlowSteps from "./FlowSteps";

export default function FormShell({ title, subtitle, children, onSubmit, buttonText }) {
  return (
    <form className="formCard" onSubmit={onSubmit}>
      <p className="eyebrow">TRRY Request Form</p>
      <h2>{title}</h2>
      <p>{subtitle}</p>

      <FlowSteps />

      <div className="formGrid">{children}</div>

      <button className="submitBtn" type="submit">
        {buttonText}
      </button>
    </form>
  );
}
