// +1 estágio na cadeia a cada 100 pts (cap no último).
export function evolutionStageIndex(totalPoints: number, chainLength: number): number {
  if (chainLength <= 0) return 0
  const stage = Math.floor(totalPoints / 100)
  return Math.min(stage, chainLength - 1)
}

export function spriteUrlForDexId(dexId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/${dexId}.png`
}
