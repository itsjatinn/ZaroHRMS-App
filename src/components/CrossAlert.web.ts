import type { AlertButton, AlertOptions } from 'react-native';

// Web replacement for React Native's Alert. react-native-web's own Alert is
// `class Alert { static alert() {} }` — a no-op — so without this the app loses
// every error message on web, and every confirmation button's onPress never
// fires (sign-out and approve/reject look like dead buttons).
//
// Rendered as an in-app dialog styled like the rest of the UI, not
// window.alert/confirm: the browser dialogs prepend "localhost:8081 says",
// look nothing like the app, and cap a button list at two choices. Plain DOM
// rather than React because Alert.alert is imperative and fires from anywhere,
// including outside the component tree.

const INK = '#14323F';
const SLATE = '#64748B';
const DANGER = '#F43F5E';
const FONT =
  "PlusJakartaSans_400Regular, 'Plus Jakarta Sans', system-ui, sans-serif";
const FONT_BOLD =
  "PlusJakartaSans_700Bold, 'Plus Jakarta Sans', system-ui, sans-serif";

/** One dialog at a time; later calls wait — native Alert queues the same way. */
const queue: (() => void)[] = [];
let open = false;

function drain() {
  const next = queue.shift();
  if (next) next();
  else open = false;
}

function show(
  title: string,
  message: string | undefined,
  buttons: AlertButton[],
  cancelButton: AlertButton | undefined,
): void {
  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const backdrop = document.createElement('div');
  backdrop.setAttribute('role', 'presentation');
  Object.assign(backdrop.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: 'rgba(11, 31, 39, 0.45)',
    opacity: '0',
    transition: 'opacity 160ms ease',
  } as CSSStyleDeclaration);

  const card = document.createElement('div');
  card.setAttribute('role', 'alertdialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', title);
  Object.assign(card.style, {
    width: '100%',
    maxWidth: '320px',
    borderRadius: '24px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 18px 40px rgba(11, 31, 39, 0.28)',
    padding: '22px 20px 16px',
    boxSizing: 'border-box',
    transform: 'scale(0.94)',
    transition: 'transform 160ms ease',
    fontFamily: FONT,
  } as CSSStyleDeclaration);

  const heading = document.createElement('div');
  heading.textContent = title;
  Object.assign(heading.style, {
    fontFamily: FONT_BOLD,
    fontWeight: '700',
    fontSize: '16px',
    lineHeight: '22px',
    color: INK,
    textAlign: 'center',
  } as CSSStyleDeclaration);
  card.appendChild(heading);

  if (message) {
    const body = document.createElement('div');
    body.textContent = message;
    Object.assign(body.style, {
      marginTop: '8px',
      fontSize: '13px',
      lineHeight: '20px',
      color: SLATE,
      textAlign: 'center',
      whiteSpace: 'pre-line',
    } as CSSStyleDeclaration);
    card.appendChild(body);
  }

  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex',
    flexDirection: buttons.length > 2 ? 'column' : 'row',
    gap: '10px',
    marginTop: '18px',
  } as CSSStyleDeclaration);
  card.appendChild(row);

  let settled = false;
  const close = (button?: AlertButton) => {
    if (settled) return;
    settled = true;
    document.removeEventListener('keydown', onKey, true);
    backdrop.style.opacity = '0';
    card.style.transform = 'scale(0.94)';
    window.setTimeout(() => {
      backdrop.remove();
      previousFocus?.focus?.();
      // The handler runs after the dialog is gone, mirroring native, and any
      // queued alert only opens once this one has fully left.
      button?.onPress?.();
      drain();
    }, 160);
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && cancelButton) {
      event.preventDefault();
      close(cancelButton);
    }
  };

  // Cancel first so the acting button sits on the right, like the native
  // dialogs and every confirm sheet in the app.
  const ordered = cancelButton
    ? [cancelButton, ...buttons.filter((b) => b !== cancelButton)]
    : buttons;

  ordered.forEach((button) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = button.text ?? 'OK';
    const destructive = button.style === 'destructive';
    const isCancel = button === cancelButton && ordered.length > 1;
    Object.assign(el.style, {
      flex: '1',
      minHeight: '44px',
      padding: '10px 14px',
      borderRadius: '14px',
      fontFamily: FONT_BOLD,
      fontWeight: '700',
      fontSize: '14px',
      cursor: 'pointer',
      border: isCancel ? '1px solid #E2E8F0' : '1px solid transparent',
      backgroundColor: isCancel ? '#FFFFFF' : destructive ? DANGER : INK,
      color: isCancel ? INK : '#FFFFFF',
    } as CSSStyleDeclaration);
    el.addEventListener('click', () => close(button));
    row.appendChild(el);
  });

  // Tapping the dim area is the same opt-out gesture as Android's back
  // dismissal — only honoured when there is a cancel branch to run.
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop && cancelButton) close(cancelButton);
  });
  document.addEventListener('keydown', onKey, true);

  backdrop.appendChild(card);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => {
    backdrop.style.opacity = '1';
    card.style.transform = 'scale(1)';
    (row.lastElementChild as HTMLElement | null)?.focus?.();
  });
}

export const Alert = {
  /**
   * Matches React Native's Alert.alert signature. `options` is accepted and
   * ignored — its fields (cancelable, onDismiss, userInterfaceStyle) have no
   * equivalent here, and dropping it silently keeps call sites identical
   * across platforms.
   */
  alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    _options?: AlertOptions,
  ): void {
    const list: AlertButton[] =
      buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];

    // Native convention marks the opt-out with `style: 'cancel'`. A single
    // acknowledge button has no cancel branch — Escape/backdrop then resolve
    // through that sole button instead of silently dropping its handler.
    const cancelButton =
      list.length === 1
        ? list[0]
        : list.find((b) => b.style === 'cancel') ?? list[list.length - 1];

    const present = () => show(title, message, list, cancelButton);
    if (open) queue.push(present);
    else {
      open = true;
      present();
    }
  },
};
