"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { StoredRequest } from "../lib/requests";

type TrackRequestProps = {
  initialQuery?: string;
  loadRequests: () => StoredRequest[];
};

export default function TrackRequest({ initialQuery = "", loadRequests }: TrackRequestProps) {
  const [requestId, setRequestId] = useState(initialQuery);
  const [contact, setContact] = useState("");
  const [result, setResult] = useState<StoredRequest | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    setRequestId(initialQuery);
    if (initialQuery) {
      const found = loadRequests().find(
        (request) => request.id.toLowerCase() === initialQuery.toLowerCase(),
      );
      setResult(found ?? null);
      setSearched(true);
    }
  }, [initialQuery, loadRequests]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedId = requestId.trim().toLowerCase();
    const normalizedContact = contact.trim().toLowerCase();
    const requests = loadRequests();

    const found = requests
      .slice()
      .reverse()
      .find((request) => {
        const idMatches = normalizedId
          ? request.id.toLowerCase() === normalizedId
          : false;
        const contactMatches = normalizedContact
          ? request.contact.toLowerCase().includes(normalizedContact)
          : false;
        return idMatches || contactMatches;
      });

    setResult(found ?? null);
    setSearched(true);
  }

  return (
    <section className="trackCard" aria-labelledby="track-title">
      <div className="formIntro">
        <span>REORDER READY</span>
        <h2 id="track-title">Track My Order</h2>
        <p>This demo tracker checks requests saved on this phone/browser.</p>
      </div>

      <form className="requestForm" onSubmit={handleSubmit}>
        <div className="formGrid">
          <label className="fieldGroup wide">
            <span>Tracking/request ID</span>
            <input
              onChange={(event) => setRequestId(event.target.value)}
              placeholder="TRRY-YYYYMMDD-001"
              type="text"
              value={requestId}
            />
          </label>
          <label className="fieldGroup wide">
            <span>Contact number optional</span>
            <input
              onChange={(event) => setContact(event.target.value)}
              placeholder="Messenger name or phone"
              type="text"
              value={contact}
            />
          </label>
        </div>
        <button className="submitButton" type="submit">
          Track Request
        </button>
      </form>

      {searched && result ? (
        <article className="trackResult success">
          <span className="statusBadge">{result.status}</span>
          <h3>{result.id}</h3>
          <p>{result.type}</p>
          <dl>
            <div>
              <dt>Customer</dt>
              <dd>{result.customerName}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{result.contact}</dd>
            </div>
            <div>
              <dt>Submitted details</dt>
              <dd>{result.summary}</dd>
            </div>
          </dl>
          <p className="miniNotice">TRRY will review your request before production.</p>
        </article>
      ) : null}

      {searched && !result ? (
        <article className="trackResult">
          <h3>No request found.</h3>
          <p>Please check your request ID or contact TRRY Apparel.</p>
        </article>
      ) : null}
    </section>
  );
}
