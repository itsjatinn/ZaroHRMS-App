import { useEffect, type MutableRefObject, type ReactNode } from 'react';

/** Handle populated with a function that submits the form. */
export type SubmitHandle = MutableRefObject<(() => void) | null>;

export type AuthFormProps = {
  children: ReactNode;
  /** Runs when the form is submitted. */
  onSubmit: () => void;
  /** Filled with a submit trigger so a custom button can drive the form. */
  submitHandle?: SubmitHandle;
  /**
   * Username to keep in the DOM while the visible field is unmounted, so a
   * browser password manager still sees a username/password pair. Web only —
   * pass it only on the step where the real email field is not rendered.
   */
  hiddenUsername?: string;
};

/**
 * Native has no <form> element — the fields already submit through their own
 * `onSubmitEditing`, so this is a transparent passthrough and renders nothing
 * of its own.
 *
 * The web build resolves the sibling AuthForm.web.tsx, which renders a real
 * <form> so browser password managers offer to save the credentials.
 */
export default function AuthForm({
  children,
  onSubmit,
  submitHandle,
}: AuthFormProps) {
  useEffect(() => {
    if (!submitHandle) return;
    submitHandle.current = onSubmit;
    return () => {
      submitHandle.current = null;
    };
  }, [onSubmit, submitHandle]);

  return <>{children}</>;
}
