// Matrícula: 7 dígitos.
export const MATRICULA_LEN = 7

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function clampMatriculaInput(raw: string): string {
  return digitsOnly(raw).slice(0, MATRICULA_LEN)
}

export function isValidMatricula7(m: string): boolean {
  return /^\d{7}$/.test(m.trim())
}

export function matriculaErrorMessage(): string {
  return 'A matrícula deve ter exatamente 7 números.'
}
