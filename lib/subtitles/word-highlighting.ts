export const splitSubtitleWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean)

const getWordWeight = (word: string) => {
  const spokenCharacters = word.replace(/[^\p{L}\p{N}]/gu, "").length
  let weight = Math.max(0.55, spokenCharacters * 0.18)

  if (/[,;:]$/.test(word)) weight += 0.3
  if (/[.!?…]$/.test(word)) weight += 0.55

  return weight
}

export const getActiveWordIndex = (words: string[], progress: number) => {
  if (words.length <= 1) return 0

  const safeProgress = Math.min(1, Math.max(0, progress))
  const weights = words.map(getWordWeight)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const target = safeProgress * totalWeight

  let elapsed = 0
  for (let index = 0; index < weights.length; index += 1) {
    elapsed += weights[index]
    if (target < elapsed || index === weights.length - 1) return index
  }

  return words.length - 1
}
