import { useEffect, useRef, type MutableRefObject, type ReactNode } from 'react';

// Declared here rather than imported from './AuthForm': on web that specifier
// resolves back to this very file, so importing from it would be circular.
// Keep in sync with AuthForm.tsx.
export type SubmitHandle = MutableRefObject<(() => void) | null>;

export type AuthFormProps = {
  children: ReactNode;
  onSubmit: () => void;
  submitHandle?: SubmitHandle;
  hiddenUsername?: string;
};

/**
 * A real <form> around the sign-in fields.
 *
 * Password managers decide whether to offer "save this login" by watching for
 * a form submission. A single-page app navigates nothing on sign-in, so with
 * no <form> — and no submit control inside it — Chrome and Safari usually never
 * prompt, and the user has to save the password by hand every time.
 *
 * `display: contents` removes the element from layout entirely, so the React
 * Native flex tree renders exactly as it does on native.
 */
export default function AuthForm({
  children,
  onSubmit,
  submitHandle,
  hiddenUsername,
}: AuthFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!submitHandle) return;
    submitHandle.current = () => {
      // requestSubmit() fires the submit event the way a real button click
      // does. form.submit() would skip it — and skip the password manager.
      formRef.current?.requestSubmit();
    };
    return () => {
      submitHandle.current = null;
    };
  }, [submitHandle]);

  return (
    <form
      ref={formRef}
      style={{ display: 'contents' }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {/* This sign-in is two-step: the email field unmounts when the password
          field appears, leaving a lone password input. Password managers pair
          a username with current-password, so without a username in the DOM
          Chrome and Safari get unreliable at both saving the credential and
          filling it back in. Mirroring the value into a hidden input for the
          password step is the documented fix for username-first flows.

          `hidden` rather than off-screen: the value still reaches the password
          manager, but the field is skipped for focus and by screen readers. */}
      {hiddenUsername === undefined ? null : (
        <input
          type="text"
          hidden
          readOnly
          autoComplete="username"
          value={hiddenUsername}
        />
      )}

      {children}
      {/* A submit control must exist for requestSubmit() to work and for the
          Enter key to submit the form. Never shown. */}
      <button
        type="submit"
        tabIndex={-1}
        aria-hidden
        style={{ display: 'none' }}
      />
    </form>
  );
}
