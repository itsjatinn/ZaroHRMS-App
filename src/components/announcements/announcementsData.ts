export type Announcement = {
  title: string;
  category: string;
  color: string; // category text color
  badge: string; // category badge background
  date: string;
  excerpt: string;
  pinned?: boolean;
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    title: 'Office closed for Buddha Purnima',
    category: 'Holiday',
    color: '#C0552F',
    badge: 'bg-rose-100',
    date: '18 Jun 2026',
    excerpt: 'The office will remain closed on 23rd June. Plan your work accordingly and enjoy the long weekend.',
    pinned: true,
  },
  {
    title: 'Q2 All-Hands Meeting',
    category: 'Event',
    color: '#2563EB',
    badge: 'bg-blue-100',
    date: '16 Jun 2026',
    excerpt: 'Join us this Friday at 4 PM in the main hall for the quarterly review and roadmap discussion.',
  },
  {
    title: 'New Health Insurance Policy',
    category: 'HR',
    color: '#059669',
    badge: 'bg-emerald-100',
    date: '12 Jun 2026',
    excerpt: 'Updated medical coverage now includes dependents. Check your email for enrollment details.',
  },
  {
    title: 'Wellness Week activities',
    category: 'Culture',
    color: '#6B5FCF',
    badge: 'bg-violet-100',
    date: '08 Jun 2026',
    excerpt: 'Yoga, mindfulness sessions, and a step challenge — sign up at the front desk to participate.',
  },
];
