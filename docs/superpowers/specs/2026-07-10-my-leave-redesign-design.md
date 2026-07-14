# My Leave Page Redesign — Design

Date: 2026-07-10 · Approved in conversation

## Principle

The home page (`LeaveBalanceCard`, `ClockInCard`) is the design system: ink text,
white rounded cards, slate neutrals, color only as tiny dots, monochrome icons.
Direction chosen: **dot-coded minimal**.

## Changes

### BalanceTile (src/components/leave/BalanceTile.tsx)
- Width 88px → 132px, `rounded-2xl`, `p-4`
- 6px colored dot + uppercase label (home-page legend style)
- Number `text-3xl font-extrabold text-ink`, new "days left" caption in slate-400
- Consumed by My Leave and Apply Leave — both inherit

### Balance carousel (app/(drawer)/(tabs)/leave.tsx)
- Keep horizontal ScrollView; add `snapToInterval` + `decelerationRate="fast"`

### RequestCard (src/components/leave/RequestCard.tsx)
- Remove pastel icon pills, left status strip, `iconColor`/`badgeClass` props
- Icon: neutral tile `bg-slate-50` + hairline border, ink icon
- Status pill softened: 50-tint bg, 700 text, tiny dot
- "Cancel leave": red-filled pill → plain red text action under hairline divider

### Page polish
- "Requests" heading → uppercase eyebrow matching "Balance"
- "View all" link `text-blue-600` → ink `font-bold`
- `requestsData.ts` drops `iconColor`/`badgeClass`

## Not doing
- No new balance data (number-only cards, user's choice)
- No changes to apply-leave form internals, regularize, WFH
- Status semantics unchanged (green/amber/red), just quieter
