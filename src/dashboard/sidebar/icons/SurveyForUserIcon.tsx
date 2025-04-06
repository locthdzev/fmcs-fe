export function SurveyForUserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      {/* User circle */}
      <circle
        cx="12"
        cy="8"
        r="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Ratings/Stars */}
      <path
        d="M7 16L8 15L9 16L8 17L7 16Z"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <path
        d="M12 16L13 15L14 16L13 17L12 16Z"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <path
        d="M17 16L18 15L19 16L18 17L17 16Z"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Survey paper background */}
      <path
        d="M5 4C5 3.44772 5.44772 3 6 3H18C18.5523 3 19 3.44772 19 4V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Feedback line */}
      <path
        d="M8 20L16 20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
