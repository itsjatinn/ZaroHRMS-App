import { Image, type ImageSourcePropType } from 'react-native';

// Fixed size so the artwork stays a contained accent above the form.
const WIDTH = 330;
const HEIGHT = (WIDTH * 2) / 3; // sources are 3:2 (1536×1024)

const DEFAULT_SOURCE = require('../../../assets/login_page.png');

/**
 * The hero illustration on the auth screens, shown above the form. Rendered as
 * the plain artwork (no card/frame behind it) so it sits directly on the page.
 * Pass `source` to show a screen-specific illustration (e.g. reset password).
 */
export default function LoginVisual({
  source = DEFAULT_SOURCE,
}: {
  source?: ImageSourcePropType;
}) {
  return (
    <Image
      source={source}
      style={{ width: WIDTH, height: HEIGHT, alignSelf: 'center' }}
      resizeMode="contain"
    />
  );
}
