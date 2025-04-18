export function StatisticsofalldrugsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      {/* Biểu đồ cột */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 13v5M12 9v9M16 4v14"
      />
      
      {/* Đường cơ sở của biểu đồ */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18h12"
      />
      
      {/* Biểu tượng viên thuốc */}
      <rect x="4" y="4" width="6" height="3" rx="1" strokeWidth={2} />
      
      {/* Dấu cộng - biểu tượng y tế */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 9l-3 3m0 0l-3-3m3 3V3"
      />
    </svg>
  );
}
