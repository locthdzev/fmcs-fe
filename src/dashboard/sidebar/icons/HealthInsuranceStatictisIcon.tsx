import React from "react";

interface HealthInsuranceStatictisIconProps {
  active?: boolean;
  size?: number;
  color?: string;
}

const HealthInsuranceStatictisIcon: React.FC<HealthInsuranceStatictisIconProps> = ({
  active = false,
  size = 24,
  color,
}) => {
  const iconColor = color || (active ? "#1890ff" : "#8c8c8c");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main container rectangle */}
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="2"
        stroke={iconColor}
        strokeWidth="2.5"
        fill="none"
      />
      
      {/* Medical cross symbol */}
      <rect
        x="6.5"
        y="7"
        width="11"
        height="4"
        rx="1"
        fill={iconColor}
      />
      <rect
        x="10"
        y="5"
        width="4"
        height="8"
        rx="1"
        fill={iconColor}
      />
      
      {/* Bar chart elements */}
      <rect
        x="4.5"
        y="14"
        width="3"
        height="5"
        rx="0.5"
        fill={iconColor}
      />
      <rect
        x="8.5"
        y="12"
        width="3"
        height="7"
        rx="0.5"
        fill={iconColor}
      />
      <rect
        x="12.5"
        y="13"
        width="3"
        height="6"
        rx="0.5"
        fill={iconColor}
      />
      <rect
        x="16.5"
        y="11"
        width="3"
        height="8"
        rx="0.5"
        fill={iconColor}
      />
    </svg>
  );
};

export default HealthInsuranceStatictisIcon;
