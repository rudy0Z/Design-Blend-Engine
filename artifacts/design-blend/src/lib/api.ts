/**
 * Small fetch helper for the capture/plate API (docs/FINAL-PLAN.md §2, §7 Phase 2).
 * Relative by default (same-origin /api); set VITE_API_BASE_URL for split dev.
 */
export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body && body.error
        ? String(body.error)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return body as T;
}

// ---- Types mirroring the API contracts ----

export type CatalogPlate = {
  id: string;
  styleId: string;
  categoryId: string;
  fieldId: string;
  label: string;
  imageUrl: string | null;
  creditLine: string;
  sourceUrl: string | null;
  licenseNote: string;
  altText: string;
  status: string;
};

export type CatalogField = {
  id: string;
  label: string;
  categories: Array<{
    id: string;
    label: string;
    description: string;
    styles: string[];
  }>;
};

export type Catalog = {
  modelVersion: string;
  catalogVersion: string;
  fields: CatalogField[];
  plates: CatalogPlate[];
};

export type CaptureMode = "pick" | "rank" | "rate";

export type PendingResponse = {
  plateId: string;
  mode: CaptureMode;
  value: number;
  sequence: number;
};

export type CompleteResult = {
  profileId: string;
  username: string;
  version: number;
  versionId: string;
  archetype: { id: string; title: string; confidence: number };
  overallCoverage: number;
  topPlates: Array<{
    plateId: string;
    styleId: string;
    label: string;
    imageUrl: string | null;
    value: number;
    mode: string;
  }>;
};
