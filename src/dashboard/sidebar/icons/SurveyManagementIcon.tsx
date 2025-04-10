export function SurveyManagementIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      {/* Main form/questionnaire */}
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Question lines */}
      <path
        d="M7 8H10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 12H10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 16H10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Rating options/bubble choices */}
      <circle cx="15" cy="8" r="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15" cy="16" r="1.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Stats/graph element */}
      <path
        d="M18 8L17 9L19 11L21 7"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="scale(0.6) translate(15, 13)"
      />
    </svg>
  );
}
