type Strategy = "latency" | "cost";
type Mode = "chat" | "embeddings";

const CREDIT_RATES: Record<Mode, Record<string, number>> = {
  chat: {
    latency: 0.032,
    cost: 0.018
  },
  embeddings: {
    standard: 0.006
  }
};

export function estimateCredits(totalTokens: number, strategy: Strategy, mode: Mode) {
  const rate =
    mode === "chat" ? CREDIT_RATES.chat[strategy] : CREDIT_RATES.embeddings.standard;

  const credits = (totalTokens / 1000) * rate;

  return {
    credits,
    formatted: `${credits.toFixed(4)} AL`,
    rateLabel:
      mode === "chat"
        ? `${rate.toFixed(3)} AL / 1K tokens`
        : `${CREDIT_RATES.embeddings.standard.toFixed(3)} AL / 1K tokens`
  };
}

