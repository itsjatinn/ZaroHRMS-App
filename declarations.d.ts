// Lets TypeScript understand `import Logo from './x.svg'` (transformed into a
// React component by react-native-svg-transformer, configured in metro.config.js).
declare module '*.svg' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';

  const content: React.FC<SvgProps>;
  export default content;
}
