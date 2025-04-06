export function SurveyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      {/* Main form with checkmarks */}
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Title line */}
      <path
        d="M8 8H16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Question lines with bullets */}
      <circle cx="6" cy="12" r="0.5" fill="currentColor" />
      <path
        d="M8 12H13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <circle cx="6" cy="16" r="0.5" fill="currentColor" />
      <path
        d="M8 16H13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Check marks */}
      <path
        d="M15 11.5L16 12.5L18 10.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <path
        d="M15 15.5L16 16.5L18 14.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
