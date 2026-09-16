function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    "&amp;": "&",
    "&apos;": "'",
    "&gt;": ">",
    "&lt;": "<",
    "&nbsp;": " ",
    "&quot;": '"',
  }

  return value
    .replace(
      /&#x([0-9a-f]+);|&#([0-9]+);/gi,
      (_, hexadecimal: string, decimal: string) =>
        String.fromCodePoint(
          Number.parseInt(hexadecimal || decimal, hexadecimal ? 16 : 10)
        )
    )
    .replace(
      /&(amp|apos|gt|lt|nbsp|quot);/gi,
      (entity) => namedEntities[entity.toLowerCase()] ?? entity
    )
}

export function stripHtml(value: string | null) {
  if (!value) return null

  let text = decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|li|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, " ")

  text = decodeHtmlEntities(text)

  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}
