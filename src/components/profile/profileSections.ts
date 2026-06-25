import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CircleUser,
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
import { JOB_INFO, PERSONAL_INFO } from './profileData';

export type ProfileSection = {
  key: string; // route param
  label: string;
  icon: LucideIcon;
  locked?: boolean;
};

// The profile section menu (matches the design).
export const PROFILE_SECTIONS: ProfileSection[] = [
  { key: 'overview', label: 'Overview', icon: CircleUser },
  { key: 'personal-info', label: 'Personal info', icon: User },
  { key: 'address', label: 'Address', icon: MapPin },
  { key: 'bank-identity', label: 'Bank & identity', icon: CreditCard, locked: true },
  { key: 'family-nominees', label: 'Family & nominees', icon: Users },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'compensation', label: 'Compensation', icon: Wallet, locked: true },
];

type Card = { title: string; items: InfoItem[] };

const BLUE = { color: '#2563EB', badge: 'bg-blue-100' };
const GREEN = { color: '#059669', badge: 'bg-emerald-100' };
const VIOLET = { color: '#6B5FCF', badge: 'bg-violet-100' };
const AMBER = { color: '#D9A53B', badge: 'bg-amber-100' };
const ROSE = { color: '#E0785C', badge: 'bg-rose-100' };

// Content rendered for each (unlocked) section.
export const SECTION_CARDS: Record<string, Card[]> = {
  overview: [
    {
      title: 'At a glance',
      items: [
        ...JOB_INFO.slice(0, 4),
        PERSONAL_INFO[0],
        PERSONAL_INFO[1],
      ],
    },
  ],
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
        { icon: Heart, label: 'Marital Status', value: 'Single', ...ROSE },
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
  documents: [
    {
      title: 'Submitted Documents',
      items: [
        { icon: FileText, label: 'Offer Letter', value: 'Verified', ...GREEN },
        { icon: FileText, label: 'ID Proof (Aadhaar)', value: 'Verified', ...GREEN },
        { icon: FileText, label: 'PAN Card', value: 'Verified', ...GREEN },
        { icon: FileText, label: 'Degree Certificate', value: 'Pending', ...AMBER },
      ],
    },
  ],
};
