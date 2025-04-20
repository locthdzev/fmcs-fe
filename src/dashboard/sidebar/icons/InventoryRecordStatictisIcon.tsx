import React from 'react';
import { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';

const InventoryRecordStatictisIcon = (
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
      {/* Medicine bottle */}
      <path d="M8 3h8v3H8z" />
      <path d="M6 6h12v15a1 1 0 01-1 1H7a1 1 0 01-1-1z" />
      
      {/* Pills/capsules */}
      <circle cx="9.5" cy="10.5" r="1.5" />
      <circle cx="14.5" cy="10.5" r="1.5" />
      
      {/* Graph/chart elements */}
      <rect x="9" y="14" width="2" height="5" />
      <rect x="13" y="15" width="2" height="4" />
      <rect x="17" y="16" width="0" height="3" />
      <path d="M7 19l10-5" strokeWidth="0.75" stroke="currentColor" fill="none" />
    </svg>
  );
};

export default InventoryRecordStatictisIcon;

