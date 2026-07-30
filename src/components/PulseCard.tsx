import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  DEFAULT_PULSE_REACTIONS,
  useActivePulse,
  useSubmitPulseReaction,
  type PulseReaction,
} from '../api/pulse';
import { useAuth } from '../auth/AuthContext';
import { celebrate, CELEBRATION_MS } from './pulse/pulseCelebration';

/** Fallback shown before /active answers, or on the offline demo session. */
const FALLBACK_QUESTION = 'How are you feeling about work today?';

/**
 * Asked once per app launch. Module-level, so it resets when the app process
 * restarts and the prompt returns on the next open — the same latch the home
 * profile popup uses.
 */
let askedThisLaunch = false;

/**
 * Pulse check card — the HR-published question plus the emoji scale, mirroring
 * the web panel's GreetingWidget. Whatever HR makes active on the web appears
 * here; the reaction list comes from the server too, so a changed scale needs
 * no app release.
 */
export default function PulseCard() {
  const { isBackendSession } = useAuth();
  // Gated on a real session: the demo session carries no bearer token, and an
  // unrecoverable 401 makes the API client sign the user out.
  const pulse = useActivePulse(isBackendSession);
  const submit = useSubmitPulseReaction();

  /** Demo-only selection, so the scale is still explorable without a backend. */
  const [localEmoji, setLocalEmoji] = useState<string | null>(null);

  // Claim this launch's single showing on first mount. A later mount (sign out
  // and back in, say) finds the latch set and renders nothing.
  const [isThisLaunchsAsk] = useState(() => {
    if (askedThisLaunch) return false;
    askedThisLaunch = true;
    return true;
  });
  const [dismissed, setDismissed] = useState(false);
  /** Whether the answer was already on record when this launch loaded. */
  const answeredOnArrival = useRef<boolean | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nothing to ask if they already answered the active question — on this
  // device or another. Captured once, so the cache patch from our own submit
  // below doesn't trip it and cut the confirmation short.
  useEffect(() => {
    if (!pulse.data || answeredOnArrival.current !== null) return;
    answeredOnArrival.current = Boolean(pulse.data.response);
    if (answeredOnArrival.current) setDismissed(true);
  }, [pulse.data]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const question = pulse.data?.question.question ?? FALLBACK_QUESTION;
  const reactions: PulseReaction[] =
    pulse.data?.reactions?.length ? pulse.data.reactions : DEFAULT_PULSE_REACTIONS;

  const serverEmoji = pulse.data?.response?.emoji ?? null;
  const selectedEmoji = isBackendSession ? serverEmoji : localEmoji;
  const selectedLabel =
    reactions.find((r) => r.emoji === selectedEmoji)?.label ??
    pulse.data?.response?.label ??
    null;

  const choose = (emoji: string) => {
    if (submit.isPending) return;
    // Fires immediately, before any network work — the celebration is feedback
    // for the tap, not for the save.
    celebrate(emoji);

    // Answered — step aside once the burst and the confirmation have been seen,
    // so home isn't carrying a question that's already been dealt with.
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setDismissed(true), CELEBRATION_MS);

    const questionId = pulse.data?.question.id;
    // No question id means nothing to attach a reaction to — keep the tap local
    // rather than firing a request the backend would reject.
    if (!isBackendSession || !questionId) {
      setLocalEmoji(emoji);
      return;
    }
    submit.mutate({ questionId, emoji });
  };

  if (!isThisLaunchsAsk || dismissed) return null;

  return (
    // Deliberately no card chrome — this sits directly on the page, reading as
    // a continuation of the header greeting rather than a separate surface.
    // The negative top margin eats into the home page's gap-5 under the header,
    // so the prompt sits close to the greeting it belongs with.
    <View className="-mt-4 items-center gap-2.5">
      <Text className="text-center text-[15px] leading-[21px] text-slate-500">
        {question}
      </Text>

      <View className="flex-row items-center justify-center gap-2">
        {reactions.map((reaction) => {
          const selected = reaction.emoji === selectedEmoji;
          return (
            <Pressable
              key={reaction.emoji}
              onPress={() => choose(reaction.emoji)}
              disabled={submit.isPending}
              accessibilityRole="button"
              accessibilityLabel={reaction.label}
              accessibilityState={{ selected }}
              className="h-10 w-10 items-center justify-center active:scale-90"
              // No pill or ring — the choice reads through opacity alone: the
              // picked emoji stays full strength while the rest fade back.
              style={{ opacity: selected || !selectedEmoji ? 1 : 0.4 }}
            >
              <Text className="text-[24px]">{reaction.emoji}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedLabel ? (
        <Text className="text-center text-xs text-slate-400">
          {isBackendSession
            ? `Your response is saved as ${selectedLabel}.`
            : `${selectedLabel} — sign in against the HRMS backend to save this.`}
        </Text>
      ) : submit.isError ? (
        <Text className="text-center text-xs text-rose-500">
          Could not save your response. Tap again to retry.
        </Text>
      ) : (
        <Text className="text-center text-xs text-slate-400">
          Your answer is shared with HR as part of the team pulse.
        </Text>
      )}
    </View>
  );
}
