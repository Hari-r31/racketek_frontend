/**
 * lib/auth.ts
 * ===========
 * Google Sign-In (GSI) helpers.
 *
 * Responsibilities:
 *  - Load the official GSI script once (idempotent)
 *  - Expose signInWithGoogle() which opens the One-Tap / popup flow
 *    and resolves with the raw id_token string
 *  - NEVER decode or trust the token — that is the backend's job
 *
 * Usage:
 *   import { signInWithGoogle } from "@/lib/auth";
 *   const idToken = await signInWithGoogle();
 *   // send idToken to POST /auth/oauth/google immediately
 */

// Extend window for the Google GSI SDK
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
  credential: string; // This is the id_token — must go to backend immediately
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

// ─── Script Loader ────────────────────────────────────────────────────────────

let scriptLoadPromise: Promise<void> | null = null;

/**
 * Loads https://accounts.google.com/gsi/client exactly once per page.
 * Subsequent calls return the same promise.
 */
export function loadGsiScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve(); // SSR guard
  }

  // Already loaded
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  // Already loading
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    // Guard: script tag might already exist in DOM (e.g. hot reload)
    if (document.querySelector('script[src*="gsi/client"]')) {
      // Wait for it to finish
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null; // allow retry
      reject(new Error("Failed to load Google Sign-In SDK"));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

// ─── Sign-In Flow ─────────────────────────────────────────────────────────────

/**
 * Opens the Google One-Tap / popup sign-in flow.
 *
 * Returns the raw id_token string from Google.
 * DO NOT decode it. Send it to POST /auth/oauth/google immediately.
 *
 * Throws if:
 *  - NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set
 *  - User dismisses / skips the prompt
 *  - GSI script fails to load
 */
export function signInWithGoogle(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return Promise.reject(
      new Error(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. " +
          "Add it to .env and restart the dev server."
      )
    );
  }

  return new Promise<string>(async (resolve, reject) => {
    try {
      await loadGsiScript();
    } catch (err) {
      reject(err);
      return;
    }

    if (!window.google?.accounts?.id) {
      reject(new Error("Google Sign-In SDK did not initialize correctly"));
      return;
    }

    let settled = false;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: CredentialResponse) => {
        if (settled) return;
        settled = true;

        if (!response.credential) {
          reject(new Error("No credential returned from Google"));
          return;
        }

        // This is the id_token. Hand it to the caller; never inspect it.
        resolve(response.credential);
      },
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.prompt((notification) => {
      if (settled) return;

      if (notification.isSkippedMoment()) {
        settled = true;
        reject(new Error("google_sign_in_skipped"));
      }

      if (notification.isDismissedMoment()) {
        const reason = notification.getDismissedReason();
        // "credential_returned" means callback already fired — not an error
        if (reason !== "credential_returned") {
          settled = true;
          reject(new Error(`google_sign_in_dismissed:${reason}`));
        }
      }
    });
  });
}

// ─── Render Button Helper ─────────────────────────────────────────────────────

/**
 * Renders the official Google Sign-In button into a container element.
 * Returns a cleanup function that cancels any pending prompt.
 *
 * @param container - The DOM element to render into
 * @param onToken   - Called with the raw id_token on success
 * @param onError   - Called with an Error on failure
 * @param options   - Optional button appearance config
 */
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

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: CredentialResponse) => {
      if (!response.credential) {
        onError(new Error("No credential returned from Google"));
        return;
      }
      onToken(response.credential);
    },
    cancel_on_tap_outside: true,
  });

  window.google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rectangular",
    width: container.offsetWidth || 400,
    ...options,
  });

  // Return cleanup
  return () => {
    window.google?.accounts.id.cancel();
  };
}
