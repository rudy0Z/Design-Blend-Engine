import { randomBytes } from "node:crypto";

export function makeId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}
