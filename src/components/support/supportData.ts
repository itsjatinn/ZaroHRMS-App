import { Mail, MessageCircle, Phone } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export type Contact = {
  label: string;
  icon: LucideIcon;
  color: string;
  badge: string;
  action: string;
};

export const CONTACTS: Contact[] = [
  { label: 'Email', icon: Mail, color: '#2563EB', badge: 'bg-blue-100', action: 'support@zarohrms.com' },
  { label: 'Call', icon: Phone, color: '#059669', badge: 'bg-emerald-100', action: '+91 1800 123 456' },
  { label: 'Chat', icon: MessageCircle, color: '#6B5FCF', badge: 'bg-violet-100', action: 'Live chat 9am–6pm' },
];

export const FAQS = [
  { q: 'How do I apply for leave?', a: 'Go to the Leave tab and tap "Apply Leave". Pick your dates, leave type, and reason, then submit for approval.' },
  { q: 'When are payslips released?', a: 'Payslips are generated on the last working day of each month and are available under the Payslips tab.' },
  { q: 'How do I regularize attendance?', a: 'Open the Attendance page or use the Regularize quick action, then submit the corrected punch time with a reason.' },
  { q: 'Who approves my requests?', a: 'Requests are routed to your reporting manager. You can track their status under the Requests page.' },
];
