export function PrescriptionStatisticsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      {/* Background card */}
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Chart title */}
      <path
        d="M7 7H17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Bar chart elements */}
      <rect x="5" y="10" width="2" height="8" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="12" width="2" height="6" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="13" y="9" width="2" height="9" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="17" y="14" width="2" height="4" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* X-axis */}
      <path
        d="M4 18.5H20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Y-axis */}
      <path
        d="M4.5 18V10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Pill/medicine icon overlay */}
      <ellipse 
        cx="16" 
        cy="5.5" 
        rx="2" 
        ry="1" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Pill body */}
      <path
        d="M14 5.5v2c0 0.55 0.9 1 2 1s2-0.45 2-1v-2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
