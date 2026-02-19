// Lightweight helper to fetch a Google ID token using Google Identity Services
// Requires VITE_GOOGLE_CLIENT_ID to be set in the frontend env

let googleScriptPromise = null;

const loadGoogleScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Identity is unavailable during SSR'));
  }

  if (googleScriptPromise) return googleScriptPromise;

  const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
  if (existing) {
    googleScriptPromise = new Promise((resolve, reject) => {
      if (existing.dataset.loaded === 'true') {
        resolve();
      } else {
        existing.addEventListener('load', () => {
          existing.dataset.loaded = 'true';
          resolve();
        });
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity script')));
      }
    });
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity script'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

export const getGoogleIdToken = async (clientId) => {
  if (!clientId) {
    throw new Error('Google Client ID missing. Set VITE_GOOGLE_CLIENT_ID in the frontend env.');
  }

  await loadGoogleScript();

  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity is unavailable. Please refresh and try again.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let triedFallback = false;
    let fallbackTimer = null;

    const clearFallbackTimer = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const finalizeError = (message) => {
      if (!settled) {
        clearFallbackTimer();
        console.error('[Google OAuth] Failed to get ID token', {
          message,
          origin: window.location.origin,
          clientId,
        });
        settled = true;
        reject(new Error(message));
      }
    };

    const handleCredential = (response, label) => {
      if (response?.credential) {
        clearFallbackTimer();
        settled = true;
        resolve(response.credential);
      } else {
        finalizeError(`Google sign-in did not return a credential${label ? ` (${label})` : ''}.`);
      }
    };

    const handleNotification = (notification, label) => {
      if (settled) return;
      if (notification.isSkippedMoment && notification.isSkippedMoment()) {
        finalizeError(`Google sign-in was skipped${label ? ` (${label})` : ''}.`);
      } else if (notification.isDismissedMoment && notification.isDismissedMoment()) {
        const reason = notification.getDismissedReason && notification.getDismissedReason();
        finalizeError(reason || `Google sign-in was dismissed${label ? ` (${label})` : ''}.`);
      }
    };

    const startPrompt = (useFedcm, label) => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => handleCredential(response, label),
        use_fedcm_for_prompt: useFedcm,
      });
      window.google.accounts.id.prompt((notification) => handleNotification(notification, label));
    };

    // Start with FedCM prompt first.
    startPrompt(true, 'fedcm');

    // If the prompt never results in a credential or a skip/dismiss, retry once without FedCM.
    fallbackTimer = setTimeout(() => {
      if (settled || triedFallback) return;
      triedFallback = true;
      try {
        if (window.google?.accounts?.id?.cancel) {
          try { window.google.accounts.id.cancel(); } catch (e) {}
        }
        startPrompt(false, 'fallback');
        fallbackTimer = setTimeout(() => {
          if (!settled) {
            finalizeError('Google sign-in timed out.');
          }
        }, 6000);
      } catch (e) {
        console.warn('[Google OAuth] fallback prompt failed to initialize:', e?.message || e);
        finalizeError('Google sign-in could not be started.');
      }
    }, 6000);
  });
};
