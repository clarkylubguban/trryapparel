export type RequestKind = "Custom Shirt" | "Canva Link" | "Uniform Inquiry";

export type StoredRequest = {
  id: string;
  type: RequestKind;
  customerName: string;
  contact: string;
  status: "Pending TRRY Review";
  submittedAt: string;
  details: Record<string, string>;
  summary: string;
};

export const REQUEST_STORAGE_KEY = "trry-demo-requests";

export function createRequestId(existingRequests: StoredRequest[], date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;
  const sameDayCount = existingRequests.filter((request) =>
    request.id.startsWith(`TRRY-${datePart}`),
  ).length;
  const sequence = String(sameDayCount + 1).padStart(3, "0");

  return `TRRY-${datePart}-${sequence}`;
}

export function buildSummary(details: Record<string, string>) {
  return Object.entries(details)
    .filter(([, value]) => Boolean(value))
    .slice(0, 5)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");
}
