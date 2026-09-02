/**
 * Catalog taxonomy (fields/categories/styles) bundled at build time from the
 * versioned source `catalog/v1.json`. Plates (with credits) live in Postgres.
 */
import catalog from "../../../catalog/v1.json";

export type CatalogField = {
  id: string;
  label: string;
  categories: Array<{ id: string; label: string; description: string; styles: string[] }>;
};

export function loadCatalog(): { version: string; fields: CatalogField[] } {
  return {
    version: catalog._meta.version,
    fields: catalog.fields,
  };
}