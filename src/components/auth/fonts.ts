// The global Text default is PlusJakartaSans_400Regular (see app/_layout.tsx),
// so heavier weights must set the family explicitly to render correctly on
// Android. Use these instead of relying on `font-bold` alone.
export const font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;
