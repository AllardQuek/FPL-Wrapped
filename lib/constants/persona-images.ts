/**
 * Maps persona keys to their corresponding image filenames
 * Following the convention: {manager-name}-{persona-title}.jpg
 */

export const PERSONA_IMAGE_MAP: Record<string, string> = {
  PEP: 'pep-guardiola-bald-genius.jpg',
  MOYES: 'david-moyes-reliable.jpg',
  REDKNAPP: 'harry-redknapp-wheeler-dealer.jpg',
  MOURINHO: 'jose-mourinho-special-one.jpg',
  KLOPP: 'jurgen-klopp-heavy-metal.jpg',
  AMORIM: 'ruben-amorim-stubborn-one.jpg',
  FERGUSON: 'alex-ferguson-goat.jpg',
  POSTECOGLOU: 'ange-postecoglou-all-outer.jpg',
  EMERY: 'unai-emery-methodical.jpg',
  WENGER: 'arsene-wenger-professor.jpg',
  ANCELOTTI: 'carlo-ancelotti-calm-conductor.jpg',
  MARESCA: 'enzo-maresca-system-builder.jpg',
  ARTETA: 'mikel-arteta-process-manager.jpg',
  SIMEONE: 'diego-simeone-warrior.jpg',
  SLOT: 'arne-slot-optimizer.jpg',
  TENHAG: 'erik-ten-hag-rebuilder.jpg',
};

/**
 * Get the image path for a persona
 * @param personaKey - The persona key (e.g., 'PEP', 'MOURINHO')
 * @returns The full path to the persona image
 */
export function getPersonaImagePath(personaKey: string): string {
  const filename = PERSONA_IMAGE_MAP[personaKey];
  
  if (!filename) {
    console.warn(`No image mapping found for persona key: ${personaKey}`);
    // Return a fallback or placeholder image
    return '/images/personas/placeholder.jpg';
  }
  
  return `/images/personas/${filename}`;
}

/**
 * Check if a persona has an image available
 * @param personaKey - The persona key to check
 * @returns true if an image is mapped, false otherwise
 */
export function hasPersonaImage(personaKey: string): boolean {
  return personaKey in PERSONA_IMAGE_MAP;
}

/**
 * Get all persona keys that have images
 * @returns Array of persona keys with images
 */
export function getPersonasWithImages(): string[] {
  return Object.keys(PERSONA_IMAGE_MAP);
}

/**
 * Get all persona keys that are missing images
 * @param allPersonaKeys - Array of all persona keys defined in the system
 * @returns Array of persona keys without images
 */
export function getMissingPersonaImages(allPersonaKeys: string[]): string[] {
  return allPersonaKeys.filter(key => !hasPersonaImage(key));
}
