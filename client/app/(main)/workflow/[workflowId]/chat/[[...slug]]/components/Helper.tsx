"use client";
export function extractMessageText(message: any): string {
  // Already a string → return as-is
  if (typeof message === "string") return message;

  // Array of blocks → join text blocks
  if (Array.isArray(message)) {
    return message
      .filter((block) => block?.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("\n\n");
  }

  return "";
}

