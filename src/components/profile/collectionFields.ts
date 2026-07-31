/**
 * Field definitions, validation and wire mapping for the profile's editable
 * collections — emergency contacts, family, nominees, guardians, education
 * and experience.
 *
 * Each PUT replaces the whole collection (`{ items }`), so the editor works on
 * a copy of the rows and commits the full next array. Wire field names differ
 * from the read model in two places the mapper must translate: the read model's
 * `grade` is written as `gradeCgpa`, and `dateOfBirth` is written as `dob`.
 *
 * Pure and dependency-free so the rules can be exercised without a RN runtime.
 */

export type CollectionKey =
  | 'emergency-contacts'
  | 'family'
  | 'nominees'
  | 'guardians'
  | 'education'
  | 'experience';

export type FieldType = 'text' | 'number' | 'date' | 'boolean';

export type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  /** Numeric bounds, for 'number' fields. */
  min?: number;
  max?: number;
};

export type CollectionRow = Record<string, unknown> & { id?: string };

export type CollectionConfig = {
  key: CollectionKey;
  /** Group heading, e.g. "Family members". */
  title: string;
  /** "Add family member" */
  addLabel: string;
  /** What one entry is called in dialogs, e.g. "family member". */
  noun: string;
  fields: FieldSpec[];
  /** Card heading for one row. */
  rowTitle: (row: CollectionRow) => string;
  /** Card detail lines for one row (blank entries dropped). */
  rowLines: (row: CollectionRow) => string[];
  /** Blockers for one row; empty = valid. */
  validate: (row: CollectionRow) => string[];
  /** App row → the PUT body's item shape. */
  toWire: (row: CollectionRow) => Record<string, unknown>;
};

const str = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const num = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** ISO yyyy-mm-dd → "31 Jul 2026" for row display. */
function displayDate(value: unknown): string {
  const text = str(value);
  if (!text) return '';
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return text;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function requireFields(row: CollectionRow, specs: FieldSpec[]): string[] {
  const blockers: string[] = [];
  for (const spec of specs) {
    if (!spec.required) continue;
    const value = row[spec.key];
    const empty =
      spec.type === 'number' ? num(value) === undefined : !str(value);
    if (empty) blockers.push(`${spec.label} is required.`);
  }
  return blockers;
}

const personFields = (phoneLabel = 'Phone'): FieldSpec[] => [
  { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Full name' },
  { key: 'relationship', label: 'Relationship', type: 'text', required: true, placeholder: 'e.g. Father' },
  { key: 'phone', label: phoneLabel, type: 'text', required: true, placeholder: 'Mobile number' },
];

export const COLLECTIONS: Record<CollectionKey, CollectionConfig> = {
  'emergency-contacts': {
    key: 'emergency-contacts',
    title: 'Emergency contacts',
    addLabel: 'Add emergency contact',
    noun: 'emergency contact',
    fields: personFields(),
    rowTitle: (row) => str(row.name) || 'Emergency contact',
    rowLines: (row) => [str(row.relationship), str(row.phone)].filter(Boolean),
    validate: (row) => requireFields(row, personFields()),
    toWire: (row) => ({
      name: str(row.name),
      relationship: str(row.relationship),
      phone: str(row.phone),
    }),
  },
  family: {
    key: 'family',
    title: 'Family members',
    addLabel: 'Add family member',
    noun: 'family member',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Full name' },
      { key: 'relationship', label: 'Relationship', type: 'text', required: true, placeholder: 'e.g. Mother' },
      { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
      { key: 'isDependent', label: 'Dependent', type: 'boolean' },
    ],
    rowTitle: (row) => str(row.name) || 'Family member',
    rowLines: (row) =>
      [
        str(row.relationship),
        displayDate(row.dateOfBirth),
        row.isDependent === true ? 'Dependent' : '',
      ].filter(Boolean),
    validate: (row) =>
      requireFields(row, [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'relationship', label: 'Relationship', type: 'text', required: true },
      ]),
    // The wire calls it `dob`.
    toWire: (row) => ({
      name: str(row.name),
      relationship: str(row.relationship),
      ...(str(row.dateOfBirth) ? { dob: str(row.dateOfBirth) } : {}),
      isDependent: row.isDependent === true,
    }),
  },
  nominees: {
    key: 'nominees',
    title: 'Nominees',
    addLabel: 'Add nominee',
    noun: 'nominee',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Full name' },
      { key: 'relationship', label: 'Relationship', type: 'text', required: true, placeholder: 'e.g. Spouse' },
      { key: 'sharePct', label: 'Share %', type: 'number', required: true, min: 1, max: 100 },
    ],
    rowTitle: (row) => str(row.name) || 'Nominee',
    rowLines: (row) =>
      [
        str(row.relationship),
        num(row.sharePct) !== undefined ? `${num(row.sharePct)}% share` : '',
      ].filter(Boolean),
    validate: (row) => {
      const blockers = requireFields(row, [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'relationship', label: 'Relationship', type: 'text', required: true },
        { key: 'sharePct', label: 'Share %', type: 'number', required: true },
      ]);
      const share = num(row.sharePct);
      if (share !== undefined && (share < 1 || share > 100)) {
        blockers.push('Share % must be between 1 and 100.');
      }
      return blockers;
    },
    toWire: (row) => ({
      name: str(row.name),
      relationship: str(row.relationship),
      sharePct: num(row.sharePct) ?? 0,
    }),
  },
  guardians: {
    key: 'guardians',
    title: 'Guardians',
    addLabel: 'Add guardian',
    noun: 'guardian',
    fields: personFields(),
    rowTitle: (row) => str(row.name) || 'Guardian',
    rowLines: (row) => [str(row.relationship), str(row.phone)].filter(Boolean),
    validate: (row) => requireFields(row, personFields()),
    toWire: (row) => ({
      name: str(row.name),
      relationship: str(row.relationship),
      phone: str(row.phone),
    }),
  },
  education: {
    key: 'education',
    title: 'Education',
    addLabel: 'Add education',
    noun: 'qualification',
    fields: [
      { key: 'degree', label: 'Degree', type: 'text', required: true, placeholder: 'e.g. B.Tech' },
      { key: 'institution', label: 'College / institution', type: 'text', required: true },
      { key: 'university', label: 'University', type: 'text' },
      { key: 'fieldOfStudy', label: 'Field of study', type: 'text', placeholder: 'e.g. Computer Science' },
      { key: 'startYear', label: 'Start year', type: 'number', min: 1950, max: 2100 },
      { key: 'endYear', label: 'End year', type: 'number', min: 1950, max: 2100 },
      { key: 'grade', label: 'Grade / CGPA', type: 'text', placeholder: 'e.g. 8.4' },
    ],
    rowTitle: (row) => str(row.degree) || 'Qualification',
    rowLines: (row) => {
      const start = num(row.startYear);
      const end = num(row.endYear);
      return [
        str(row.institution),
        str(row.fieldOfStudy),
        start && end ? `${start} – ${end}` : start ? `${start} – Present` : end ? String(end) : '',
        str(row.grade),
      ].filter(Boolean);
    },
    validate: (row) => {
      const blockers = requireFields(row, [
        { key: 'degree', label: 'Degree', type: 'text', required: true },
        { key: 'institution', label: 'College / institution', type: 'text', required: true },
      ]);
      const start = num(row.startYear);
      const end = num(row.endYear);
      if (start !== undefined && end !== undefined && start > end) {
        blockers.push('Start year cannot be after the end year.');
      }
      return blockers;
    },
    // The wire calls the grade `gradeCgpa`.
    toWire: (row) => ({
      degree: str(row.degree),
      institution: str(row.institution),
      ...(str(row.university) ? { university: str(row.university) } : {}),
      ...(str(row.fieldOfStudy) ? { fieldOfStudy: str(row.fieldOfStudy) } : {}),
      ...(num(row.startYear) !== undefined ? { startYear: num(row.startYear) } : {}),
      ...(num(row.endYear) !== undefined ? { endYear: num(row.endYear) } : {}),
      ...(str(row.grade) ? { gradeCgpa: str(row.grade) } : {}),
    }),
  },
  experience: {
    key: 'experience',
    title: 'Experience',
    addLabel: 'Add experience',
    noun: 'experience entry',
    // CTC deliberately absent: HR verifies it at onboarding and the endpoint
    // does not accept it — the web locks those inputs too.
    fields: [
      { key: 'companyName', label: 'Company', type: 'text', required: true },
      { key: 'jobTitle', label: 'Job title', type: 'text', required: true },
      { key: 'employmentType', label: 'Employment type', type: 'text', placeholder: 'e.g. Full Time' },
      { key: 'startDate', label: 'Start date', type: 'date' },
      { key: 'endDate', label: 'End date', type: 'date' },
    ],
    rowTitle: (row) => str(row.companyName) || 'Experience',
    rowLines: (row) => {
      const start = displayDate(row.startDate);
      const end = displayDate(row.endDate);
      return [
        str(row.jobTitle),
        str(row.employmentType),
        start ? `${start} – ${end || 'Present'}` : '',
      ].filter(Boolean);
    },
    validate: (row) => {
      const blockers = requireFields(row, [
        { key: 'companyName', label: 'Company', type: 'text', required: true },
        { key: 'jobTitle', label: 'Job title', type: 'text', required: true },
      ]);
      const start = str(row.startDate);
      const end = str(row.endDate);
      if (start && end && start > end) {
        blockers.push('The end date must be on or after the start date.');
      }
      return blockers;
    },
    toWire: (row) => ({
      jobTitle: str(row.jobTitle),
      companyName: str(row.companyName),
      ...(str(row.employmentType) ? { employmentType: str(row.employmentType) } : {}),
      ...(str(row.startDate) ? { startDate: str(row.startDate) } : {}),
      ...(str(row.endDate) ? { endDate: str(row.endDate) } : {}),
    }),
  },
};

/** Maps a whole collection onto the PUT body's items. */
export function toWireItems(
  key: CollectionKey,
  rows: CollectionRow[],
): Record<string, unknown>[] {
  return rows.map((row) => COLLECTIONS[key].toWire(row));
}
