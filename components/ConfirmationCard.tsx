"use client";

import type { StoredRequest } from "../lib/requests";

type ConfirmationCardProps = {
  request: StoredRequest;
  onTrack: () => void;
  onCreateAnother: () => void;
  onHome: () => void;
};

export default function ConfirmationCard({
  request,
  onTrack,
  onCreateAnother,
  onHome,
}: ConfirmationCardProps) {
  return (
    <section className="confirmationCard" aria-labelledby="confirmation-title">
      <span className="statusBadge">Pending TRRY Review</span>
      <h2 id="confirmation-title">Request received.</h2>
      <p>
        TRRY will review your request before production. No confirmed order, don't print.
      </p>
      <div className="requestIdBox">
        <small>Your demo request ID</small>
        <strong>{request.id}</strong>
      </div>
      <div className="confirmationActions">
        <button className="submitButton" onClick={onTrack} type="button">
          Track This Request
        </button>
        <button className="secondaryButton" onClick={onCreateAnother} type="button">
          Create Another Request
        </button>
        <button className="plainButton" onClick={onHome} type="button">
          Back Home
        </button>
      </div>
    </section>
  );
}
