/** Values returned by learner resource list / activity APIs */
export type LearnerFeedbackCode =
  | "very_helpful"
  | "helpful"
  | "neutral"
  | "not_helpful";

const CODES: readonly LearnerFeedbackCode[] = [
  "very_helpful",
  "helpful",
  "neutral",
  "not_helpful",
];

/** Matches the emoji options in feedback dialogs */
export const LEARNER_FEEDBACK_EMOJI: Record<LearnerFeedbackCode, string> = {
  very_helpful: "😊",
  helpful: "🙂",
  neutral: "😐",
  not_helpful: "😕",
};

function isLearnerFeedbackCode(v: string): v is LearnerFeedbackCode {
  return (CODES as readonly string[]).includes(v);
}

/**
 * APIs may return `feedback` as a plain string or as `{ feedback: string }`.
 */
export function parseLearnerFeedbackValue(feedback: unknown): LearnerFeedbackCode | null {
  if (feedback == null) return null;
  if (typeof feedback === "string") {
    return isLearnerFeedbackCode(feedback) ? feedback : null;
  }
  if (typeof feedback === "object" && feedback !== null && "feedback" in feedback) {
    const inner = (feedback as { feedback?: unknown }).feedback;
    if (typeof inner === "string" && isLearnerFeedbackCode(inner)) return inner;
  }
  return null;
}
