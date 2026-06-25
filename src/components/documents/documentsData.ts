import {
  BookOpen,
  FileBadge,
  FileText,
  IdCard,
  Receipt,
  Shield,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export type Doc = {
  name: string;
  meta: string;
  icon: LucideIcon;
  color: string;
  badge: string;
};

export const DOCUMENT_SECTIONS: { title: string; docs: Doc[] }[] = [
  {
    title: 'Personal',
    docs: [
      { name: 'Offer Letter', meta: '12 Mar 2024 · PDF', icon: FileBadge, color: '#2563EB', badge: 'bg-blue-100' },
      { name: 'Appointment Letter', meta: '15 Mar 2024 · PDF', icon: FileText, color: '#2563EB', badge: 'bg-blue-100' },
      { name: 'ID Proof (Aadhaar)', meta: '10 Mar 2024 · PDF', icon: IdCard, color: '#6B5FCF', badge: 'bg-violet-100' },
    ],
  },
  {
    title: 'Payroll',
    docs: [
      { name: 'Form 16 (FY24-25)', meta: '30 Apr 2025 · PDF', icon: Receipt, color: '#059669', badge: 'bg-emerald-100' },
      { name: 'Salary Structure', meta: '01 Apr 2025 · PDF', icon: FileText, color: '#059669', badge: 'bg-emerald-100' },
    ],
  },
  {
    title: 'Company',
    docs: [
      { name: 'Employee Handbook', meta: '01 Jan 2026 · PDF', icon: BookOpen, color: '#D9A53B', badge: 'bg-amber-100' },
      { name: 'Leave Policy', meta: '01 Jan 2026 · PDF', icon: Shield, color: '#E0785C', badge: 'bg-rose-100' },
    ],
  },
];
