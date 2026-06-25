export type Holiday = {
  day: string;
  month: string;
  name: string;
  type: string; // Festival / National / Restricted / Optional
  note: string; // Office closed / Optional / etc.
  bg: string;
  text: string;
};

export const FEATURED_HOLIDAY = {
  day: '23',
  month: 'JUN',
  countdown: 'IN 4 DAYS',
  name: 'Buddha Purnima',
  type: 'Festival',
  note: 'Office closed',
};

export const HOLIDAYS: Holiday[] = [
  { day: '14', month: 'JUL', name: 'Eid al-Adha', type: 'Restricted', note: 'Pick 2 of 5', bg: '#F0E2B6', text: '#B8881F' },
  { day: '29', month: 'JUL', name: "Founders' Day", type: 'Optional', note: 'Floater', bg: '#E0DBF5', text: '#6B5FCF' },
  { day: '15', month: 'AUG', name: 'Independence Day', type: 'National', note: 'Office closed', bg: '#DCE7F7', text: '#2563EB' },
  { day: '02', month: 'OCT', name: 'Gandhi Jayanti', type: 'National', note: 'Office closed', bg: '#DCE7F7', text: '#2563EB' },
  { day: '21', month: 'OCT', name: 'Diwali', type: 'Festival', note: 'Office closed', bg: '#F6DDD3', text: '#C0552F' },
  { day: '25', month: 'DEC', name: 'Christmas', type: 'Festival', note: 'Office closed', bg: '#CFE6D4', text: '#3F8F5B' },
];
