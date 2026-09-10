/** Split volume-book chapter text the same way the reader narrates it. */
export function splitVolumeParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n{2,}/)
    .filter(Boolean)
}

export function isNarratableParagraph(text: string): boolean {
  return text.trim().length > 0
}
