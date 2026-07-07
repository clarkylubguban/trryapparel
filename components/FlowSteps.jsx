import { orderSteps } from "../data/mockData";

export default function FlowSteps({ steps = orderSteps }) {
  return (
    <div className="flowSteps" aria-label="Order flow">
      {steps.map((step) => (
        <span key={step}>{step}</span>
      ))}
    </div>
  );
}
