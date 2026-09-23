type SupportMetrics = {
  chatRequests: number;
  chatSuccesses: number;
  chatFailures: number;
  rateLimited: number;
  feedbackTotal: number;
  feedbackHelpful: number;
  feedbackUnhelpful: number;
  escalations: number;
  handoffRequests: number;
  lastActivityAt: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __functionHourSupportMetrics: SupportMetrics | undefined;
}

function createInitialMetrics(): SupportMetrics {
  return {
    chatRequests: 0,
    chatSuccesses: 0,
    chatFailures: 0,
    rateLimited: 0,
    feedbackTotal: 0,
    feedbackHelpful: 0,
    feedbackUnhelpful: 0,
    escalations: 0,
    handoffRequests: 0,
    lastActivityAt: null,
  };
}

const metrics =
  globalThis.__functionHourSupportMetrics ??
  (globalThis.__functionHourSupportMetrics = createInitialMetrics());

function touch() {
  metrics.lastActivityAt = new Date().toISOString();
}

export function recordChatRequest() {
  metrics.chatRequests += 1;
  touch();
}

export function recordChatSuccess(escalationRecommended: boolean) {
  metrics.chatSuccesses += 1;
  if (escalationRecommended) metrics.escalations += 1;
  touch();
}

export function recordChatFailure() {
  metrics.chatFailures += 1;
  touch();
}

export function recordRateLimit() {
  metrics.rateLimited += 1;
  touch();
}

export function recordFeedback(helpful: boolean) {
  metrics.feedbackTotal += 1;
  if (helpful) metrics.feedbackHelpful += 1;
  else metrics.feedbackUnhelpful += 1;
  touch();
}

export function recordHandoffRequest() {
  metrics.handoffRequests += 1;
  touch();
}

export function getSupportMetrics() {
  const helpfulRate =
    metrics.feedbackTotal > 0
      ? Math.round((metrics.feedbackHelpful / metrics.feedbackTotal) * 1000) / 10
      : null;

  const successRate =
    metrics.chatRequests > 0
      ? Math.round((metrics.chatSuccesses / metrics.chatRequests) * 1000) / 10
      : null;

  return {
    ...metrics,
    helpfulRate,
    successRate,
  };
}
