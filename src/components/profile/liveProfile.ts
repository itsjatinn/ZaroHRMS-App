import {
  Award,
  BadgeCheck,
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  Cake,
  CalendarDays,
  Clock,
  CreditCard,
  Droplet,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  Landmark,
  Mail,
  MapPin,
  Percent,
  Phone,
  Plane,
  School,
  Shield,
  Sparkles,
  User,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react-native';

import type { MyProfile, ProfileAddress } from '../../api/profile';
import type { InfoItem } from './profileData';

/**
 * Builds the profile sections from the live GET /employees/me/profile payload,
 * with the web page's exact edit split: personal contact, marital status,
 * addresses and bank details are employee-editable; identity, job, statutory
 * ids, training and compensation are locked.
 *
 * Editable rows carry a `field` id the screen's commit dispatcher maps onto
 * the right PATCH slice.
 */

type Card = { title: string; items: InfoItem[] };

const BLUE = { color: '#2563EB', badge: 'bg-blue-100' };
const GREEN = { color: '#059669', badge: 'bg-emerald-100' };
const VIOLET = { color: '#6B5FCF', badge: 'bg-violet-100' };
const AMBER = { color: '#D9A53B', badge: 'bg-amber-100' };
const ROSE = { color: '#E0785C', badge: 'bg-rose-100' };
const SKY = { color: '#0EA5E9', badge: 'bg-sky-100' };
const CRIMSON = { color: '#E11D48', badge: 'bg-rose-100' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const dash = (value?: string | null) => (value?.trim() ? value.trim() : '—');

/** ISO (or parseable) date → "14 Aug 1996"; anything else shows as-is. */
export function displayDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "14 Aug 1996" → "1996-08-14" for the PATCH body; null when unparseable. */
export function isoFromDisplay(value: string): string | null {
  const m = value.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS.findIndex((mm) =>
    m[2].toLowerCase().startsWith(mm.toLowerCase()),
  );
  if (month < 0) return null;
  return `${m[3]}-${String(month + 1).padStart(2, '0')}-${String(
    Number(m[1]),
  ).padStart(2, '0')}`;
}

/** Indian-grouped rupees, matching the web's formatMoney output. */
export function money(rupees?: number | null): string {
  if (rupees === undefined || rupees === null || !Number.isFinite(rupees)) {
    return '—';
  }
  return `₹ ${Math.round(rupees).toLocaleString('en-IN')}`;
}

/** ENUM_VALUE → "Enum value", as the web's humanizeEnum does. */
export function humanizeEnum(value?: string | null): string {
  if (!value?.trim()) return '—';
  const text = value.trim();
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** "2014 – 2018", "2014 – Present", or a lone year. Blank when neither is set. */
export function yearRange(start?: number, end?: number): string {
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – Present`;
  if (end) return String(end);
  return '—';
}

/**
 * How long the employee has been here, in the web's exact wording:
 * "< 1 month", "7 mo", "2y 3m", "1 year", "3 years".
 */
export function tenureLabel(joiningDate?: string | null, today = new Date()): string {
  if (!joiningDate) return '—';
  const start = new Date(joiningDate);
  if (Number.isNaN(start.getTime())) return '—';
  const months =
    (today.getFullYear() - start.getFullYear()) * 12 +
    (today.getMonth() - start.getMonth());
  if (months < 1) return '< 1 month';
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years}y ${rest}m` : `${years} ${years === 1 ? 'year' : 'years'}`;
}

/** "12 Jan 2021 – Present" for an experience row. */
export function dateRange(start?: string, end?: string): string {
  if (!start && !end) return '—';
  const from = start ? displayDate(start) : '—';
  return `${from} – ${end ? displayDate(end) : 'Present'}`;
}

/**
 * Total experience in the web's terms: the sum of every entry's start→end
 * span, with a missing end treated as today. Overlapping ranges are
 * deliberately double-counted so the figure matches what candidates
 * self-report during onboarding.
 */
export function totalExperienceLabel(
  rows: { startDate?: string; endDate?: string }[],
  today = new Date(),
): string {
  let days = 0;
  for (const row of rows) {
    if (!row.startDate) continue;
    const start = new Date(row.startDate);
    const end = row.endDate ? new Date(row.endDate) : today;
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    const span = end.getTime() - start.getTime();
    if (span > 0) days += span / (1000 * 60 * 60 * 24);
  }
  const years = days / 365.25;
  if (years <= 0) return '—';
  if (years < 1) return `${Math.round(years * 12)} mo`;
  return `${years.toFixed(1)} yrs`;
}

function addressCard(
  title: string,
  which: 'current' | 'permanent',
  address: ProfileAddress | undefined,
): Card {
  return {
    title,
    items: [
      { icon: MapPin, label: 'Line 1', value: dash(address?.line1), ...GREEN, field: `address.${which}.line1` },
      { icon: MapPin, label: 'Line 2', value: dash(address?.line2), ...GREEN, field: `address.${which}.line2` },
      { icon: Building2, label: 'City', value: dash(address?.city), ...BLUE, field: `address.${which}.city` },
      { icon: Globe, label: 'State', value: dash(address?.state), ...VIOLET, field: `address.${which}.state` },
      { icon: Globe, label: 'Country', value: dash(address?.country), ...ROSE, field: `address.${which}.country` },
      { icon: FileText, label: 'PIN code', value: dash(address?.pinCode), ...AMBER, field: `address.${which}.pinCode` },
    ],
  };
}

export const MARITAL_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed'];
export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
export const BLOOD_GROUP_OPTIONS = [
  'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-',
];

/**
 * Identity facts HR normally owns, but which an employee must be able to
 * supply when their record is blank — otherwise there is no route to filling
 * them in at all. Editable while empty, locked once set. The same rule is
 * enforced server-side in EmployeeSelfProfileService.updateDemographics;
 * this only decides whether the row offers an input.
 */
function fillOnce(
  value: string | undefined,
  field: string,
  extra: Partial<InfoItem> = {},
): Partial<InfoItem> {
  return value?.trim() ? { locked: true } : { field, ...extra };
}

export function buildLiveSectionCards(p: MyProfile): Record<string, Card[]> {
  const married = String(p.maritalStatus ?? '')
    .toLowerCase()
    .startsWith('marri');

  return {
    overview: [
      {
        title: 'Employment',
        items: [
          { icon: FileText, label: 'Employee code', value: dash(p.code), ...BLUE, locked: true },
          { icon: Briefcase, label: 'Designation', value: dash(p.designation), ...VIOLET, locked: true },
          { icon: Building2, label: 'Department', value: dash(p.department), ...GREEN, locked: true },
          ...(p.subDepartment
            ? [{ icon: Building2, label: 'Sub department', value: dash(p.subDepartment), ...GREEN, locked: true }]
            : []),
          { icon: UserCheck, label: 'Reporting manager', value: dash(p.manager), ...AMBER, locked: true },
          ...(p.hrBusinessPartner
            ? [{ icon: Users, label: 'HR business partner', value: dash(p.hrBusinessPartner), ...SKY, locked: true }]
            : []),
        ],
      },
      {
        title: 'Organisation',
        items: [
          { icon: Building2, label: 'Legal entity', value: dash(p.entity), ...BLUE, locked: true },
          ...(p.businessUnit
            ? [{ icon: Building2, label: 'Business unit', value: dash(p.businessUnit), ...VIOLET, locked: true }]
            : []),
          ...(p.division
            ? [{ icon: Building2, label: 'Division', value: dash(p.division), ...GREEN, locked: true }]
            : []),
          { icon: MapPin, label: 'Work location', value: dash(p.location), ...ROSE, locked: true },
        ],
      },
      {
        title: 'Status',
        items: [
          { icon: BadgeCheck, label: 'Employee status', value: humanizeEnum(p.employeeStatus), ...GREEN, locked: true },
          { icon: Clock, label: 'Employment type', value: humanizeEnum(p.employmentType), ...SKY, locked: true },
          { icon: CalendarDays, label: 'Date of joining', value: displayDate(p.dateOfJoining), ...AMBER, locked: true },
          { icon: Clock, label: 'Tenure', value: tenureLabel(p.dateOfJoining), ...VIOLET, locked: true },
          // Only while on probation, exactly as the web gates this row.
          ...(p.employeeCategory === 'PROBATION' && p.probationEndDate
            ? [{ icon: CalendarDays, label: 'Probation ends', value: displayDate(p.probationEndDate), ...ROSE, locked: true }]
            : []),
        ],
      },
    ],
    'personal-info': [
      {
        title: 'Contact',
        items: [
          { icon: Mail, label: 'Work email', value: dash(p.workEmail), ...BLUE, locked: true },
          { icon: Mail, label: 'Personal email', value: dash(p.personalEmail), ...VIOLET, field: 'contact.personalEmail' },
          { icon: Phone, label: 'Mobile', value: dash(p.mobileNo), ...GREEN, field: 'contact.mobileNo' },
        ],
      },
      {
        title: 'About',
        items: [
          {
            icon: Cake,
            label: 'Date of birth',
            value: displayDate(p.dateOfBirth),
            ...ROSE,
            ...fillOnce(p.dateOfBirth, 'demographics.dateOfBirth', {
              type: 'date',
            }),
          },
          {
            icon: User,
            label: 'Gender',
            value: humanizeEnum(p.gender),
            ...VIOLET,
            ...fillOnce(p.gender, 'demographics.gender', {
              type: 'select',
              options: GENDER_OPTIONS,
            }),
          },
          {
            icon: Droplet,
            label: 'Blood group',
            value: dash(p.bloodGroup),
            ...CRIMSON,
            ...fillOnce(p.bloodGroup, 'demographics.bloodGroup', {
              type: 'select',
              options: BLOOD_GROUP_OPTIONS,
            }),
          },
          {
            icon: Globe,
            label: 'Nationality',
            value: dash(p.nationality),
            ...BLUE,
            ...fillOnce(p.nationality, 'demographics.nationality'),
          },
          { icon: Sparkles, label: 'Religion', value: dash(p.religion), ...AMBER, locked: true },
          {
            icon: Heart,
            label: 'Marital status',
            value: dash(p.maritalStatus),
            ...ROSE,
            type: 'select',
            options: MARITAL_OPTIONS,
            field: 'demographics.maritalStatus',
          },
          ...(married
            ? [
                {
                  icon: CalendarDays,
                  label: 'Wedding anniversary',
                  value: displayDate(p.marriageAnniversaryDate),
                  ...AMBER,
                  type: 'date' as const,
                  field: 'demographics.marriageAnniversaryDate',
                },
              ]
            : []),
        ],
      },
    ],
    address: [
      addressCard('Current address', 'current', p.currentAddress),
      addressCard('Permanent address', 'permanent', p.permanentAddress),
    ],
    'bank-identity': [
      {
        title: 'Bank account',
        items: [
          { icon: User, label: 'Account holder', value: dash(p.accountHolderName), ...BLUE, field: 'bank.accountHolderName' },
          { icon: CreditCard, label: 'Account number', value: dash(p.bankAccountNumber), ...GREEN, field: 'bank.bankAccountNumber' },
          { icon: Landmark, label: 'Bank name', value: dash(p.bankName), ...VIOLET, field: 'bank.bankName' },
          { icon: Banknote, label: 'IFSC', value: dash(p.ifscCode), ...AMBER, field: 'bank.ifscCode' },
          { icon: MapPin, label: 'Branch', value: dash(p.branchNameAddress), ...ROSE, field: 'bank.branchNameAddress' },
        ],
      },
      {
        title: 'Statutory identity',
        items: [
          { icon: FileText, label: 'PAN', value: dash(p.panNumber), ...BLUE, locked: true },
          { icon: FileText, label: 'Aadhaar', value: dash(p.aadharNumber), ...GREEN, locked: true },
          { icon: FileText, label: 'PF number', value: dash(p.pfNumber), ...VIOLET, locked: true },
          { icon: FileText, label: 'UAN', value: dash(p.uan), ...AMBER, locked: true },
          { icon: Shield, label: 'ESIC number', value: dash(p.esicNumber), ...SKY, locked: true },
        ],
      },
      // Only shown when HR has recorded one — an empty travel-document card
      // would read as "missing data" rather than "not applicable".
      ...(p.passportNumber || p.drivingLicenseNumber
        ? [
            {
              title: 'Other documents',
              items: [
                ...(p.passportNumber
                  ? [
                      { icon: Plane, label: 'Passport', value: dash(p.passportNumber), ...BLUE, locked: true },
                      { icon: CalendarDays, label: 'Passport expiry', value: displayDate(p.passportExpiry), ...ROSE, locked: true },
                    ]
                  : []),
                ...(p.drivingLicenseNumber
                  ? [
                      { icon: CreditCard, label: 'Driving licence', value: dash(p.drivingLicenseNumber), ...GREEN, locked: true },
                      { icon: CalendarDays, label: 'Licence expiry', value: displayDate(p.drivingLicenseExpiry), ...AMBER, locked: true },
                    ]
                  : []),
              ],
            },
          ]
        : []),
    ],
    'family-nominees': [
      ...(p.emergencyContacts ?? []).map((row, index) => ({
        title: `Emergency contact ${index + 1}`,
        items: [
          { icon: User, label: 'Name', value: dash(row.name), ...BLUE, locked: true },
          { icon: Heart, label: 'Relationship', value: dash(row.relationship), ...CRIMSON, locked: true },
          { icon: Phone, label: 'Phone', value: dash(row.phone), ...GREEN, locked: true },
        ],
      })),
      ...(p.family ?? []).map((row, index) => ({
        title: `Family member ${index + 1}`,
        items: [
          { icon: User, label: 'Name', value: dash(row.name), ...BLUE, locked: true },
          { icon: Heart, label: 'Relationship', value: dash(row.relationship), ...ROSE, locked: true },
          { icon: Cake, label: 'Date of birth', value: displayDate(row.dateOfBirth), ...AMBER, locked: true },
          { icon: Shield, label: 'Dependent', value: row.isDependent ? 'Yes' : 'No', ...GREEN, locked: true },
        ],
      })),
      ...(p.nominees ?? []).map((row, index) => ({
        title: `Nominee ${index + 1}`,
        items: [
          { icon: User, label: 'Name', value: dash(row.name), ...BLUE, locked: true },
          { icon: Heart, label: 'Relationship', value: dash(row.relationship), ...ROSE, locked: true },
          {
            icon: Percent,
            label: 'Share',
            value: row.sharePct !== undefined ? `${row.sharePct}%` : '—',
            ...GREEN,
            locked: true,
          },
        ],
      })),
      ...(p.guardians ?? []).map((row, index) => ({
        title: `Guardian ${index + 1}`,
        items: [
          { icon: User, label: 'Name', value: dash(row.name), ...BLUE, locked: true },
          { icon: Heart, label: 'Relationship', value: dash(row.relationship), ...ROSE, locked: true },
          { icon: Phone, label: 'Phone', value: dash(row.phone), ...GREEN, locked: true },
        ],
      })),
    ],
    // Recent first: end year drives the order, ties break on start year, and a
    // missing end year sorts to the top as "in progress" — as on the web.
    education: [...(p.education ?? [])]
      .sort((a, b) => {
        const aEnd = a.endYear ?? Number.POSITIVE_INFINITY;
        const bEnd = b.endYear ?? Number.POSITIVE_INFINITY;
        if (bEnd !== aEnd) return bEnd - aEnd;
        return (b.startYear ?? 0) - (a.startYear ?? 0);
      })
      .map((row) => ({
        title: dash(row.degree),
        items: [
          { icon: School, label: 'Institution', value: dash(row.institution), ...BLUE, locked: true },
          { icon: GraduationCap, label: 'University', value: dash(row.university), ...VIOLET, locked: true },
          { icon: BookOpen, label: 'Field of study', value: dash(row.fieldOfStudy), ...SKY, locked: true },
          { icon: CalendarDays, label: 'Years', value: yearRange(row.startYear, row.endYear), ...AMBER, locked: true },
          { icon: FileText, label: 'Grade / CGPA', value: dash(row.grade), ...GREEN, locked: true },
          ...(row.hasCertificate
            ? [{ icon: Award, label: 'Certificate', value: 'Available', ...ROSE, locked: true }]
            : []),
        ],
      })),
    experience: (p.experience ?? []).map((row) => ({
      title: dash(row.companyName),
      items: [
        { icon: Briefcase, label: 'Job title', value: dash(row.jobTitle), ...BLUE, locked: true },
        { icon: Clock, label: 'Employment type', value: dash(row.employmentType), ...SKY, locked: true },
        { icon: CalendarDays, label: 'Duration', value: dateRange(row.startDate, row.endDate), ...AMBER, locked: true },
        // CTC is HR-verified during onboarding and locked on the web too.
        { icon: Wallet, label: 'Monthly CTC', value: money(row.monthlyCtc), ...GREEN, locked: true },
        { icon: Wallet, label: 'Annual CTC', value: money(row.annualCtc), ...VIOLET, locked: true },
        ...(row.hasCertificate
          ? [{ icon: Award, label: 'Relieving letter', value: 'Available', ...ROSE, locked: true }]
          : []),
      ],
    })),
    training: (p.training ?? []).map((row) => ({
      title: dash(row.title),
      items: [
        { icon: Building2, label: 'Provider', value: dash(row.provider), ...BLUE, locked: true },
        { icon: BookOpen, label: 'Type', value: humanizeEnum(row.trainingType), ...VIOLET, locked: true },
        { icon: Award, label: 'Status', value: humanizeEnum(row.status), ...GREEN, locked: true },
        { icon: CalendarDays, label: 'Duration', value: dateRange(row.startDate, row.endDate), ...AMBER, locked: true },
        ...(row.skills ? [{ icon: Sparkles, label: 'Skills', value: dash(row.skills), ...SKY, locked: true }] : []),
        ...(row.score ? [{ icon: Percent, label: 'Score', value: dash(row.score), ...GREEN, locked: true }] : []),
        ...(row.certificateName
          ? [{ icon: FileText, label: 'Certificate', value: dash(row.certificateName), ...ROSE, locked: true }]
          : []),
        ...(row.expiryDate
          ? [{ icon: CalendarDays, label: 'Expires', value: displayDate(row.expiryDate), ...CRIMSON, locked: true }]
          : []),
      ],
    })),
    compensation: p.salary
      ? [
          {
            title: 'Cost to company',
            items: [
              { icon: Wallet, label: 'Annual CTC', value: money(p.salary.annualCtc), ...BLUE, locked: true },
              { icon: Wallet, label: 'Monthly gross', value: money(p.salary.monthlyGross), ...GREEN, locked: true },
              ...(p.salary.effectiveFrom
                ? [{ icon: CalendarDays, label: 'Effective from', value: displayDate(p.salary.effectiveFrom), ...AMBER, locked: true }]
                : []),
            ],
          },
          ...(p.salary.components?.length
            ? [
                {
                  title: 'Breakdown',
                  items: (p.salary.components ?? []).map((component) => ({
                    icon: Wallet,
                    label: dash(component.label),
                    value: `${money(component.amountPerMonth)} / mo`,
                    ...VIOLET,
                    locked: true,
                  })),
                },
              ]
            : []),
        ]
      : [],
  };
}
