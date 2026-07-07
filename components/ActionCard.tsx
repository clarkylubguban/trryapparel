"use client";

type ActionCardProps = {
  title: string;
  helper: string;
  tone: "pink" | "yellow" | "teal" | "purple" | "cream";
  onClick?: () => void;
};

export default function ActionCard({ title, helper, tone, onClick }: ActionCardProps) {
  return (
    <button className={`actionCard ${tone}`} onClick={onClick} type="button">
      <span>{title}</span>
      <small>{helper}</small>
    </button>
  );
}
