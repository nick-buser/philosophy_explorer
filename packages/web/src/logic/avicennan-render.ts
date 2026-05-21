import type { Modality, Proposition, Syllogism } from './avicennan-types';
import { letterOf } from './avicennan-types';

// Display helpers for Avicennan propositions and syllogisms.

export type ModalityInfo = {
  token: Modality;
  arabic: string;       // transliterated Arabic name
  gloss: string;        // short temporal-alethic reading
};

export const MODALITY_INFO: Record<Modality, ModalityInfo> = {
  necessary: {
    token: 'necessary',
    arabic: 'ḍarūrī',
    gloss: 'necessarily P, while the subject exists',
  },
  perpetual: {
    token: 'perpetual',
    arabic: 'dāʾima',
    gloss: 'always P, while the subject exists',
  },
  absolute: {
    token: 'absolute',
    arabic: 'muṭlaqa ʿāmma',
    gloss: 'P at some time, while the subject exists',
  },
  possible: {
    token: 'possible',
    arabic: 'mumkina',
    gloss: 'possibly P (two-sided possibility)',
  },
};

const QUANTIFIER_WORD: Record<string, string> = {
  'universal-affirmative': 'every',
  'universal-negative': 'no',
  'particular-affirmative': 'some',
  'particular-negative': 'some',
};

// Canonical one-line form, round-trippable through the parser.
export function formatProposition(p: Proposition): string {
  const key = `${p.quantity}-${p.quality}`;
  const quant = QUANTIFIER_WORD[key] ?? 'every';
  const not = p.quantity === 'particular' && p.quality === 'negative' ? 'is not' : 'is';
  return `${p.modality} ${quant} ${p.subject} ${not} ${p.predicate}`;
}

// AEIO letter plus modality — the compact "modal mood" label used in
// the verdict badge and the mood table (e.g. "necessary-A").
export function formatModalForm(p: Proposition): string {
  return `${p.modality}-${letterOf(p)}`;
}

// The natural-language reading, spelling out the modality gloss.
export function glossProposition(p: Proposition): string {
  const info = MODALITY_INFO[p.modality];
  const key = `${p.quantity}-${p.quality}`;
  const quant = QUANTIFIER_WORD[key] ?? 'every';
  const verb = p.quality === 'negative' ? 'is not' : 'is';
  return `${quant} ${p.subject} ${verb} ${p.predicate} — ${info.gloss} (${info.arabic})`;
}

export function formatSyllogism(s: Syllogism): { role: string; text: string }[] {
  return [
    { role: 'major',      text: formatProposition(s.major) },
    { role: 'minor',      text: formatProposition(s.minor) },
    { role: 'conclusion', text: formatProposition(s.conclusion) },
  ];
}
