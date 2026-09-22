import { useState } from 'react';
import { signInWithGoogle } from '../lib/supabase';
import { isInAppBrowser, escapeHatchHint, copyCurrentUrl } from '../lib/device';
import { IconGoogle } from './Icons';

/**
 * The Google sign-in button, plus the escape hatch people need when the page is
 * being shown inside WhatsApp's (or Instagram's, or Facebook's) own browser,
 * where Google refuses to run OAuth at all.
 */
export default function GoogleSignIn({ className = 'btn btn-google', label = 'Sign in with Google' }) {
  const [blocked] = useState(isInAppBrowser);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyCurrentUrl();
    setCopied(ok ? 'copied' : 'failed');
    setTimeout(() => setCopied(false), 2500);
  };

  if (!blocked) {
    return (
      <button className={className} onClick={() => signInWithGoogle()}>
        <IconGoogle />
        {label}
      </button>
    );
  }

  return (
    <div className="inapp-block">
      <p className="inapp-note">
        <strong>Google sign-in doesn&rsquo;t work inside this app&rsquo;s browser.</strong>{' '}
        {escapeHatchHint()}
      </p>
      <button className="btn btn-google" onClick={handleCopy}>
        {copied === 'copied' ? 'Link copied ✓' : copied === 'failed' ? 'Copy failed — long-press the address bar' : 'Copy link'}
      </button>
    </div>
  );
}
