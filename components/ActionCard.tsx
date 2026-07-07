type ActionCardProps = {
  title: string;
  helper: string;
  tone: "pink" | "yellow" | "teal" | "purple" | "cream";
};

export default function ActionCard({ title, helper, tone }: ActionCardProps) {
  return (
    <button className={`actionCard ${tone}`} type="button">
      <span>{title}</span>
      <small>{helper}</small>
    </button>
  );
}
