import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function canonicalValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Action data cannot contain a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalValue).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).filter((key) => record[key] !== undefined).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalValue(record[key])}`).join(",")}}`;
  }
  throw new Error("Action data must be JSON-compatible");
}

export function canonicalize(value: unknown): string {
  return canonicalValue(value);
}

export function digest(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

export function sign(value: unknown, secret: string): string {
  return createHmac("sha256", secret).update(canonicalize(value)).digest("hex");
}

export function signaturesMatch(left: string, right: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(left) || !/^[a-f0-9]{64}$/.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}
