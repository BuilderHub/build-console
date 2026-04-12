/** English pluralization: use singular only when count is exactly 1. */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}
