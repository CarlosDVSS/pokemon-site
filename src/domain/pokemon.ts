// Nome do tipo em português; no placar vira minúsculo.
export const TYPE_LABELS_PT: Record<string, string> = {
  normal: 'Normal',
  fire: 'Fogo',
  water: 'Água',
  electric: 'Elétrico',
  grass: 'Grama',
  ice: 'Gelo',
  fighting: 'Lutador',
  poison: 'Veneno',
  ground: 'Terra',
  flying: 'Voador',
  psychic: 'Psíquico',
  bug: 'Inseto',
  rock: 'Pedra',
  ghost: 'Fantasma',
  dragon: 'Dragão',
  steel: 'Metal',
  fairy: 'Fada',
}

export function typesLabelPlacar(types: readonly (string | undefined)[]): string {
  return types
    .filter((t): t is string => Boolean(t))
    .map((t) => (TYPE_LABELS_PT[t] ?? t).toLowerCase())
    .join(' · ')
}

export type PokemonDef = {
  key: string
  namePt: string
  types: readonly [string, string?]
  evolutionChain: readonly number[]
  stageNamesPt: readonly string[]
}

export const POKEMON_LIST: readonly PokemonDef[] = [
  {
    key: 'bulbasaur',
    namePt: 'Bulbassauro',
    types: ['grass', 'poison'],
    evolutionChain: [1, 2, 3],
    stageNamesPt: ['Bulbassauro', 'Ivyssauro', 'Vênussauro'],
  },
  {
    key: 'charmander',
    namePt: 'Charmander',
    types: ['fire'],
    evolutionChain: [4, 5, 6],
    stageNamesPt: ['Charmander', 'Charmeleon', 'Charizard'],
  },
  {
    key: 'squirtle',
    namePt: 'Squirtle',
    types: ['water'],
    evolutionChain: [7, 8, 9],
    stageNamesPt: ['Squirtle', 'Wartortle', 'Blastoise'],
  },
  {
    key: 'caterpie',
    namePt: 'Caterpie',
    types: ['bug'],
    evolutionChain: [10, 11, 12],
    stageNamesPt: ['Caterpie', 'Metapod', 'Butterfree'],
  },
  {
    key: 'weedle',
    namePt: 'Weedle',
    types: ['bug', 'poison'],
    evolutionChain: [13, 14, 15],
    stageNamesPt: ['Weedle', 'Kakuna', 'Beedrill'],
  },
  {
    key: 'pidgey',
    namePt: 'Pidgey',
    types: ['normal', 'flying'],
    evolutionChain: [16, 17, 18],
    stageNamesPt: ['Pidgey', 'Pidgeotto', 'Pidgeot'],
  },
  {
    key: 'rattata',
    namePt: 'Rattata',
    types: ['normal'],
    evolutionChain: [19, 20],
    stageNamesPt: ['Rattata', 'Raticate'],
  },
  {
    key: 'pikachu',
    namePt: 'Pikachu',
    types: ['electric'],
    evolutionChain: [25, 26],
    stageNamesPt: ['Pikachu', 'Raichu'],
  },
  {
    key: 'sandshrew',
    namePt: 'Sandshrew',
    types: ['ground'],
    evolutionChain: [27, 28],
    stageNamesPt: ['Sandshrew', 'Sandslash'],
  },
  {
    key: 'nidoran-f',
    namePt: 'Nidoran♀',
    types: ['poison'],
    evolutionChain: [29, 30, 31],
    stageNamesPt: ['Nidoran♀', 'Nidorina', 'Nidoqueen'],
  },
  {
    key: 'nidoran-m',
    namePt: 'Nidoran♂',
    types: ['poison'],
    evolutionChain: [32, 33, 34],
    stageNamesPt: ['Nidoran♂', 'Nidorino', 'Nidoking'],
  },
  {
    key: 'vulpix',
    namePt: 'Vulpix',
    types: ['fire'],
    evolutionChain: [37, 38],
    stageNamesPt: ['Vulpix', 'Ninetales'],
  },
  {
    key: 'zubat',
    namePt: 'Zubat',
    types: ['poison', 'flying'],
    evolutionChain: [41, 42, 169],
    stageNamesPt: ['Zubat', 'Golbat', 'Crobat'],
  },
  {
    key: 'oddish',
    namePt: 'Oddish',
    types: ['grass', 'poison'],
    evolutionChain: [43, 44, 45],
    stageNamesPt: ['Oddish', 'Gloom', 'Vileplume'],
  },
  {
    key: 'paras',
    namePt: 'Paras',
    types: ['bug', 'grass'],
    evolutionChain: [46, 47],
    stageNamesPt: ['Paras', 'Parasect'],
  },
  {
    key: 'psyduck',
    namePt: 'Psyduck',
    types: ['water'],
    evolutionChain: [54, 55],
    stageNamesPt: ['Psyduck', 'Golduck'],
  },
  {
    key: 'growlithe',
    namePt: 'Growlithe',
    types: ['fire'],
    evolutionChain: [58, 59],
    stageNamesPt: ['Growlithe', 'Arcanine'],
  },
  {
    key: 'abra',
    namePt: 'Abra',
    types: ['psychic'],
    evolutionChain: [63, 64, 65],
    stageNamesPt: ['Abra', 'Kadabra', 'Alakazam'],
  },
  {
    key: 'machop',
    namePt: 'Machop',
    types: ['fighting'],
    evolutionChain: [66, 67, 68],
    stageNamesPt: ['Machop', 'Machoke', 'Machamp'],
  },
  {
    key: 'bellsprout',
    namePt: 'Bellsprout',
    types: ['grass', 'poison'],
    evolutionChain: [69, 70, 71],
    stageNamesPt: ['Bellsprout', 'Weepinbell', 'Victreebel'],
  },
  {
    key: 'geodude',
    namePt: 'Geodude',
    types: ['rock', 'ground'],
    evolutionChain: [74, 75, 76],
    stageNamesPt: ['Geodude', 'Graveler', 'Golem'],
  },
  {
    key: 'gastly',
    namePt: 'Gastly',
    types: ['ghost', 'poison'],
    evolutionChain: [92, 93, 94],
    stageNamesPt: ['Gastly', 'Haunter', 'Gengar'],
  },
  {
    key: 'eevee',
    namePt: 'Eevee',
    types: ['normal'],
    evolutionChain: [133, 134],
    stageNamesPt: ['Eevee', 'Vaporeon'],
  },
  {
    key: 'magikarp',
    namePt: 'Magikarp',
    types: ['water'],
    evolutionChain: [129, 130],
    stageNamesPt: ['Magikarp', 'Gyarados'],
  },
  {
    key: 'dratini',
    namePt: 'Dratini',
    types: ['dragon'],
    evolutionChain: [147, 148, 149],
    stageNamesPt: ['Dratini', 'Dragonair', 'Dragonite'],
  },
] as const

const byKey = new Map(POKEMON_LIST.map((p) => [p.key, p]))

export function getPokemon(key: string): PokemonDef | undefined {
  return byKey.get(key)
}

export function primaryType(key: string): string | undefined {
  const p = getPokemon(key)
  return p?.types[0]
}

export function stageNamePt(key: string, stageIndex: number): string {
  const p = getPokemon(key)
  if (!p) return key
  const i = Math.min(Math.max(0, stageIndex), p.stageNamesPt.length - 1)
  return p.stageNamesPt[i] ?? p.namePt
}
