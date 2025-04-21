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
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Medical cross symbol */}
      <rect
        x="7"
        y="7"
        width="10"
        height="3"
        rx="1"
        fill={iconColor}
      />
      <rect
        x="10.5"
        y="5.5"
        width="3"
        height="6"
        rx="1"
        fill={iconColor}
      />
      
      {/* Bar chart elements */}
      <rect
        x="5"
        y="14"
        width="2"
        height="5"
        rx="0.5"
        fill={iconColor}
      />
      <rect
        x="9"
        y="12"
        width="2"
        height="7"
        rx="0.5"
        fill={iconColor}
      />
      <rect
        x="13"
        y="13"
        width="2"
        height="6"
        rx="0.5"
        fill={iconColor}
      />
      <rect
        x="17"
        y="11"
        width="2"
        height="8"
        rx="0.5"
        fill={iconColor}
      />
    </svg>
  );
};

export default HealthInsuranceStatictisIcon;
