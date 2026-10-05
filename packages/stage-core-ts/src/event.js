const statuses = new Set(["waiting", "holding", "executing", "succeeded", "failed", "denied", "deferred", "expired", "stale"]);
const privacyModes = new Set(["summary-only", "full"]);
const actionLabels = {
  "email.send": { zh: "一封邮件", en: "an email" },
  "communication.send": { zh: "一条消息", en: "a message" },
  "communication.call": { zh: "一通外呼", en: "a phone call" },
  "calendar.create": { zh: "一项日程", en: "a calendar event" },
  "system.deploy": { zh: "一次部署", en: "a deployment" },
  "file.share": { zh: "一份文件", en: "a file" },
};

function nonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
}

function actionLabel(actionKind, locale) {
  const labels = actionLabels[actionKind] ?? actionLabels["communication.send"];
  return locale === "zh-CN" ? labels.zh : labels.en;
}

function summarySlots(actionKind, recipientCount, locale) {
  const label = actionLabel(actionKind, locale);
  const countLabel = recipientCount > 1
    ? (locale === "zh-CN" ? `${recipientCount} 位收件人` : `${recipientCount} recipients`)
    : (locale === "zh-CN" ? "一位收件人" : "a recipient");
  const targetLabel = actionKind === "system.deploy"
    ? (locale === "zh-CN" ? "生产环境" : "production")
    : actionKind === "calendar.create"
      ? (locale === "zh-CN" ? "共享日历" : "shared calendar")
      : actionKind === "communication.call"
        ? (locale === "zh-CN" ? "一位联系人" : "a contact")
        : actionKind === "file.share"
          ? (recipientCount > 1
            ? (locale === "zh-CN" ? `${recipientCount} 位成员` : `${recipientCount} members`)
            : (locale === "zh-CN" ? "一位成员" : "a member"))
          : countLabel;
  return {
    actorLabel: locale === "zh-CN" ? "你" : "You",
    recipientLabel: targetLabel,
    recipientCount: String(recipientCount),
    actionSummary: label,
    status: "",
  };
}

/**
 * Builds the only view a community Scene Pack can see. The input descriptor is
 * derived by trusted presenter code; raw ActionRequest arguments never cross
 * this boundary.
 */
export function createStageEvent(input) {
  if (!input || typeof input !== "object") throw new Error("StageEvent input must be an object");
  const { request, descriptor, contract } = input;
  if (!request?.actionDigest || !request?.action?.category || !request?.action?.risk) throw new Error("StageEvent requires a trusted ActionRequest");
  if (!statuses.has(input.status)) throw new Error("Unsupported StageEvent status");
  if (!contract || !Number.isInteger(contract.holdMs) || !Array.isArray(contract.allowedOutcomes) || !contract.deviceProfile) {
    throw new Error("StageEvent requires a locked device contract");
  }
  if (!descriptor || typeof descriptor !== "object") throw new Error("StageEvent requires a trusted StageDescriptor");
  nonEmptyString(descriptor.actionKind, "descriptor.actionKind");
  nonEmptyString(descriptor.channel, "descriptor.channel");
  if (!Number.isInteger(descriptor.recipientCount) || descriptor.recipientCount < 0) {
    throw new Error("descriptor.recipientCount must be a non-negative integer");
  }

  const contextInput = input.context ?? {};
  const privacyMode = contextInput.privacyMode ?? "summary-only";
  if (!privacyModes.has(privacyMode)) throw new Error("Unsupported StageEvent privacyMode");
  const locale = contextInput.locale === "zh-CN" ? "zh-CN" : "en";
  const timeOfDay = contextInput.timeOfDay === "night" ? "night" : "day";
  const slots = privacyMode === "full"
    ? {
      actorLabel: descriptor.actorLabel ?? (locale === "zh-CN" ? "你" : "You"),
      recipientLabel: descriptor.recipientLabel ?? (locale === "zh-CN" ? "一位收件人" : "a recipient"),
      recipientCount: String(descriptor.recipientCount),
      actionSummary: descriptor.actionSummary ?? actionLabel(descriptor.actionKind, locale),
      status: input.status,
    }
    : { ...summarySlots(descriptor.actionKind, descriptor.recipientCount, locale), status: input.status };

  const sanitizedDescriptor = {
    actionKind: descriptor.actionKind,
    channel: descriptor.channel,
    recipientCount: descriptor.recipientCount,
  };
  const sanitizedCard = privacyMode === "full"
    ? { ...(request.card ?? {}) }
    : {
      title: slots.actionSummary,
      summary: locale === "zh-CN" ? "详情已隐藏" : "Details hidden",
      target: slots.recipientLabel,
      impact: locale === "zh-CN" ? "将执行一次已确认的外部操作" : "An approved external action will run",
    };

  return Object.freeze({
    actionDigest: request.actionDigest,
    category: request.action.category,
    risk: request.action.risk,
    status: input.status,
    contract: Object.freeze({ ...contract }),
    descriptor: Object.freeze(sanitizedDescriptor),
    slots: Object.freeze(slots),
    card: Object.freeze(sanitizedCard),
    context: Object.freeze({
      privacyMode,
      locale,
      timeOfDay,
      reducedMotion: Boolean(contextInput.reducedMotion),
      deviceCapabilities: Object.freeze([...(contextInput.deviceCapabilities ?? ["screen", "light", "audio"])]),
      selectionSeed: contextInput.selectionSeed ?? request.actionDigest,
    }),
  });
}
