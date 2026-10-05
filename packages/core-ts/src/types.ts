export type RiskLevel = "low" | "medium" | "high" | "critical";
export type PolicyOutcome = "allow" | "require_approval" | "deny";
export type ApprovalOutcome = "approve_once" | "deny" | "defer" | "expired" | "request_details";
export type DecisionMethod = "hold" | "tap" | "deny_button" | "dial" | "policy" | "system";
export type ReceiptStatus = "succeeded" | "failed" | "denied" | "deferred" | "expired" | "blocked" | "stale";

export interface ActionCard {
  title: string;
  summary: string;
  target: string;
  impact: string;
  disclosure?: string;
  rollback?: string;
}

export interface StateWitness {
  subject: string;
  version: string;
  observedAt: string;
}

export interface CommitInput {
  operation: string;
  target: string;
  payload: Record<string, unknown>;
  stateWitness?: StateWitness;
}

export interface ActionCommit {
  operation: string;
  target: string;
  payloadDigest: string;
  stateWitness?: StateWitness;
}

export interface ActionDefinition<Args extends Record<string, unknown>> {
  id: string;
  category: string;
  defaultRisk: RiskLevel;
  reversible: boolean;
  expiresInSeconds: number;
  validate(input: unknown): Args;
  card(args: Args): ActionCard;
  commit?: (args: Args) => CommitInput;
}

export interface ActionOrigin {
  agentId: string;
  runId: string;
  model?: string;
}

export interface ActionRequest {
  protocolVersion: "0.2";
  id: string;
  createdAt: string;
  expiresAt: string;
  origin: ActionOrigin;
  action: {
    id: string;
    category: string;
    arguments: Record<string, unknown>;
    risk: RiskLevel;
    reversible: boolean;
    idempotencyKey: string;
  };
  commit: ActionCommit;
  card: ActionCard;
  actionDigest: string;
}

export interface PolicyDecision {
  decision: PolicyOutcome;
  reason: string;
  holdMs?: number;
}

export interface ActionPresentationProof {
  id: string;
  actionDigest: string;
  scene: {
    packId: string;
    packVersion: string;
    variantId: string;
  };
  digest: string;
}

export interface ActionDecision {
  id: string;
  requestId: string;
  actionDigest: string;
  outcome: ApprovalOutcome;
  method: DecisionMethod;
  reason?: string;
  presentation?: ActionPresentationProof;
  createdAt: string;
  signature: string;
}

export interface CommitPreflight {
  ok: boolean;
  stateWitness?: StateWitness;
  reason?: string;
}

export interface CommitExecutor<Result> {
  preflight?: (commit: ActionCommit, request: ActionRequest) => CommitPreflight | Promise<CommitPreflight>;
  execute: (commit: ActionCommit, request: ActionRequest) => Result | Promise<Result>;
}

export type SideEffectExecutor<Result> = (() => Result | Promise<Result>) | CommitExecutor<Result>;

export interface ActionProof {
  digest: string;
  signature: string;
}

export interface ActionReceipt {
  id: string;
  request: ActionRequest;
  decision: ActionDecision;
  policy?: PolicyDecision;
  status: ReceiptStatus;
  createdAt: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  proof: ActionProof;
}

export interface DeviceProfile {
  id: "seal-one" | "seal-duo" | "seal-dial" | string;
  inputs: Array<"tap" | "hold" | "deny" | "defer" | "dial" | "details">;
  outputs: Array<"ring" | "screen" | "audio" | "haptic">;
}

export interface InteractionPlan {
  profile: DeviceProfile;
  attention: "calm" | "elevated" | "high";
  domainTone: "communication" | "calendar" | "system" | "money" | "files" | "general";
  holdMs: number;
  affordances: Array<"reveal" | "approve_once" | "deny" | "defer">;
}
