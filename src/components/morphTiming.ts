import { Easing } from 'react-native-reanimated';

/**
 * Shared timing for the profile popup → home-card handoff. The overlay card
 * flies up and fades while the home card rises into place; using ONE duration
 * and easing for both keeps them in lockstep so it reads as a single motion.
 */
export const EXIT_DURATION = 460;
export const EXIT_EASING = Easing.inOut(Easing.cubic);

// How far the home card rises from (px) as it settles in — small, since it only
// needs to travel the last leg toward its resting spot.
export const LAND_RISE = 46;
