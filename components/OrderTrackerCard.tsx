"use client";

import { useState } from "react";

type TimelineItem = {
  marker: "done" | "active" | "open";
  label: string;
  date?: string;
};

const timeline: TimelineItem[] = [
  { marker: "done", label: "DESIGN APPROVED", date: "Jul 03" },
  { marker: "done", label: "DTF TRANSFER PRINTED", date: "Jul 06" },
  { marker: "active", label: "HEAT PRESSING NOW" },
  { marker: "open", label: "QUALITY CHECK" },
  { marker: "open", label: "READY FOR PICKUP" },
];

const totalSteps = 12;
const currentStep = 7;

export default function OrderTrackerCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="orderTrackerShell" aria-labelledby="order-tracker-title">
      <button
        aria-controls="order-tracker-timeline"
        aria-expanded={isOpen}
        className="orderTrackerCard"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span className="trackerTopline">
          <span className="trackerTitle" id="order-tracker-title">ASA NA IMONG ORDER?</span>
          <span className={`trackerArrow${isOpen ? " open" : ""}`} aria-hidden="true">v</span>
        </span>

        <span className="trackerMeta">
          <strong>#TRRY-0142</strong>
          <span>JUL 07</span>
        </span>

        <span className="trackerDivider" aria-hidden="true" />

        <span className="trackerStatus">STEP 7/12: PRINTING</span>

        <span className="trackerBlocks" aria-label={`${currentStep} of ${totalSteps} production steps complete`}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <span className={index < currentStep ? "filled" : ""} key={index} />
          ))}
        </span>

        {isOpen ? <span className="trackerDivider" aria-hidden="true" /> : null}

        <span className={`trackerTimeline${isOpen ? " open" : ""}`} id="order-tracker-timeline">
          {timeline.map((item) => (
            <span className={`timelineItem ${item.marker}`} key={item.label}>
              <span aria-hidden="true">
                {item.marker === "done" ? "OK" : item.marker === "active" ? ">" : "o"}
              </span>
              <span>
                {item.label}
                {item.date ? <em> - {item.date}</em> : null}
              </span>
            </span>
          ))}
        </span>
      </button>
    </section>
  );
}
