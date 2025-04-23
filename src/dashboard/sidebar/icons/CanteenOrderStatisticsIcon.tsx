import React from 'react';
import { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';

const CanteenOrderStatisticsIcon = (
  props: Partial<CustomIconComponentProps>,
) => {
  return (
    <svg 
      width="1em" 
      height="1em" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      {/* Chart/Graph bars */}
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="8" width="4" height="13" rx="1" />
      <rect x="17" y="5" width="4" height="16" rx="1" />
      
      {/* Food plate/dish element */}
      <circle cx="12" cy="4" r="2.5" />
      <path d="M9 7C9 7 10 5.5 12 5.5C14 5.5 15 7 15 7" />
    </svg>
  );
};

export default CanteenOrderStatisticsIcon;

