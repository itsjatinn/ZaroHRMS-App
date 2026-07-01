export type DocItem = {
  key: string;
  label: string;
  /** File name if uploaded, or null if not yet uploaded. */
  file: string | null;
};

// Seed documents. `file: null` = not uploaded yet.
export const DOCUMENTS: DocItem[] = [
  { key: 'offer', label: 'Offer Letter', file: 'offer-letter.pdf' },
  { key: 'aadhaar', label: 'ID Proof (Aadhaar)', file: 'aadhaar.pdf' },
  { key: 'pan', label: 'PAN Card', file: 'pan-card.pdf' },
  { key: 'degree', label: 'Degree Certificate', file: null },
  { key: 'relieving', label: 'Relieving Letter', file: null },
];
