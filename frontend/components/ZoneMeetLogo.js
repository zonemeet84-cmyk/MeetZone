/** ZoneMeet camera icon — blue → purple gradient with white Z */
export default function ZoneMeetLogo({ size = 40, className = "", gradientId = "zonemeet-logo-grad" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="3" y1="6" x2="29" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="0.45" stopColor="#6366f1" />
          <stop offset="0.75" stopColor="#a855f7" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <rect x="3" y="6" width="19" height="20" rx="5.5" fill={`url(#${gradientId})`} />
      <path d="M22 10.5L28.5 8V24L22 21.5V10.5Z" fill={`url(#${gradientId})`} />
      <path
        d="M8.25 10.75H15.75M15.75 10.75L8.25 18.75M8.25 18.75H15.75"
        stroke="white"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
