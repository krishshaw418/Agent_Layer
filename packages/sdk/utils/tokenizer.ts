export class Tokenizer {
  static estimateFromText(text: string): number {
    if (!text) return 0;

    // 1 token ≈ 4 chars (safe approximation)
    return Math.ceil(text.length / 4);
  }

  static estimateFromMessages(messages: { content: string }[]): number {
    let total = 0;

    for (const msg of messages) {
      total += this.estimateFromText(msg.content);

      // add overhead per message (role + formatting)
      total += 4;
    }

    // extra conversation overhead
    return total + 2;
  }
}