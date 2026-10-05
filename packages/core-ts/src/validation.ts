import { digest } from "./canonical.ts";
import type { ActionDecision, ActionReceipt, ActionRequest } from "./types.ts";

const risks = new Set(["low", "medium", "high", "critical"]);
const outcomes = new Set(["approve_once", "deny", "defer", "expired", "request_details"]);
const methods = new Set(["hold", "tap", "deny_button", "dial", "policy", "system"]);
const receiptStatuses = new Set(["succeeded", "failed", "denied", "deferred", "expired", "blocked", "stale"]);

function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function requiredString(value: Record<string, unknown> | undefined, key: string, errors: string[], pattern?: RegExp): void {
  const target = value?.[key];
  if (typeof target !== "string" || !target.trim()) {
    errors.push(`${key} must be a non-empty string`);
  } else if (pattern && !pattern.test(target)) {
    errors.push(`${key} has an invalid format`);
  }
}

function requiredDate(value: Record<string, unknown> | undefined, key: string, errors: string[]): void {
  requiredString(value, key, errors);
  if (typeof value?.[key] === "string" && Number.isNaN(Date.parse(value[key]))) errors.push(`${key} must be an ISO date-time`);
}

export function validateActionRequest(value: unknown): string[] {
  const errors: string[] = [];
  const request = object(value);
  if (!request) return ["ActionRequest must be an object"];
  if (request.protocolVersion !== "0.2") errors.push("protocolVersion must be 0.2");
  requiredString(request, "id", errors);
  requiredDate(request, "createdAt", errors);
  requiredDate(request, "expiresAt", errors);
  const origin = object(request.origin);
  requiredString(origin, "agentId", errors);
  requiredString(origin, "runId", errors);
  const action = object(request.action);
  for (const key of ["id", "category", "idempotencyKey"]) requiredString(action, key, errors);
  if (!object(action?.arguments)) errors.push("action.arguments must be an object");
  if (!risks.has(String(action?.risk))) errors.push("action.risk must be low, medium, high, or critical");
  if (typeof action?.reversible !== "boolean") errors.push("action.reversible must be a boolean");
  const commit = object(request.commit);
  for (const key of ["operation", "target", "payloadDigest"]) requiredString(commit, key, errors, key === "payloadDigest" ? /^[a-f0-9]{64}$/ : undefined);
  const witness = object(commit?.stateWitness);
  if (commit?.stateWitness !== undefined) {
    for (const key of ["subject", "version"]) requiredString(witness, key, errors);
    requiredDate(witness, "observedAt", errors);
  }
  const card = object(request.card);
  for (const key of ["title", "summary", "target", "impact"]) requiredString(card, key, errors);
  requiredString(request, "actionDigest", errors, /^[a-f0-9]{64}$/);
  if (typeof request.actionDigest === "string") {
    const { actionDigest, ...unsigned } = request;
    if (digest(unsigned) !== actionDigest) errors.push("actionDigest does not match the request payload");
  }
  return errors;
}

export function validateActionDecision(value: unknown): string[] {
  const errors: string[] = [];
  const decision = object(value);
  if (!decision) return ["ActionDecision must be an object"];
  for (const key of ["id", "requestId"]) requiredString(decision, key, errors);
  requiredString(decision, "actionDigest", errors, /^[a-f0-9]{64}$/);
  if (!outcomes.has(String(decision.outcome))) errors.push("outcome is not a supported FinalButton outcome");
  if (!methods.has(String(decision.method))) errors.push("method is not a supported FinalButton method");
  const presentation = object(decision.presentation);
  if (decision.presentation !== undefined) {
    requiredString(presentation, "id", errors);
    requiredString(presentation, "actionDigest", errors, /^[a-f0-9]{64}$/);
    requiredString(presentation, "digest", errors, /^[a-f0-9]{64}$/);
    const scene = object(presentation?.scene);
    for (const key of ["packId", "packVersion", "variantId"]) requiredString(scene, key, errors);
    if (presentation?.actionDigest !== decision.actionDigest) errors.push("presentation.actionDigest must match decision.actionDigest");
  }
  requiredDate(decision, "createdAt", errors);
  requiredString(decision, "signature", errors, /^[a-f0-9]{64}$/);
  return errors;
}

export function validateActionReceipt(value: unknown): string[] {
  const errors: string[] = [];
  const receipt = object(value);
  if (!receipt) return ["ActionReceipt must be an object"];
  requiredString(receipt, "id", errors);
  errors.push(...validateActionRequest(receipt.request));
  errors.push(...validateActionDecision(receipt.decision));
  if (!receiptStatuses.has(String(receipt.status))) errors.push("status is not a supported FinalButton receipt status");
  requiredDate(receipt, "createdAt", errors);
  const proof = object(receipt.proof);
  requiredString(proof, "digest", errors, /^[a-f0-9]{64}$/);
  requiredString(proof, "signature", errors, /^[a-f0-9]{64}$/);
  return errors;
}

export function assertValidActionRequest(value: unknown): asserts value is ActionRequest {
  const errors = validateActionRequest(value);
  if (errors.length) throw new Error(`Invalid ActionRequest: ${errors.join("; ")}`);
}

export function assertValidActionDecision(value: unknown): asserts value is ActionDecision {
  const errors = validateActionDecision(value);
  if (errors.length) throw new Error(`Invalid ActionDecision: ${errors.join("; ")}`);
}

export function assertValidActionReceipt(value: unknown): asserts value is ActionReceipt {
  const errors = validateActionReceipt(value);
  if (errors.length) throw new Error(`Invalid ActionReceipt: ${errors.join("; ")}`);
}
