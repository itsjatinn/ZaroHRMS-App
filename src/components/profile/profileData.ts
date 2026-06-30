import {
  Briefcase,
  Building2,
  Cake,
  CalendarDays,
  Clock,
  Droplet,
  Heart,
  Mail,
  MapPin,
  Phone,
  User,
  UserCheck,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { currentUser } from '../../data/currentUser';

export type InfoItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  badge: string;
};

export const PROFILE = {
  name: currentUser.name,
  employeeId: currentUser.employeeId,
  avatar: currentUser.avatar,
  designation: 'Senior Software Engineer',
  department: 'Engineering',
};

export const PERSONAL_INFO: InfoItem[] = [
  { icon: Mail, label: 'Email', value: 'jittu.verma@zarohrms.com', color: '#2563EB', badge: 'bg-blue-100' },
  { icon: Phone, label: 'Phone', value: '+91 98765 43210', color: '#059669', badge: 'bg-emerald-100' },
  { icon: Cake, label: 'Date of Birth', value: '14 Aug 1996', color: '#E0785C', badge: 'bg-rose-100' },
  { icon: User, label: 'Gender', value: 'Male', color: '#6B5FCF', badge: 'bg-violet-100' },
  { icon: Droplet, label: 'Blood Group', value: 'O+', color: '#E11D48', badge: 'bg-rose-100' },
  { icon: MapPin, label: 'Address', value: 'Bengaluru, Karnataka', color: '#D9A53B', badge: 'bg-amber-100' },
];

export const JOB_INFO: InfoItem[] = [
  { icon: Briefcase, label: 'Designation', value: 'Senior Software Engineer', color: '#2563EB', badge: 'bg-blue-100' },
  { icon: Building2, label: 'Department', value: 'Engineering', color: '#6B5FCF', badge: 'bg-violet-100' },
  { icon: UserCheck, label: 'Reporting Manager', value: 'Akash Mehta', color: '#059669', badge: 'bg-emerald-100' },
  { icon: CalendarDays, label: 'Date of Joining', value: '12 Mar 2024', color: '#D9A53B', badge: 'bg-amber-100' },
  { icon: Clock, label: 'Employee Type', value: 'Full-time', color: '#0EA5E9', badge: 'bg-sky-100' },
  { icon: MapPin, label: 'Work Location', value: 'Bengaluru HQ', color: '#E0785C', badge: 'bg-rose-100' },
];

export const EMERGENCY_INFO: InfoItem[] = [
  { icon: User, label: 'Name', value: 'Ramesh Verma', color: '#2563EB', badge: 'bg-blue-100' },
  { icon: Heart, label: 'Relation', value: 'Father', color: '#E11D48', badge: 'bg-rose-100' },
  { icon: Phone, label: 'Phone', value: '+91 91234 56789', color: '#059669', badge: 'bg-emerald-100' },
];
