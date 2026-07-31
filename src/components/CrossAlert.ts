// Native platforms: re-export React Native's Alert unchanged, so call sites get
// the exact same API. The web build resolves the sibling CrossAlert.web.ts
// instead (Metro picks .web.ts automatically) — same pattern as
// CrossDatePicker and src/auth/secureStorage.
//
// Import this everywhere instead of `Alert` from 'react-native':
// react-native-web ships `class Alert { static alert() {} }` — an empty
// function — so on web every message silently vanishes and every button
// callback never fires.
export { Alert } from 'react-native';
