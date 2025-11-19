import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Count the number of words in a text string
 */
export function countWords(text: string): number {
  if (!text || typeof text !== "string") return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Truncate text to a word limit, trying to break at sentence boundaries
 */
export function truncateToWordLimit(text: string, limit: number): string {
  if (!text || typeof text !== "string") return ""
  
  const words = text.trim().split(/\s+/).filter(word => word.length > 0)
  if (words.length <= limit) return text
  
  // Take first 'limit' words
  const truncated = words.slice(0, limit).join(" ")
  
  // Try to find the last sentence boundary (., !, ?)
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?")
  )
  
  // If we found a sentence boundary within the last 20% of the text, use it
  if (lastSentenceEnd > truncated.length * 0.8) {
    return truncated.substring(0, lastSentenceEnd + 1)
  }
  
  // Otherwise, just truncate and add ellipsis
  return truncated + "..."
}

/**
 * Validate text against word limit
 */
export function validateWordLimit(
  text: string,
  limit: number,
  type: "hard" | "soft"
): { valid: boolean; warning?: string; wordCount: number } {
  const wordCount = countWords(text)
  
  if (wordCount > limit) {
    if (type === "hard") {
      return {
        valid: false,
        warning: `Word limit exceeded. Current: ${wordCount}, Limit: ${limit}`,
        wordCount,
      }
    } else {
      return {
        valid: true,
        warning: `Word limit exceeded. Current: ${wordCount}, Limit: ${limit}. This is a soft limit and will not be enforced.`,
        wordCount,
      }
    }
  }
  
  return { valid: true, wordCount }
}
