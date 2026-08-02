import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';

/**
 * The employee's own profile — the same GET /employees/me/profile the web
 * profile page reads, and the same per-slice writes.
 *
 * The edit split is the whole point: employees may change their personal
 * contact, demographics (marital status), addresses, bank details and the
 * child collections (emergency contacts, family, nominees, guardians,
 * education, experience). Everything else — identity, job, compensation,
 * statutory ids, training — is HR-owned and read-only here.
 */

export type ProfileAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
};

export type EmergencyContactRow = {
  id?: string;
  name?: string;
  relationship?: string;
  phone?: string;
};

export type FamilyRow = {
  id?: string;
  name?: string;
  relationship?: string;
  dateOfBirth?: string;
  isDependent?: boolean;
};

export type NomineeRow = {
  id?: string;
  name?: string;
  relationship?: string;
  /** Share of the nomination, as a percentage. */
  sharePct?: number;
};

export type GuardianRow = {
  id?: string;
  name?: string;
  relationship?: string;
  phone?: string;
};

export type EducationRow = {
  id?: string;
  degree?: string;
  institution?: string;
  university?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
  hasCertificate?: boolean;
};

export type ExperienceRow = {
  id?: string;
  companyName?: string;
  jobTitle?: string;
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  /** Rupees, as the API reports them. */
  monthlyCtc?: number;
  annualCtc?: number;
  hasCertificate?: boolean;
};

export type TrainingRow = {
  id?: string;
  title?: string;
  provider?: string;
  trainingType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  skills?: string;
  score?: string;
  certificateName?: string;
  expiryDate?: string;
  hasCertificate?: boolean;
};

export type SalaryComponent = {
  label?: string;
  amountPerMonth?: number;
  amountPerYear?: number;
};

export type SalaryInfo = {
  /** Rupees per year. */
  annualCtc?: number;
  monthlyGross?: number;
  effectiveFrom?: string;
  components?: SalaryComponent[];
};

/**
 * The wire shape. GET /employees/me/profile returns
 * `{ employee: {...}, personalInfo: {...}, education: [], experience: [] }` —
 * NOT a flat object. Reading it flat is why the page rendered empty.
 */
type ProfileResponse = {
  employee?: Record<string, unknown> | null;
  personalInfo?: Record<string, unknown> | null;
  education?: Record<string, unknown>[];
  experience?: Record<string, unknown>[];
  training?: Record<string, unknown>[];
  salary?: Record<string, unknown> | null;
};

/** Flat read model the screen renders from. */
export type MyProfile = {
  name?: string;
  code?: string;
  profilePhoto?: string | null;
  designation?: string;
  department?: string;
  subDepartment?: string;
  entity?: string;
  businessUnit?: string;
  division?: string;
  manager?: string;
  hrBusinessPartner?: string;
  employmentType?: string;
  location?: string;
  dateOfJoining?: string;
  employeeStatus?: string;
  employeeCategory?: string;
  probationEndDate?: string;
  confirmationDate?: string;
  workEmail?: string;
  officialPhone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  // Employee-editable slices
  personalEmail?: string;
  mobileNo?: string;
  maritalStatus?: string | null;
  marriageAnniversaryDate?: string | null;
  permanentAddress?: ProfileAddress;
  currentAddress?: ProfileAddress;
  sameAsCurrent?: boolean;
  accountHolderName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  branchNameAddress?: string;
  // HR-owned statutory ids (read-only)
  panNumber?: string;
  aadharNumber?: string;
  pfNumber?: string;
  uan?: string;
  pfOptIn?: boolean;
  esicNumber?: string;
  passportNumber?: string;
  passportExpiry?: string;
  drivingLicenseNumber?: string;
  drivingLicenseExpiry?: string;
  // Collections. Optional on purpose: `fromResponse` always fills them, but a
  // value that reached this type another way (a cache entry written by an
  // older build, a partial fixture) must not be able to crash a `.map()`.
  // Keeping them optional forces every consumer to default them.
  emergencyContacts?: EmergencyContactRow[];
  family?: FamilyRow[];
  nominees?: NomineeRow[];
  guardians?: GuardianRow[];
  education?: EducationRow[];
  experience?: ExperienceRow[];
  training?: TrainingRow[];
  salary?: SalaryInfo | null;
};

const str = (value: unknown): string | undefined => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text : undefined;
};

/** Decimals arrive as strings ("1250000.00"); anything unparseable is dropped. */
const num = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const bool = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const rows = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

const address = (value: unknown): ProfileAddress | undefined => {
  const a = (value ?? {}) as Record<string, unknown>;
  const mapped: ProfileAddress = {
    line1: str(a.line1),
    line2: str(a.line2),
    city: str(a.city),
    state: str(a.state),
    country: str(a.country),
    pinCode: str(a.pinCode),
  };
  return Object.values(mapped).some(Boolean) ? mapped : undefined;
};

/** True when both addresses carry the same values — drives "same as current". */
function sameAddress(a?: ProfileAddress, b?: ProfileAddress): boolean {
  if (!a || !b) return false;
  const keys: (keyof ProfileAddress)[] = [
    'line1',
    'line2',
    'city',
    'state',
    'country',
    'pinCode',
  ];
  return keys.every((key) => (a[key] ?? '').trim() === (b[key] ?? '').trim());
}

/** Flattens the nested payload into the shape the screen reads. */
function fromResponse(raw: ProfileResponse | null): MyProfile {
  const employee = (raw?.employee ?? {}) as Record<string, unknown>;
  const personal = (raw?.personalInfo ?? {}) as Record<string, unknown>;
  const salaryRaw = raw?.salary as Record<string, unknown> | null | undefined;

  const permanentAddress = address(personal.permanentAddress);
  const currentAddress = address(personal.currentAddress);

  // The API reports annual CTC in rupees; monthly gross is a twelfth of it,
  // the same derivation the web's compensation panel uses.
  const annualCtc = num(salaryRaw?.annualCtc);
  const salary: SalaryInfo | null = salaryRaw
    ? {
        annualCtc,
        monthlyGross: annualCtc ? Math.round(annualCtc / 12) : undefined,
        effectiveFrom: str(salaryRaw.effectiveFrom),
        // Component rows are tenant-configured, so accept either the monthly
        // or the annual figure and derive the one that's missing.
        components: rows(salaryRaw.components).map((component) => {
          const perYear =
            num(component.amountPerYear) ?? num(component.annualAmount);
          const perMonth =
            num(component.amountPerMonth) ??
            num(component.monthlyAmount) ??
            (perYear !== undefined ? Math.round(perYear / 12) : undefined);
          return {
            label: str(component.label) ?? str(component.name),
            amountPerMonth: perMonth,
            amountPerYear:
              perYear ??
              (perMonth !== undefined ? Math.round(perMonth * 12) : undefined),
          };
        }),
      }
    : null;

  return {
    name: str(employee.name),
    code: str(employee.code),
    profilePhoto: (employee.profilePhoto as string | null) ?? null,
    designation: str(employee.designation) ?? str(employee.externalDesignation),
    department: str(employee.department),
    subDepartment: str(employee.subDepartment),
    entity: str(employee.entity),
    businessUnit: str(employee.businessUnit),
    division: str(employee.division),
    manager: str(employee.manager),
    hrBusinessPartner: str(employee.hrBusinessPartner),
    employmentType: str(employee.employmentType),
    location: str(employee.location),
    dateOfJoining: str(employee.dateOfJoining),
    employeeStatus: str(employee.employeeStatus),
    employeeCategory: str(employee.employeeCategory),
    probationEndDate: str(employee.probationEndDate),
    confirmationDate: str(employee.confirmationDate),
    workEmail: str(employee.officialEmail),

    dateOfBirth: str(personal.dateOfBirth),
    gender: str(personal.gender),
    bloodGroup: str(personal.bloodGroup),
    nationality: str(personal.nationality),
    religion: str(personal.religion),
    personalEmail: str(personal.personalEmailId),
    mobileNo: str(personal.mobileNo),
    maritalStatus: str(personal.maritalStatus) ?? null,
    marriageAnniversaryDate: str(personal.marriageAnniversaryDate) ?? null,
    permanentAddress,
    currentAddress,
    sameAsCurrent: sameAddress(permanentAddress, currentAddress),

    bankName: str(personal.bankName),
    bankAccountNumber: str(personal.bankAccountNumber),
    ifscCode: str(personal.ifscCode),
    branchNameAddress: str(personal.bankBranch),

    panNumber: str(personal.panNumber),
    aadharNumber: str(personal.aadharNumber),
    pfNumber: str(personal.pfNo),
    uan: str(personal.pfUan),
    pfOptIn: bool(personal.pfOptIn),
    esicNumber: str(personal.esicNumber),
    passportNumber: str(personal.passportNumber),
    passportExpiry: str(personal.passportExpiry),
    drivingLicenseNumber: str(personal.drivingLicenseNumber),
    drivingLicenseExpiry: str(personal.drivingLicenseExpiry),

    emergencyContacts: rows(personal.emergencyContacts).map((row, index) => ({
      id: str(row.id) ?? `ec-${index}`,
      name: str(row.name),
      // Older rows stored this as `relation`.
      relationship: str(row.relationship) ?? str(row.relation),
      phone: str(row.phone),
    })),
    family: rows(personal.familyMembers).map((row, index) => ({
      id: str(row.id) ?? `fm-${index}`,
      name: str(row.name),
      relationship: str(row.relationship),
      dateOfBirth: str(row.dob) ?? str(row.dateOfBirth),
      isDependent: bool(row.isDependent),
    })),
    nominees: rows(personal.nominees).map((row, index) => ({
      id: str(row.id) ?? `nm-${index}`,
      name: str(row.name),
      relationship: str(row.relationship),
      sharePct: num(row.percentage) ?? num(row.sharePct),
    })),
    guardians: rows(personal.guardians).map((row, index) => ({
      id: str(row.id) ?? `gd-${index}`,
      name: str(row.name),
      relationship: str(row.relationship),
      phone: str(row.phone),
    })),

    education: rows(raw?.education).map((row, index) => ({
      id: str(row.id) ?? `ed-${index}`,
      degree: str(row.degree),
      institution: str(row.institution),
      university: str(row.university),
      fieldOfStudy: str(row.fieldOfStudy),
      startYear: num(row.startYear),
      endYear: num(row.endYear),
      grade: str(row.grade),
      hasCertificate: bool(row.hasCertificate),
    })),
    experience: rows(raw?.experience).map((row, index) => ({
      id: str(row.id) ?? `ex-${index}`,
      companyName: str(row.companyName),
      jobTitle: str(row.jobTitle),
      employmentType: str(row.employmentType),
      startDate: str(row.startDate),
      endDate: str(row.endDate),
      isCurrent: bool(row.isCurrent),
      description: str(row.description),
      monthlyCtc: num(row.monthlyCtc),
      annualCtc: num(row.annualCtc),
      hasCertificate: bool(row.hasCertificate),
    })),
    training: rows(raw?.training).map((row, index) => ({
      id: str(row.id) ?? `tr-${index}`,
      title: str(row.title),
      provider: str(row.provider),
      trainingType: str(row.trainingType),
      status: str(row.status),
      startDate: str(row.startDate),
      endDate: str(row.endDate),
      skills: str(row.skills),
      score: str(row.score),
      certificateName: str(row.certificateName),
      expiryDate: str(row.expiryDate),
      hasCertificate: bool(row.hasCertificate),
    })),
    salary,
  };
}

export const profileKeys = {
  me: () => ['profile', 'me'] as const,
  completion: () => ['profile', 'completion'] as const,
};

/** One self-service section the employee can still fill in. */
export type ProfileCompletionItem = {
  id: 'contact' | 'demographics' | 'address' | 'bank' | 'emergency' | 'documents';
  label: string;
  detail: string;
  done: boolean;
};

export type ProfileCompletion = {
  percent: number;
  complete: boolean;
  doneCount: number;
  totalCount: number;
  items: ProfileCompletionItem[];
};

/**
 * Which profile sections are still empty. Computed by the backend so this
 * card and the web's agree — both used to decide for themselves, and this
 * one was hardcoded to a placeholder 20%.
 */
export function useProfileCompletion(enabled = true) {
  return useQuery({
    queryKey: profileKeys.completion(),
    queryFn: ({ signal }) =>
      api.get<ProfileCompletion>('/employees/me/profile-completion', {
        signal,
      }),
    staleTime: 60_000,
    enabled,
  });
}

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: async ({ signal }) => {
      const raw = await api.get<ProfileResponse>('/employees/me/profile', {
        signal,
      });
      return fromResponse(raw);
    },
    staleTime: 60_000,
    enabled,
  });
}

/** One mutation per editable slice — each maps to its own PATCH/PUT route,
 *  mirroring the web's buildPersistRequest dispatcher. */
function useSliceMutation<TBody>(request: (body: TBody) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      // Filling a section can complete the checklist, which is what makes the
      // completion card disappear — without this it would linger until the
      // next cold start.
      queryClient.invalidateQueries({ queryKey: profileKeys.completion() });
    },
  });
}

export function usePatchContact() {
  return useSliceMutation(
    (body: { personalEmail?: string; mobileNo?: string }) =>
      api.patch('/employees/me/profile/contact', body),
  );
}

export function usePatchDemographics() {
  return useSliceMutation(
    (body: {
      maritalStatus?: string | null;
      marriageAnniversaryDate?: string | null;
      // Fill-once: the server accepts these only while it holds no value.
      dateOfBirth?: string | null;
      gender?: string | null;
      nationality?: string | null;
      bloodGroup?: string | null;
    }) => api.patch('/employees/me/profile/demographics', body),
  );
}

export function usePatchAddress() {
  return useSliceMutation(
    (body: {
      permanentAddress?: ProfileAddress;
      currentAddress?: ProfileAddress;
      sameAsCurrent?: boolean;
    }) => api.patch('/employees/me/profile/address', body),
  );
}

export function usePatchBank() {
  return useSliceMutation(
    (body: {
      accountHolderName?: string;
      bankAccountNumber?: string;
      bankName?: string;
      ifscCode?: string;
      branchNameAddress?: string;
    }) => api.patch('/employees/me/profile/bank', body),
  );
}

export function usePutEmergencyContacts() {
  return useSliceMutation((items: Record<string, unknown>[]) =>
    api.put('/employees/me/profile/emergency-contacts', { items }),
  );
}

export function usePutFamily() {
  return useSliceMutation((items: Record<string, unknown>[]) =>
    api.put('/employees/me/profile/family', { items }),
  );
}

export function usePutNominees() {
  return useSliceMutation((items: Record<string, unknown>[]) =>
    api.put('/employees/me/profile/nominees', { items }),
  );
}

export function usePutGuardians() {
  return useSliceMutation((items: Record<string, unknown>[]) =>
    api.put('/employees/me/profile/guardians', { items }),
  );
}

export function usePutEducation() {
  return useSliceMutation((items: Record<string, unknown>[]) =>
    api.put('/employees/me/profile/education', { items }),
  );
}

export function usePutExperience() {
  return useSliceMutation((items: Record<string, unknown>[]) =>
    api.put('/employees/me/profile/experience', { items }),
  );
}
