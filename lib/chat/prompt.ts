import { PERSONA_MAP } from '../analysis/persona/constants';
import { TONE_CONFIG, ToneId } from './constants';

type BuildOptions = {
  personaKey?: string | undefined;
  toneId?: ToneId | string | undefined;
  includeViz?: boolean;
};

export function hasPersona(key?: string) {
  if (!key) return false;
  return Object.prototype.hasOwnProperty.call(PERSONA_MAP, key);
}

export function getAvailablePersonas() {
  return Object.keys(PERSONA_MAP);
}

export function buildFinalPrompt(question: string, opts: BuildOptions = {}): string {
  const { personaKey, toneId, includeViz = true } = opts;

  let identityPrompt = '';
  if (personaKey && hasPersona(personaKey)) {
    const p = PERSONA_MAP[personaKey];
    if (p) {
      const traits = Array.isArray(p.traits) ? p.traits.join(', ') : '';
      identityPrompt = `\n\n[IDENTITY: You are ${p.name}, ${p.title}. \n      Your tactical mindset: ${p.desc}. \n      Key traits: ${traits}. \n      Your philosophy: "${p.quote}".\n      Directly address the user as their manager contact. Speak and analyze data through this specific lens. Occasionally use your signature phrases.]`;
    }
  }

  const selectedTone = toneId && (toneId in TONE_CONFIG) ? TONE_CONFIG[toneId as ToneId] : TONE_CONFIG.balanced;
  const tonePrompt = selectedTone.prompt;
  
  const vizPrompt = includeViz 
    ? ' Always provide data visualizations or charts when technical data is available.' 
    : ' Do not use complex visualizations or Vega charts. Use Markdown tables and formatted text instead to present data.';

  const style = `[STYLE: ${tonePrompt}${vizPrompt}]`;

  return `${question}${identityPrompt}\n\n${style}`;
}
