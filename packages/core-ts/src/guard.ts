import { randomUUID } from "node:crypto";
import { digest, sign, signaturesMatch } from "./canonical.ts";
import { defaultPolicy, type Policy } from "./policy.ts";
import { assertValidActionDecision, assertValidActionRequest } from "./validation.ts";
import type {
  ActionDecision,
  ActionDefinition,
  ActionCommit,
  ActionOrigin,
  ActionPresentationProof,
  ActionReceipt,
  ActionRequest,
  ApprovalOutcome,
  CommitExecutor,
  CommitInput,
  DecisionMethod,
  PolicyDecision,
  SideEffectExecutor,
  StateWitness,
} from "./types.ts";

type DecisionInput = {
  outcome: ApprovalOutcome;
  method: DecisionMethod;
  reason?: string;
  presentation?: ActionPresentationProof;
};

type GuardOptions = {
  sessionSecret: string;
  now?: () => Date;
  policy?: Policy;
  present?: (request: ActionRequest) => ActionDecision | undefined | Promise<ActionDecision | undefined>;
};

function decisionPayload(decision: Omit<ActionDecision, "signature">) {
  return {
    id: decision.id,
    requestId: decision.requestId,
    actionDigest: decision.actionDigest,
    outcome: decision.outcome,
    method: decision.method,
    reason: decision.reason,
    presentation: decision.presentation,
    createdAt: decision.createdAt,
  };
}

function proofSignaturePayload(receiptId: string, receiptDigest: string) {
  return { receiptId, receiptDigest };
}

function isCommitExecutor<Result>(executor: SideEffectExecutor<Result>): executor is CommitExecutor<Result> {
  return typeof executor === "object" && executor !== null && typeof executor.execute === "function";
}

function equivalentWitness(left: StateWitness, right: StateWitness): boolean {
  return left.subject === right.subject && left.version === right.version;
}

function bindCommit<Args extends Record<string, unknown>>(
  definition: ActionDefinition<Args>,
  args: Args,
  card: ActionRequest["card"],
): ActionRequest["commit"] {
  const input: CommitInput = definition.commit?.(args) ?? {
    operation: definition.id,
    target: card.target,
    payload: args,
  };
  if (!input.operation?.trim() || !input.target?.trim()) throw new Error("A commit needs a trusted operation and target");
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) throw new Error("A commit payload must be an object");
  if (input.stateWitness && (!input.stateWitness.subject?.trim() || !input.stateWitness.version?.trim() || Number.isNaN(Date.parse(input.stateWitness.observedAt)))) {
    throw new Error("A state witness needs a subject, version, and observedAt timestamp");
  }
  return {
    operation: input.operation,
    target: input.target,
    payloadDigest: digest(input.payload),
    stateWitness: input.stateWitness,
  };
}

export function createActionDefinition<Args extends Record<string, unknown>>(
  definition: ActionDefinition<Args>,
): ActionDefinition<Args> {
  if (!definition.id || !definition.category) throw new Error("An action definition needs an id and category");
  if (definition.expiresInSeconds <= 0) throw new Error("expiresInSeconds must be positive");
  return Object.freeze({ ...definition });
}

export function createSignedDecision(
  request: ActionRequest,
  input: DecisionInput,
  sessionSecret: string,
  now = new Date(),
): ActionDecision {
  const unsigned: Omit<ActionDecision, "signature"> = {
    id: randomUUID(),
    requestId: request.id,
    actionDigest: request.actionDigest,
    outcome: input.outcome,
    method: input.method,
    reason: input.reason,
    presentation: input.presentation,
    createdAt: now.toISOString(),
  };
  return { ...unsigned, signature: sign(decisionPayload(unsigned), sessionSecret) };
}

export function assertCommitPayload(commit: ActionCommit, payload: Record<string, unknown>): void {
  if (digest(payload) !== commit.payloadDigest) throw new Error("Provider payload digest does not match the approved commit");
}

export function verifyReceipt(receipt: ActionReceipt, sessionSecret: string): boolean {
  const { proof, ...unsigned } = receipt;
  if (!proof || !/^[a-f0-9]{64}$/.test(proof.digest) || !/^[a-f0-9]{64}$/.test(proof.signature)) return false;
  if (proof.digest !== digest(unsigned)) return false;
  return signaturesMatch(proof.signature, sign(proofSignaturePayload(receipt.id, proof.digest), sessionSecret));
}

export class FinalButtonGuard {
  private readonly sessionSecret: string;
  private readonly clock: () => Date;
  private readonly policy: Policy;
  private readonly presenter?: GuardOptions["present"];
  private readonly consumedRequestIds = new Set<string>();
  private readonly consumedDecisionIds = new Set<string>();

  constructor(options: GuardOptions) {
    if (!options.sessionSecret) throw new Error("A local sessionSecret is required");
    this.sessionSecret = options.sessionSecret;
    this.clock = options.now ?? (() => new Date());
    this.policy = options.policy ?? defaultPolicy;
    this.presenter = options.present;
  }

  createRequest<Args extends Record<string, unknown>>(
    definition: ActionDefinition<Args>,
    rawArguments: unknown,
    createdAt = this.clock(),
    origin: ActionOrigin = { agentId: "unknown-agent", runId: randomUUID() },
  ): ActionRequest {
    const argumentsValue = definition.validate(rawArguments);
    const card = definition.card(argumentsValue);
    const id = randomUUID();
    const expiresAt = new Date(createdAt.getTime() + definition.expiresInSeconds * 1000);
    const draft = {
      protocolVersion: "0.2" as const,
      id,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      origin,
      action: {
        id: definition.id,
        category: definition.category,
        arguments: argumentsValue,
        risk: definition.defaultRisk,
        reversible: definition.reversible,
        idempotencyKey: id,
      },
      commit: bindCommit(definition, argumentsValue, card),
      card,
    };
    return { ...draft, actionDigest: digest(draft) };
  }

  async run<Args extends Record<string, unknown>, Result>(
    definition: ActionDefinition<Args>,
    rawArguments: unknown,
    executor: SideEffectExecutor<Result>,
    origin?: ActionOrigin,
  ): Promise<ActionReceipt> {
    const request = this.createRequest(definition, rawArguments, this.clock(), origin);
    const policy = this.policy(request);
    if (policy.decision === "deny") return this.policyReceipt(request, policy, "blocked");
    if (policy.decision === "allow") {
      const decision = createSignedDecision(request, { outcome: "approve_once", method: "policy", reason: policy.reason }, this.sessionSecret, this.clock());
      return this.execute(request, decision, executor, policy);
    }

    const decision = this.presenter ? await this.presenter(request) : undefined;
    if (!decision) return this.policyReceipt(request, policy, "expired");
    return this.execute(request, decision, executor, policy);
  }

  async execute<Result>(
    request: ActionRequest,
    decision: ActionDecision,
    executor: SideEffectExecutor<Result>,
    policy?: PolicyDecision,
  ): Promise<ActionReceipt> {
    assertValidActionRequest(request);
    assertValidActionDecision(decision);
    const now = this.clock();
    if (now.getTime() >= new Date(request.expiresAt).getTime()) {
      return this.receipt(request, decision, "expired", policy);
    }
    this.verifyDecision(request, decision);
    if (decision.outcome === "deny") return this.receipt(request, decision, "denied", policy);
    if (decision.outcome === "defer" || decision.outcome === "request_details") return this.receipt(request, decision, "deferred", policy);
    if (decision.outcome === "expired") return this.receipt(request, decision, "expired", policy);
    let preflightError: string | undefined;
    try {
      preflightError = await this.preflight(request, executor);
    } catch (error) {
      this.consume(request, decision);
      return this.receipt(request, decision, "failed", policy, undefined, error instanceof Error ? error.message : String(error));
    }
    if (preflightError) {
      this.consume(request, decision);
      return this.receipt(request, decision, "stale", policy, undefined, preflightError);
    }
    this.consume(request, decision);
    try {
      const result = await this.invoke(request, executor);
      return this.receipt(request, decision, "succeeded", policy, result);
    } catch (error) {
      return this.receipt(request, decision, "failed", policy, undefined, error instanceof Error ? error.message : String(error));
    }
  }

  private verifyDecision(request: ActionRequest, decision: ActionDecision): void {
    if (decision.requestId !== request.id) throw new Error("Decision request id does not match");
    if (decision.actionDigest !== request.actionDigest) throw new Error("Decision action digest does not match");
    if (!signaturesMatch(decision.signature, sign(decisionPayload({ ...decision, signature: undefined } as Omit<ActionDecision, "signature">), this.sessionSecret))) {
      throw new Error("Decision signature is invalid");
    }
  }

  private consume(request: ActionRequest, decision: ActionDecision): void {
    if (this.consumedRequestIds.has(request.id) || this.consumedDecisionIds.has(decision.id)) {
      throw new Error("This approval has already been consumed");
    }
    this.consumedRequestIds.add(request.id);
    this.consumedDecisionIds.add(decision.id);
  }

  private async preflight<Result>(request: ActionRequest, executor: SideEffectExecutor<Result>): Promise<string | undefined> {
    if (!isCommitExecutor(executor)) {
      return request.commit.stateWitness ? "A commit with a state witness requires a preflight check." : undefined;
    }
    if (!executor.preflight) return request.commit.stateWitness ? "A commit with a state witness requires a preflight check." : undefined;
    const check = await executor.preflight(request.commit, request);
    if (!check.ok) return check.reason ?? "The trusted preflight rejected this action.";
    if (request.commit.stateWitness && (!check.stateWitness || !equivalentWitness(request.commit.stateWitness, check.stateWitness))) {
      return "The state witness changed after approval.";
    }
    return undefined;
  }

  private async invoke<Result>(request: ActionRequest, executor: SideEffectExecutor<Result>): Promise<Result> {
    return isCommitExecutor(executor) ? executor.execute(request.commit, request) : executor();
  }

  private policyReceipt(request: ActionRequest, policy: PolicyDecision, status: "blocked" | "expired"): ActionReceipt {
    const outcome: ApprovalOutcome = status === "blocked" ? "deny" : "expired";
    const decision = createSignedDecision(request, { outcome, method: "system", reason: policy.reason }, this.sessionSecret, this.clock());
    return this.receipt(request, decision, status, policy);
  }

  private receipt(
    request: ActionRequest,
    decision: ActionDecision,
    status: ActionReceipt["status"],
    policy?: PolicyDecision,
    result?: unknown,
    error?: string,
  ): ActionReceipt {
    const createdAt = this.clock().toISOString();
    const unsigned = {
      id: randomUUID(),
      request,
      decision,
      policy,
      status,
      createdAt,
      completedAt: status === "succeeded" || status === "failed" ? createdAt : undefined,
      result,
      error,
    };
    const proofDigest = digest(unsigned);
    return {
      ...unsigned,
      proof: {
        digest: proofDigest,
        signature: sign(proofSignaturePayload(unsigned.id, proofDigest), this.sessionSecret),
      },
    };
  }
}
