/**
 * lib/auth.ts
 * ===========
 * Google Sign-In (GSI) helpers.
 *
 * Responsibilities:
 *  - Load the official GSI script once (idempotent)
 *  - Initialize google.accounts.id ONCE per page load (idempotent)
 *  - Expose renderGoogleButton() which renders the official button
 *  - NEVER decode or trust the token — that is the backend's job
 *
 * Key invariant:
 *  google.accounts.id.initialize() is called AT MOST ONCE per page load.
 *  Multiple calls would silently overwrite the callback, causing credential
 *  delivery to the wrong handler. A module-level flag guards this.
 */

// ─── Window type extension ────────────────────────────────────────────────────

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          prompt: (
            momentListener?: (notification: PromptMomentNotification) => void
          ) => void;
          renderButton: (
            parent: HTMLElement,
            options: RenderButtonOptions
          ) => void;
          cancel: () => void;
          revoke: (hint: string, callback: (done: RevokeDone) => void) => void;
        };
      };
    };
  }
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface CredentialResponse {
  /** Raw id_token — must be sent to backend immediately, never decoded here */
  credential: string;
  select_by?: string;
}

interface PromptMomentNotification {
  isDisplayMoment: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
}

interface RenderButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}

interface RevokeDone {
  successful: boolean;
  error?: string;
}

// ─── Module-level singletons ──────────────────────────────────────────────────

/**
 * Promise that resolves when the GSI script is loaded.
 * Null until the first call to loadGsiScript().
 * Reused on subsequent calls — script is only injected once.
 */
let scriptLoadPromise: Promise<void> | null = null;

/**
 * Tracks whether google.accounts.id.initialize() has been called.
 * Prevents multiple initializations which would silently overwrite
 * the credential callback and break concurrent button instances.
 *
 * Reset to null when the client_id changes (edge case: hot reload
 * with a different env var).
 */
let initializedClientId: string | null = null;

// ─── Script loader ────────────────────────────────────────────────────────────

/**
 * Loads https://accounts.google.com/gsi/client exactly once per page.
 * Subsequent calls return the cached promise — no duplicate script tags.
 */
export function loadGsiScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve(); // SSR guard
  }

  // SDK already present (e.g. hot reload after first load)
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  // Already loading — return the same promise
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    // Script tag exists but SDK not yet ready (e.g. script already in HTML)
    if (document.querySelector('script[src*="gsi/client"]')) {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
      // Safety timeout after 10 s
      setTimeout(() => {
        clearInterval(interval);
        if (!window.google?.accounts?.id) {
          scriptLoadPromise = null;
          reject(new Error("Google Sign-In SDK timed out"));
        }
      }, 10_000);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null; // allow retry on next call
      reject(new Error("Failed to load Google Sign-In SDK"));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

// ─── Initialize (once) ───────────────────────────────────────────────────────

/**
 * Call google.accounts.id.initialize() exactly once per client_id per page.
 *
 * Subsequent calls with the same client_id are no-ops.
 * If the client_id changes (shouldn't happen in normal use), re-initializes.
 *
 * IMPORTANT: The callback passed here is a STABLE reference stored at the
 * module level. GoogleLoginButton passes a wrapper that reads the latest
 * per-instance callback via a ref, so we can call initialize() once while
 * still supporting multiple button instances.
 */
function ensureInitialized(clientId: string, callback: (r: CredentialResponse) => void): void {
  if (!window.google?.accounts?.id) return;

  if (initializedClientId === clientId) {
    // Already initialized with this client_id — do NOT call initialize again.
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback,
    cancel_on_tap_outside: true,
  });

  initializedClientId = clientId;
}

// ─── Render button ────────────────────────────────────────────────────────────

/**
 * Renders the official Google Sign-In button into a container element.
 *
 * initialize() is called AT MOST ONCE per page load regardless of how many
 * times renderGoogleButton() is called (login page + register page both use it).
 * The credential callback is routed through a stable module-level ref so the
 * correct per-instance handler always receives the credential.
 *
 * @param container - DOM element to render the button into
 * @param onToken   - Called with the raw id_token on success
 * @param onError   - Called with an Error on failure
 * @param options   - Optional button appearance overrides
 * @returns Cleanup function — call on component unmount
 */

// Stable callback ref shared across all renderGoogleButton instances.
// When a credential arrives we dispatch it to whichever onToken is current.
let activeTokenHandler: ((idToken: string) => void) | null = null;
let activeErrorHandler: ((err: Error) => void) | null = null;

export async function renderGoogleButton(
  container: HTMLElement,
  onToken: (idToken: string) => void,
  onError: (err: Error) => void,
  options: RenderButtonOptions = {}
): Promise<() => void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    onError(
      new Error(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. " +
          "Add it to .env and restart the dev server."
      )
    );
    return () => {};
  }

  try {
    await loadGsiScript();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
    return () => {};
  }

  if (!window.google?.accounts?.id) {
    onError(new Error("Google Sign-In SDK did not initialize correctly"));
    return () => {};
  }

  // Register this instance as the active handler.
  // If two buttons are mounted simultaneously (shouldn't happen, but safe),
  // the last-registered one handles the credential — consistent with the
  // single credential flow.
  activeTokenHandler = onToken;
  activeErrorHandler = onError;

  // The stable callback passed to initialize() — always dispatches to
  // whatever activeTokenHandler is current at the time of invocation.
  const stableCallback = (response: CredentialResponse) => {
    if (!response.credential) {
      activeErrorHandler?.(new Error("No credential returned from Google"));
      return;
    }
    activeTokenHandler?.(response.credential);
  };

  // Initialize once — no-op if already done for this clientId
  ensureInitialized(clientId, stableCallback);

  // Render the button (safe to call multiple times — SDK handles it)
  window.google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rectangular",
    width: container.offsetWidth || 400,
    ...options,
  });

  // Return cleanup: deregister this instance's handlers on unmount
  return () => {
    if (activeTokenHandler === onToken) activeTokenHandler = null;
    if (activeErrorHandler === onError) activeErrorHandler = null;
    window.google?.accounts.id.cancel();
  };
}
