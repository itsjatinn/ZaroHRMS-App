import { Linking, Text, View } from 'react-native';

import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  brandAlpha,
  htmlToBlocks,
  safeLinkUrl,
  UNREAD_ACCENT,
  type InlineSpan,
  type RichBlock,
} from './announcementsData';

/** Heading sizes mirror the web's .anc__rich h1–h4 scale. */
const HEADING_SIZE: Record<number, number> = {
  1: 17,
  2: 16,
  3: 15,
  4: 14,
  5: 14,
  6: 14,
};

function Spans({ spans, color }: { spans: InlineSpan[]; color: string }) {
  return (
    <>
      {spans.map((span, index) => {
        const href = safeLinkUrl(span.href);
        return (
          <Text
            key={index}
            onPress={href ? () => void Linking.openURL(href) : undefined}
            style={{
              color: href ? UNREAD_ACCENT : span.bold ? BRAND_PRIMARY : color,
              fontWeight: span.bold ? '700' : '400',
              fontStyle: span.italic ? 'italic' : 'normal',
              textDecorationLine:
                span.underline || href ? 'underline' : 'none',
            }}
          >
            {span.text}
          </Text>
        );
      })}
    </>
  );
}

/**
 * Renders a composer-authored HTML body. `html` is parsed into blocks first —
 * see htmlToBlocks — so only the composer's own tags survive; everything else
 * degrades to plain text.
 */
export default function RichText({ html }: { html: string }) {
  const blocks = htmlToBlocks(html);
  if (blocks.length === 0) return null;

  const bodyColor = brandAlpha(0.82);

  return (
    <View className="gap-1.5">
      {blocks.map((block, index) => (
        <Block key={index} block={block} bodyColor={bodyColor} />
      ))}
    </View>
  );
}

function Block({
  block,
  bodyColor,
}: {
  block: RichBlock;
  bodyColor: string;
}) {
  if (block.kind === 'heading') {
    return (
      <Text
        className="mt-1.5 font-bold"
        style={{
          color: BRAND_PRIMARY,
          fontSize: HEADING_SIZE[block.level] ?? 14,
          lineHeight: (HEADING_SIZE[block.level] ?? 14) * 1.3,
        }}
      >
        <Spans spans={block.spans} color={BRAND_PRIMARY} />
      </Text>
    );
  }

  if (block.kind === 'quote') {
    return (
      <View
        className="my-1 rounded-r-lg border-l-[3px] px-3 py-2"
        style={{
          borderLeftColor: BRAND_SECONDARY,
          backgroundColor: brandAlpha(0.06),
        }}
      >
        <Text
          className="text-[13px] italic leading-[21px]"
          style={{ color: BRAND_PRIMARY }}
        >
          <Spans spans={block.spans} color={BRAND_PRIMARY} />
        </Text>
      </View>
    );
  }

  if (block.kind === 'listItem') {
    return (
      <View className="flex-row gap-2 pl-1">
        <Text
          className="text-[13px] leading-[21px]"
          style={{ color: brandAlpha(0.6) }}
        >
          {block.ordered ? `${block.index}.` : '•'}
        </Text>
        <Text
          className="flex-1 text-[13px] leading-[21px]"
          style={{ color: bodyColor }}
        >
          <Spans spans={block.spans} color={bodyColor} />
        </Text>
      </View>
    );
  }

  return (
    <Text className="text-[13px] leading-[21px]" style={{ color: bodyColor }}>
      <Spans spans={block.spans} color={bodyColor} />
    </Text>
  );
}
