/** Split volume-book chapter text the same way the reader narrates it. */
export function splitVolumeParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).filter(Boolean)
}

export function isNarratableParagraph(text: string): boolean {
  return text.trim().length > 0
}
