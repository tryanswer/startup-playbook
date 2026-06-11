/**
 * Notification module — send pipeline results to Slack or DingTalk.
 *
 * Supports:
 *   - Slack Incoming Webhooks (SLACK_WEBHOOK_URL)
 *   - DingTalk Robot Webhooks (DINGTALK_WEBHOOK_URL)
 *
 * Usage:
 *   import { sendNotification } from '../_shared/notifier.mjs';
 *   await sendNotification({ title, score, decision, details, url });
 *
 * Both channels are optional — if no webhook URL is configured, the
 * notification is silently skipped with a console warning.
 */

import { getCredential } from "./credentials.mjs";

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Send a notification to all configured channels.
 *
 * @param {Object} payload
 * @param {string} payload.title      — Notification title
 * @param {number} [payload.score]    — Opportunity score (0-100)
 * @param {string} [payload.decision] — Decision: continue/pivot/kill
 * @param {string[]} [payload.details] — Detail lines
 * @param {string} [payload.url]      — Link to full report
 * @param {string} [payload.stage]    — Pipeline stage name
 * @returns {Promise<{ slack: boolean, dingtalk: boolean }>}
 */
export async function sendNotification(payload) {
  const results = { slack: false, dingtalk: false };

  const slackUrl = getCredential("SLACK_WEBHOOK_URL");
  const dingtalkUrl = getCredential("DINGTALK_WEBHOOK_URL");

  if (!slackUrl && !dingtalkUrl) {
    console.warn("[notifier] No webhook URLs configured. Set SLACK_WEBHOOK_URL or DINGTALK_WEBHOOK_URL.");
    return results;
  }

  const [slackResult, dingtalkResult] = await Promise.allSettled([
    slackUrl ? sendSlack(slackUrl, payload) : Promise.resolve(false),
    dingtalkUrl ? sendDingTalk(dingtalkUrl, payload) : Promise.resolve(false),
  ]);

  results.slack = slackResult.status === "fulfilled" && slackResult.value === true;
  results.dingtalk = dingtalkResult.status === "fulfilled" && dingtalkResult.value === true;

  if (slackResult.status === "rejected") {
    console.warn(`[notifier] Slack failed: ${slackResult.reason?.message ?? "unknown"}`);
  }
  if (dingtalkResult.status === "rejected") {
    console.warn(`[notifier] DingTalk failed: ${dingtalkResult.reason?.message ?? "unknown"}`);
  }

  return results;
}

/**
 * Build a notification payload from a pipeline stage report.
 *
 * @param {Object} report — Stage report object
 * @param {string} stageName — Stage name
 * @returns {Object} Notification payload
 */
export function buildNotificationFromReport(report, stageName) {
  const decisionEmoji = { continue: "🟢", pivot: "🟡", kill: "🔴", adjust: "🟠", pause: "⏸️" };
  const emoji = decisionEmoji[report.decision] ?? "📊";

  const details = [];
  if (report.score != null) details.push(`Score: ${report.score}/100`);
  if (report.decision) details.push(`Decision: ${emoji} ${report.decision.toUpperCase()}`);
  if (report.reasoning) details.push(report.reasoning.slice(0, 200));
  if (report.analysis?.businessModel?.primary) {
    details.push(`Model: ${report.analysis.businessModel.primary}`);
  }
  if (report.evidenceCount) details.push(`Evidence: ${report.evidenceCount} entries`);
  if (report.nextSteps?.length > 0) {
    details.push(`Next: ${report.nextSteps[0]}`);
  }

  return {
    title: `${emoji} Pipeline [${stageName}] — ${report.decision?.toUpperCase() ?? "DONE"}`,
    score: report.score,
    decision: report.decision,
    stage: stageName,
    details,
  };
}

/* ------------------------------------------------------------------ */
/*  Slack                                                              */
/* ------------------------------------------------------------------ */

async function sendSlack(webhookUrl, payload) {
  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: payload.title, emoji: true },
    },
  ];

  if (payload.details?.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: payload.details.map((line) => `• ${line}`).join("\n"),
      },
    });
  }

  if (payload.url) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "📄 View Report" },
          url: payload.url,
        },
      ],
    });
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: payload.title,
      blocks,
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook returned ${response.status}`);
  }
  return true;
}

/* ------------------------------------------------------------------ */
/*  DingTalk                                                           */
/* ------------------------------------------------------------------ */

async function sendDingTalk(webhookUrl, payload) {
  const lines = [`## ${payload.title}`, ""];

  if (payload.details?.length > 0) {
    for (const line of payload.details) {
      lines.push(`- ${line}`);
    }
    lines.push("");
  }

  if (payload.url) {
    lines.push(`[📄 查看完整报告](${payload.url})`);
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msgtype: "markdown",
      markdown: {
        title: payload.title,
        text: lines.join("\n"),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`DingTalk webhook returned ${response.status}`);
  }

  const result = await response.json().catch(() => null);
  if (result?.errcode && result.errcode !== 0) {
    throw new Error(`DingTalk error: ${result.errmsg ?? "unknown"}`);
  }
  return true;
}
