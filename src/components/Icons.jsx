/**
 * Inline stroke icons — 24×24 viewBox, currentColor, no external icon font.
 * Size is controlled by the CSS class on the consuming element.
 */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export function IconLibrary(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M9 4h4.5A1.5 1.5 0 0 1 15 5.5v13a1.5 1.5 0 0 1-1.5 1.5H9" />
      <path d="m16.5 5.9 2.6 12.2" />
    </svg>
  );
}

export function IconCalendar(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconUpload(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 16V4.5" />
      <path d="m7.5 9 4.5-4.5L16.5 9" />
      <path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function IconFiles(props) {
  return (
    <svg {...base} {...props}>
      <path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
      <path d="M13.5 3.5V9H19" />
    </svg>
  );
}

export function IconShield(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 5 6.2v5c0 4.4 2.9 8.2 7 9.3 4.1-1.1 7-4.9 7-9.3v-5z" />
      <path d="m9.2 12 2 2 3.6-3.6" />
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function IconGoogle(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" {...props}>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.68-.06-1.34-.17-1.98H12v3.74h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.74 2.98-4.3 2.98-7.28z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.6A10 10 0 0 0 12 22z"
      />
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.82v-2.6H3.07a10 10 0 0 0 0 9.02z" />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.98 14.7 2 12 2 8.1 2 4.72 4.24 3.07 7.48l3.33 2.6C7.2 7.72 9.4 5.96 12 5.96z"
      />
    </svg>
  );
}
