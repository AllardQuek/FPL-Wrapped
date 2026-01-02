export interface WrappedSection {
  id: string;
  number: string;
  title: string;
}

export const WRAPPED_SECTIONS: WrappedSection[] = [
  {
    id: 'welcome',
    number: '',
    title: 'Welcome'
  },
  {
    id: 'overview',
    number: '01: The Résumé',
    title: 'Overview'
  },
  {
    id: 'transfers',
    number: '02: Transfer Strategy',
    title: 'Transfers'
  },
  {
    id: 'decisionSpotlight',
    number: '03: Transfer Decisions',
    title: 'Decision Spotlight'
  },
  {
    id: 'captaincy',
    number: '04: The Armband',
    title: 'Captaincy'
  },
  {
    id: 'bench',
    number: '05: The Dugout',
    title: 'Selection'
  },
  {
    id: 'chips',
    number: '06: Power Plays',
    title: 'Chips'
  },
  {
    id: 'squadAnalysis',
    number: '07: The Engine Room',
    title: 'Squad Analysis'
  },
  {
    id: 'persona',
    number: '08: Manager Persona',
    title: 'Persona'
  },
  {
    id: 'summary',
    number: '09: Season Summary',
    title: 'Summary'
  },
  {
    id: 'footer',
    number: '',
    title: 'Footer'
  }
];

export const getSectionById = (id: string): WrappedSection | undefined => {
  return WRAPPED_SECTIONS.find(section => section.id === id);
};

export const SECTION_IDS = WRAPPED_SECTIONS.map(section => section.id);