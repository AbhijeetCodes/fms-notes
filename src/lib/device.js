/**
 * Most of our traffic arrives from WhatsApp links, which open in an in-app
 * webview. Google refuses OAuth inside embedded webviews (`disallowed_useragent`),
 * so the sign-in button just dead-ends there unless we tell people to get out
 * into a real browser first.
 */

const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent || '');

export function isIOS() {
  const s = ua();
  return /iPad|iPhone|iPod/.test(s) ||
    // iPadOS 13+ reports as a Mac, but it has a touchscreen
    (/Macintosh/.test(s) && typeof document !== 'undefined' && 'ontouchend' in document);
}

export function isInAppBrowser() {
  const s = ua();
  if (!s) return false;
  // WhatsApp, Instagram, Facebook, Messenger, LINE, Snapchat
  if (/WhatsApp|Instagram|FBAN|FBAV|FB_IAB|Messenger|\bLine\/|Snapchat/i.test(s)) return true;
  // Generic Android WebView — "; wv)" is the marker Chrome adds
  if (/Android/.test(s) && /;\s?wv\)/.test(s)) return true;
  return false;
}

/**
 * Platform-specific wording for getting out of the in-app browser. Spelled out
 * in words rather than glyphs — the three-dot and share icons render
 * ambiguously in our UI font and read as a colon.
 */
export function escapeHatchHint() {
  if (isIOS()) {
    return 'Tap the share or compass icon at the bottom of this screen, choose Safari, then sign in there.';
  }
  return 'Tap the three-dot menu at the top right, choose “Open in browser”, then sign in there.';
}

export async function copyCurrentUrl() {
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Clipboard API needs a secure context and isn't in every webview
    try {
      const el = document.createElement('textarea');
      el.value = url;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}
