import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, getAccessToken } from './client';
import { API_BASE, API_URL } from './config';

/**
 * The employee's own documents — GET /employees/me/documents, stitched into a
 * single list exactly the way the web profile's Documents section does it.
 *
 * The bundle carries three sources and they are NOT interchangeable:
 *
 *   onboardingDocuments — template-driven, the source of truth for what
 *                         *should* exist. Every file field on the tenant's
 *                         onboarding template appears here, uploaded or not.
 *   documentRows        — one entry per real uploaded EmployeeDocument, each
 *                         carrying the `templateFieldKey` it was filed under.
 *                         (The sibling `documents` array pads every
 *                         DocumentType enum value out as an empty slot, which
 *                         is noise — the template rows already cover
 *                         "missing", so we read documentRows instead.)
 *   orgDocuments        — org-issued files (the offer letter), which carry
 *                         their own content path.
 *
 * Listing the raw `documents` array wholesale is what produced a wall of
 * "Not uploaded" rows the web never shows.
 */

export type DocCategory = 'personal' | 'education' | 'experience' | 'org';
/**
 * Uploaded or not — that is the whole state machine here. There is no
 * verification step for these: `EmployeeDocument.isVerified` defaults to false
 * and nothing in the backend ever sets it true (the only /verify route belongs
 * to the separate onboardingDocument table used before an employee exists), so
 * a "pending verification" state would never clear.
 */
export type DocStatus = 'uploaded' | 'missing';

export type LiveDoc = {
  /** Stable per row: `fieldKey`, `fieldKey::index`, `ed::<id>`, or an org key. */
  key: string;
  name: string;
  status: DocStatus;
  category: DocCategory;
  uploadedAt?: string | null;
  /** Absolute URL for the bytes. Missing rows have none until uploaded. */
  contentUrl?: string;
  /** Set only on EmployeeDocument-backed rows. */
  documentType?: string;
  /** True when this document type has prior (superseded) versions. */
  hasHistory?: boolean;
  /**
   * The onboarding-template slot this row represents. Sent back on upload so
   * the file is filed against the slot instead of becoming a loose document.
   */
  templateFieldKey?: string;
};

export const DOC_CATEGORIES: { key: DocCategory; label: string; hint: string }[] =
  [
    { key: 'personal', label: 'Personal', hint: 'Identity & address proofs' },
    { key: 'education', label: 'Education', hint: 'Marksheets & certificates' },
    { key: 'experience', label: 'Experience', hint: 'Relieving letters, payslips' },
    { key: 'org', label: 'Organisation', hint: 'Offer & appointment letters' },
  ];

/**
 * Mirrors the web's categoriseEmployeeDoc. Applied only to EmployeeDocument
 * rows — onboarding and org entries already carry a category from the server.
 */
export function categoriseEmployeeDoc(
  documentType: string,
  label: string,
): DocCategory {
  const text = `${documentType} ${label}`.toLowerCase();
  if (/(degree|marksheet|education|academic|certificate.*course|transcript)/.test(text)) {
    return 'education';
  }
  if (
    /(experience|relieving|payslip|salary slip|appraisal|increment|previous.*offer|bank statement|exp_)/.test(
      text,
    )
  ) {
    return 'experience';
  }
  if (/(offer|appointment|contract|nda|policy|handbook|onboarding)/.test(text)) {
    return 'org';
  }
  return 'personal';
}

/** Coarse DocumentType per category, so an upload is filed sensibly for HR. */
const UPLOAD_TYPE_BY_CATEGORY: Record<DocCategory, string> = {
  personal: 'OTHER',
  education: 'EDUCATION_CERTIFICATE',
  experience: 'EXPERIENCE_LETTER',
  org: 'OTHER',
};

type BundleResponse = {
  /** Enum-padded slot list. Only read for the per-type history flag. */
  documents?: { id: string | null; hasHistory?: boolean }[];
  /** One row per real uploaded document, with its template slot key. */
  documentRows?: {
    id: string;
    documentType: string;
    templateFieldKey: string | null;
    label: string;
    fileName: string | null;
    uploadedAt: string | null;
  }[];
  onboardingDocuments?: {
    fieldKey: string;
    label: string;
    status: 'uploaded' | 'missing';
    category: DocCategory;
    fileName: string | null;
    index: number | null;
    uploadedAt: string | null;
  }[];
  orgDocuments?: {
    key: string;
    label: string;
    status: 'uploaded' | 'missing';
    uploadedAt: string | null;
    contentPath: string | null;
  }[];
};

const norm = (value?: string | null) => (value ?? '').trim().toLowerCase();

/**
 * Stitches the bundle into one list.
 *
 * The important rule: an uploaded document that carries a `templateFieldKey`
 * belongs to that template slot and renders ON that row. Without this, filing
 * a PAN card produces a second card titled "Other" (the coarse DocumentType
 * the upload was filed under) while the PAN slot still reads Missing.
 */
export function buildDocumentList(bundle: BundleResponse | null): LiveDoc[] {
  if (!bundle) return [];
  const out: LiveDoc[] = [];
  const rows = bundle.documentRows ?? [];
  // documentRows carries no history flag; the padded list does.
  const historyById = new Map(
    (bundle.documents ?? [])
      .filter((d) => d.id)
      .map((d) => [d.id as string, d.hasHistory === true]),
  );

  // Index uploads by the slot they were filed against. Newest wins: the list
  // arrives newest-first, so the first hit for a key is the current file.
  const bySlot = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = row.templateFieldKey?.trim();
    if (key && !bySlot.has(key)) bySlot.set(key, row);
  }

  // Rows consumed by a slot must not also appear as their own card.
  const claimed = new Set<string>();
  const onboardingFileNames = new Set<string>();

  for (const ob of bundle.onboardingDocuments ?? []) {
    const attached = bySlot.get(ob.fieldKey);
    if (attached) claimed.add(attached.id);

    const submitted = ob.status === 'uploaded';
    const uploaded = Boolean(attached) || submitted;
    if (uploaded) {
      const fileName = attached?.fileName ?? ob.fileName;
      if (fileName) onboardingFileNames.add(norm(fileName));
    }
    const indexParam = ob.index != null ? `&index=${ob.index}` : '';

    out.push({
      key: ob.index != null ? `${ob.fieldKey}::${ob.index}` : ob.fieldKey,
      // Keep the slot's own label so the row stays recognisable as "PAN Card"
      // rather than taking the file's name.
      name: ob.label || attached?.fileName || ob.fileName || ob.fieldKey,
      status: uploaded ? 'uploaded' : 'missing',
      category: ob.category,
      uploadedAt: attached?.uploadedAt ?? ob.uploadedAt,
      // A file filed against the slot streams by its document id; a candidate's
      // original onboarding submission streams from the onboarding endpoint.
      contentUrl: attached
        ? `${API_URL}/employees/me/documents/${encodeURIComponent(attached.id)}/content`
        : submitted
          ? `${API_URL}/employees/me/documents/onboarding-content` +
            `?fieldKey=${encodeURIComponent(ob.fieldKey)}${indexParam}`
          : undefined,
      // Replacing reuses the same type so the previous file is superseded
      // rather than sitting alongside it.
      documentType: attached?.documentType,
      hasHistory: attached ? historyById.get(attached.id) === true : false,
      templateFieldKey: ob.fieldKey,
    });
  }

  for (const row of rows) {
    // Offer letters come through orgDocuments — skip to avoid double-listing.
    if (row.documentType === 'OFFER_LETTER') continue;
    // Already rendered on its template slot.
    if (claimed.has(row.id)) continue;
    // Same physical file as an onboarding submission.
    if (row.fileName && onboardingFileNames.has(norm(row.fileName))) continue;
    out.push({
      key: `ed::${row.id}`,
      name: row.label || row.fileName || row.documentType,
      status: 'uploaded',
      category: categoriseEmployeeDoc(row.documentType, row.label),
      uploadedAt: row.uploadedAt,
      contentUrl: `${API_URL}/employees/me/documents/${encodeURIComponent(row.id)}/content`,
      documentType: row.documentType,
      hasHistory: historyById.get(row.id) === true,
      templateFieldKey: row.templateFieldKey ?? undefined,
    });
  }

  for (const org of bundle.orgDocuments ?? []) {
    out.push({
      key: org.key,
      name: org.label,
      status: org.status === 'uploaded' ? 'uploaded' : 'missing',
      category: 'org',
      uploadedAt: org.uploadedAt,
      // contentPath already begins with "/api", so it hangs off the origin —
      // API_URL would double the prefix.
      contentUrl: org.contentPath ? `${API_BASE}${org.contentPath}` : undefined,
    });
  }

  return out;
}

export const documentKeys = {
  mine: () => ['documents', 'me'] as const,
};

export function useMyDocuments(enabled = true) {
  return useQuery({
    queryKey: documentKeys.mine(),
    queryFn: async ({ signal }) =>
      buildDocumentList(
        await api.get<BundleResponse>('/employees/me/documents', { signal }),
      ),
    staleTime: 60_000,
    enabled,
  });
}

/**
 * Uploads one file onto the employee's own record. Multipart, matching the
 * controller's FileInterceptor('file'), with the category-derived type the
 * web sends.
 */
export function useUploadMyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      uri: string;
      name: string;
      mimeType?: string | null;
      /** Set by the pickers on web only; the upload needs the real File there. */
      file?: File | null;
      category: DocCategory;
      /** Reuse the row's existing type on replace, so it supersedes cleanly. */
      documentType?: string;
      /** The slot being filled — without it the file becomes a loose card. */
      templateFieldKey?: string;
    }) => {
      const form = new FormData();
      if (input.file) {
        // Web: FormData only accepts a string or a real Blob/File — the React
        // Native shape below stringifies to "[object Object]", leaving the
        // server with a text field and no file.
        form.append('file', input.file, input.name);
      } else {
        // React Native's FormData takes this {uri,name,type} shape for files.
        form.append('file', {
          uri: input.uri,
          name: input.name,
          type: input.mimeType || 'application/octet-stream',
        } as unknown as Blob);
      }
      form.append(
        'documentType',
        input.documentType ||
          UPLOAD_TYPE_BY_CATEGORY[input.category] ||
          'OTHER',
      );
      if (input.templateFieldKey) {
        form.append('templateFieldKey', input.templateFieldKey);
      }
      return api.post('/employees/me/documents', form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.mine() });
    },
  });
}

/** One prior or current file for a document type, newest first. */
export type DocumentVersion = {
  id: string;
  fileName: string;
  fileSize?: number | null;
  uploadedAt?: string | null;
  supersededAt?: string | null;
  isCurrent: boolean;
};

/** Version history for a document type — the web's History popover. */
export function useDocumentVersions(documentType: string | null) {
  return useQuery({
    queryKey: ['documents', 'versions', documentType] as const,
    queryFn: async ({ signal }) => {
      const result = await api.get<{ versions?: DocumentVersion[] }>(
        `/employees/me/documents/${encodeURIComponent(documentType!)}/versions`,
        { signal },
      );
      return result?.versions ?? [];
    },
    enabled: Boolean(documentType),
    staleTime: 30_000,
  });
}

/** Absolute URL for one specific version's bytes. */
export function versionContentUrl(versionId: string) {
  return `${API_URL}/employees/me/documents/${encodeURIComponent(versionId)}/content`;
}

/** Bearer header for a direct file download (a plain link can't carry auth). */
export function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** The 10 MB ceiling the upload endpoint enforces. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
