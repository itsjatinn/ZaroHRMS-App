import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  MapPin,
  User,
  Users,
  Wallet,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { InfoItem } from './profileData';
import { PERSONAL_INFO } from './profileData';

export type ProfileSection = {
  key: string; // route param
  label: string;
  icon: LucideIcon;
  /** Icon-chip tint: [icon color, chip background]. */
  color: string;
  chip: string;
  /** Read-only for employees (HR-owned) — hides the edit controls. */
  readOnly?: boolean;
};

// The profile section menu (matches the design).
export const PROFILE_SECTIONS: ProfileSection[] = [
  { key: 'personal-info', label: 'Personal info', icon: User, color: '#6B5FCF', chip: 'bg-violet-100' },
  { key: 'address', label: 'Address', icon: MapPin, color: '#059669', chip: 'bg-emerald-100' },
  { key: 'bank-identity', label: 'Bank & identity', icon: CreditCard, color: '#0EA5E9', chip: 'bg-sky-100' },
  { key: 'family-nominees', label: 'Family & nominees', icon: Users, color: '#E0785C', chip: 'bg-rose-100' },
  { key: 'education', label: 'Education', icon: GraduationCap, color: '#D9A53B', chip: 'bg-amber-100' },
  { key: 'experience', label: 'Experience', icon: Briefcase, color: '#2563EB', chip: 'bg-blue-100' },
  { key: 'documents', label: 'Documents', icon: FileText, color: '#6B5FCF', chip: 'bg-violet-100' },
  { key: 'compensation', label: 'Compensation', icon: Wallet, color: '#059669', chip: 'bg-emerald-100', readOnly: true },
];

type Card = { title: string; items: InfoItem[] };

const BLUE = { color: '#2563EB', badge: 'bg-blue-100' };
const GREEN = { color: '#059669', badge: 'bg-emerald-100' };
const VIOLET = { color: '#6B5FCF', badge: 'bg-violet-100' };
const AMBER = { color: '#D9A53B', badge: 'bg-amber-100' };
const ROSE = { color: '#E0785C', badge: 'bg-rose-100' };

// Blank templates used when the user taps "Add" on a repeatable section.
export const EDUCATION_TEMPLATE: Card = {
  title: 'New qualification',
  items: [
    { icon: GraduationCap, label: 'Institution', value: '—', ...BLUE },
    { icon: CalendarDays, label: 'Year', value: '—', ...AMBER },
    { icon: BadgeCheck, label: 'Grade', value: '—', ...GREEN },
  ],
};

export const EXPERIENCE_TEMPLATE: Card = {
  title: 'New experience',
  items: [
    { icon: CalendarDays, label: 'Duration', value: '—', ...AMBER },
    { icon: MapPin, label: 'Location', value: '—', ...ROSE },
  ],
};

// Content rendered for each (unlocked) section.
export const SECTION_CARDS: Record<string, Card[]> = {
  'personal-info': [{ title: 'Personal Information', items: PERSONAL_INFO }],
  address: [
    {
      title: 'Current Address',
      items: [
        { icon: MapPin, label: 'Line', value: '24, 5th Cross, Indiranagar', ...BLUE },
        { icon: Building2, label: 'City', value: 'Bengaluru', ...VIOLET },
        { icon: MapPin, label: 'State', value: 'Karnataka', ...GREEN },
        { icon: Globe, label: 'Pincode', value: '560038', ...AMBER },
        { icon: Globe, label: 'Country', value: 'India', ...ROSE },
      ],
    },
    {
      title: 'Permanent Address',
      items: [
        { icon: MapPin, label: 'Line', value: '12, Gandhi Road, Civil Lines', ...BLUE },
        { icon: Building2, label: 'City', value: 'Jaipur', ...VIOLET },
        { icon: MapPin, label: 'State', value: 'Rajasthan', ...GREEN },
        { icon: Globe, label: 'Pincode', value: '302006', ...AMBER },
      ],
    },
  ],
  'family-nominees': [
    {
      title: 'Family',
      items: [
        { icon: User, label: 'Father', value: 'Ramesh Verma', ...BLUE },
        { icon: User, label: 'Mother', value: 'Sunita Verma', ...VIOLET },
        { icon: Heart, label: 'Marital Status', value: 'Single', ...ROSE, type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
      ],
    },
    {
      title: 'Nominee',
      items: [
        { icon: User, label: 'Name', value: 'Ramesh Verma', ...BLUE },
        { icon: Heart, label: 'Relation', value: 'Father', ...ROSE },
        { icon: BadgeCheck, label: 'Share', value: '100%', ...GREEN },
      ],
    },
  ],
  education: [
    {
      title: 'B.Tech — Computer Science',
      items: [
        { icon: GraduationCap, label: 'Institution', value: 'RTU, Kota', ...BLUE },
        { icon: CalendarDays, label: 'Year', value: '2014 – 2018', ...AMBER },
        { icon: BadgeCheck, label: 'Grade', value: '8.4 CGPA', ...GREEN },
      ],
    },
    {
      title: 'Higher Secondary (12th)',
      items: [
        { icon: GraduationCap, label: 'Board', value: 'CBSE', ...BLUE },
        { icon: CalendarDays, label: 'Year', value: '2014', ...AMBER },
        { icon: BadgeCheck, label: 'Grade', value: '92%', ...GREEN },
      ],
    },
  ],
  experience: [
    {
      title: 'Tech Corp — Software Engineer',
      items: [
        { icon: CalendarDays, label: 'Duration', value: 'Jul 2021 – Feb 2024', ...AMBER },
        { icon: MapPin, label: 'Location', value: 'Pune', ...ROSE },
      ],
    },
    {
      title: 'StartupX — Junior Developer',
      items: [
        { icon: CalendarDays, label: 'Duration', value: 'Jun 2018 – Jun 2021', ...AMBER },
        { icon: MapPin, label: 'Location', value: 'Bengaluru', ...ROSE },
      ],
    },
  ],
  // 'documents' is rendered by DocumentsCard (upload/view/replace), not here.
  'bank-identity': [
    {
      title: 'Bank Account',
      items: [
        { icon: Building2, label: 'Bank Name', value: 'HDFC Bank', ...BLUE },
        { icon: CreditCard, label: 'Account Number', value: 'XXXX XXXX 4821', ...VIOLET },
        { icon: CreditCard, label: 'IFSC Code', value: 'HDFC0001234', ...GREEN },
        { icon: User, label: 'Account Holder', value: 'Vishal Verma', ...AMBER },
      ],
    },
    {
      title: 'Identity',
      items: [
        { icon: BadgeCheck, label: 'PAN', value: 'ABCDE1234F', ...BLUE },
        { icon: BadgeCheck, label: 'Aadhaar', value: 'XXXX XXXX 9012', ...GREEN },
        { icon: BadgeCheck, label: 'UAN (PF)', value: '100987654321', ...ROSE },
      ],
    },
  ],
  compensation: [
    {
      title: 'Salary Structure',
      items: [
        { icon: Wallet, label: 'CTC (Annual)', value: '₹ 18,00,000', ...BLUE },
        { icon: Wallet, label: 'Basic', value: '₹ 60,000 / mo', ...VIOLET },
        { icon: Wallet, label: 'HRA', value: '₹ 24,000 / mo', ...GREEN },
        { icon: Wallet, label: 'Special Allowance', value: '₹ 36,000 / mo', ...AMBER },
      ],
    },
    {
      title: 'Payout',
      items: [
        { icon: CalendarDays, label: 'Pay Cycle', value: 'Monthly', ...ROSE },
        { icon: CreditCard, label: 'Mode', value: 'Bank Transfer', ...BLUE },
      ],
    },
  ],
};
