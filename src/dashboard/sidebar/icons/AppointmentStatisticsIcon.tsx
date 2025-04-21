import React from 'react';
import styled from 'styled-components';

interface AppointmentStatisticsIconProps {
  isActive?: boolean;
  size?: number;
}

const StyledSvg = styled.svg<{ isActive?: boolean }>`
  fill: ${(props) => (props.isActive ? '#1890ff' : '#8c8c8c')};
  transition: fill 0.3s ease;

  &:hover {
    fill: ${(props) => (props.isActive ? '#1890ff' : '#40a9ff')};
  }
`;

const AppointmentStatisticsIcon: React.FC<AppointmentStatisticsIconProps> = ({ 
  isActive = false, 
  size = 24 
}) => {
  return (
    <StyledSvg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      isActive={isActive}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
      <path 
        fill="none" 
        stroke={isActive ? '#1890ff' : '#8c8c8c'} 
        strokeWidth="2" 
        d="M4 4h16v16H4z" 
      />
    </StyledSvg>
  );
};

export default AppointmentStatisticsIcon;
