/**
 * Placeholder state seal.
 *
 * Replace with the official Government of Tamil Nadu emblem by dropping the
 * approved image file at `public/emblem.png` and swapping this component for:
 *   <img src="/emblem.png" alt="Government of Tamil Nadu" className={className} />
 */
export function Emblem({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="32"
        cy="32"
        r="25"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      {/* stepped tower silhouette */}
      <path
        d="M32 14 L38 22 H26 Z M27 24 h10 v4 H27 Z M25 30 h14 v4 H25 Z M23 36 h18 v4 H23 Z M21 42 h22 v5 H21 Z"
        fill="currentColor"
      />
      <path
        d="M18 48 h28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
