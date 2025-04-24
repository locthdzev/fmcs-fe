import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Calendar, Typography, Spin, Button, Badge, Tooltip, Row, Col, Divider, theme } from 'antd';
import { CalendarOutlined, InfoCircleOutlined, ScheduleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { getStaffSchedulesByDateRange } from '@/api/schedule';
import Cookies from 'js-cookie';
import type { CellRenderInfo } from 'rc-picker/lib/interface';

const { Title, Text } = Typography;

// Calendar styles
const CALENDAR_STYLES = `
  .staff-calendar-wrapper .ant-picker-calendar {
    width: 100%;
    font-size: 14px;
  }
  
  .staff-calendar-wrapper .ant-picker-calendar-full .ant-picker-panel {
    width: 100%;
  }
  
  .staff-calendar-wrapper .ant-picker-panel {
    border: none;
    border-radius: 8px;
    width: 100%;
  }
  
  .staff-calendar-wrapper .ant-picker-calendar-date {
    height: 100px !important;
    min-height: 100px !important;
    margin: 2px;
    border-radius: 4px;
    padding: 4px !important;
  }

  .staff-calendar-wrapper .ant-picker-calendar-date-value {
    display: none;
  }
  
  .staff-calendar-wrapper .ant-picker-calendar-date-today {
    border-color: #1890ff;
  }
  
  .staff-calendar-wrapper .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-calendar-date {
    background: #e6f7ff;
  }
  
  .staff-calendar-wrapper .ant-picker-calendar-date-content {
    height: 70px;
    overflow: hidden;
    margin-top: 2px;
  }
  
  .staff-calendar-wrapper .ant-picker-content th {
    padding: 12px 0;
    font-weight: bold;
    font-size: 15px;
  }
  
  .staff-calendar-wrapper .ant-picker-cell {
    padding: 4px 0;
  }
  
  .staff-calendar-wrapper .staff-work-date {
    transition: all 0.2s;
  }
  
  .staff-calendar-wrapper .staff-work-date:hover {
    background-color: #bae7ff !important;
  }

  .staff-calendar-wrapper .date-number {
    font-size: 16px;
    line-height: 24px;
    height: 24px;
    text-align: center;
    margin-bottom: 4px;
  }
`;

interface StaffScheduleCalendarModalProps {
  open: boolean;
  onClose: () => void;
  staffId: string | null;
  availableWorkDates: Set<string>;
  onDateSelect: (date: Date) => void;
  isDateDisabled: (current: dayjs.Dayjs) => boolean;
}

interface StaffWorkShift {
  id: string;
  workDate: string;
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: string;
}

const StaffScheduleCalendarModal: React.FC<StaffScheduleCalendarModalProps> = ({
  open,
  onClose,
  staffId,
  availableWorkDates,
  onDateSelect,
  isDateDisabled
}) => {
  const [loading, setLoading] = useState(false);
  const [staffSchedules, setStaffSchedules] = useState<StaffWorkShift[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const { token } = theme.useToken();
  
  const startDate = dayjs();
  const endDate = dayjs().add(30, 'days');
  
  // Chuyển đổi thời gian từ AM/PM sang định dạng 24h để hiển thị
  const convertTo24HourFormat = useCallback((timeStr: string) => {
    if (!timeStr) return "";
    const [timePart, ampm] = timeStr.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    if (ampm.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }, []);
  
  // Fetch staff schedules
  useEffect(() => {
    if (open && staffId) {
      setLoading(true);
      const token = Cookies.get('token');
      const fetchStaffSchedules = async () => {
        try {
          const startDate = dayjs().format('YYYY-MM-DD');
          const endDate = dayjs().add(30, 'days').format('YYYY-MM-DD');
          
          const response = await getStaffSchedulesByDateRange(
            staffId,
            startDate,
            endDate
          );
          
          if (response.isSuccess && Array.isArray(response.data)) {
            setStaffSchedules(response.data);
          }
        } catch (error) {
          console.error('Error fetching staff work schedules:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchStaffSchedules();
    }
  }, [open, staffId]);
  
  // Lấy thông tin ca làm việc cho ngày cụ thể
  const getShiftInfoForDate = (dateStr: string) => {
    return staffSchedules.find(schedule => 
      dayjs(schedule.workDate).format('YYYY-MM-DD') === dateStr
    );
  };
  
  const dateCellRender = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const isWorkDate = availableWorkDates.has(dateStr);
    const isToday = dayjs().format('YYYY-MM-DD') === dateStr;
    const isSelectable = !isDateDisabled(date);
    const shiftInfo = getShiftInfoForDate(dateStr);
    
    if (!isSelectable) return null;
    
    const tooltipTitle = isWorkDate ? (
      <div style={{ padding: '8px', maxWidth: '250px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>{date.format('DD/MM/YYYY')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div><span style={{ fontWeight: 500 }}>Shift:</span> {shiftInfo?.shiftName}</div>
          <div>
            <span style={{ fontWeight: 500 }}>Time:</span> {convertTo24HourFormat(shiftInfo?.startTime || '')} - {convertTo24HourFormat(shiftInfo?.endTime || '')}
          </div>
          <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>Click to select this date</div>
        </div>
      </div>
    ) : 'Staff is not working on this day';
    
    return (
      <Tooltip title={tooltipTitle} mouseEnterDelay={0.3}>
        <div
          onClick={() => {
            if (isWorkDate) {
              onDateSelect(date.toDate());
              onClose();
            }
          }}
          className={isWorkDate ? 'staff-work-date' : ''}
          style={{
            height: '100%', 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            cursor: isWorkDate ? 'pointer' : 'default',
            background: isWorkDate 
              ? isToday ? token.colorPrimaryBg : '#e6f7ff'
              : 'transparent',
            borderRadius: 4,
            position: 'relative',
            border: isToday ? `1px solid ${token.colorPrimary}` : 'none',
          }}
        >
          <div 
            className="date-number"
            style={{ 
              fontWeight: isToday ? 'bold' : 'normal',
              color: isWorkDate 
                ? isToday ? token.colorPrimary : token.colorPrimaryText
                : isToday ? token.colorPrimary : 'inherit',
            }}
          >
            {date.date()}
          </div>
          
          {isWorkDate && (
            <div style={{ 
              padding: '3px 4px', 
              fontSize: '12px', 
              lineHeight: '1.2',
              color: '#389e0d', 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f', 
              borderRadius: '4px',
              marginTop: '4px',
              width: 'calc(100% - 8px)',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}>
              {shiftInfo?.shiftName || 'Có lịch'}
            </div>
          )}
          
          {isWorkDate && (
            <div style={{ position: 'absolute', bottom: 2, width: '100%', textAlign: 'center' }}>
              <Badge 
                status="success" 
                style={{ 
                  display: 'inline-block'
                }} 
              />
            </div>
          )}
        </div>
      </Tooltip>
    );
  };

  const customHeaderRender = ({ value, onChange }: any) => {
    const currentMonth = value.format('MM/YYYY');
    
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '8px 0'
      }}>
        <Button
          type="text"
          onClick={() => {
            const newDate = value.subtract(1, 'month');
            onChange(newDate);
          }}
          disabled={value.month() < dayjs().month() && value.year() <= dayjs().year()}
        >
          &lt;
        </Button>
        
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'  
        }}>
          <CalendarOutlined />
          <span>{currentMonth}</span>
        </div>
        
        <Button
          type="text"
          onClick={() => {
            const newDate = value.add(1, 'month');
            onChange(newDate);
          }}
          disabled={value.month() > endDate.month() && value.year() >= endDate.year()}
        >
          &gt;
        </Button>
      </div>
    );
  };

  // Add calendar styles when component mounts
  useEffect(() => {
    const styleId = 'staff-calendar-styles';
    
    // Only add styles if they don't already exist
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.innerHTML = CALENDAR_STYLES;
      document.head.appendChild(styleElement);
    }
    
    // Clean up when component unmounts
    return () => {
      // We don't remove the styles on unmount to avoid affecting other instances
      // If you need to remove them, uncomment the line below
      // document.getElementById(styleId)?.remove();
    };
  }, []);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScheduleOutlined style={{ color: token.colorPrimary }} />
          <span>Healthcare Staff Work Schedule</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={1100}
      destroyOnClose
      bodyStyle={{ padding: '20px' }}
      centered
      style={{ top: 20 }}
    >
      {loading ? (
        <div style={{ height: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip="Loading work schedule..." />
        </div>
      ) : (
        <div>
          <div style={{ 
            padding: '12px 16px',
            backgroundColor: '#f0f5ff', 
            borderRadius: '6px',
            margin: '0 0 20px 0',
            border: '1px solid #d6e4ff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <InfoCircleOutlined style={{ color: token.colorPrimary }} />
              <Text strong style={{ color: token.colorPrimaryText }}>Work Schedule</Text>
            </div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              You can only schedule appointments on days when the healthcare staff is working (highlighted in blue).
              Hover over a date to see detailed working hours.
            </Text>
          </div>
        
          <div className="staff-calendar-wrapper" style={{ minHeight: "580px" }}>
            <Calendar
              fullscreen={true}
              value={selectedMonth}
              onChange={setSelectedMonth}
              disabledDate={isDateDisabled}
              validRange={[startDate, endDate]}
              headerRender={customHeaderRender}
              fullCellRender={(date) => {
                const dateStr = date.format('YYYY-MM-DD');
                const isWorkDate = availableWorkDates.has(dateStr);
                const isToday = dayjs().format('YYYY-MM-DD') === dateStr;
                const isSelectable = !isDateDisabled(date);
                const shiftInfo = getShiftInfoForDate(dateStr);
                
                const tooltipTitle = isWorkDate ? (
                  <div style={{ padding: '8px', maxWidth: '250px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>{date.format('DD/MM/YYYY')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div><span style={{ fontWeight: 500 }}>Shift:</span> {shiftInfo?.shiftName}</div>
                      <div>
                        <span style={{ fontWeight: 500 }}>Time:</span> {convertTo24HourFormat(shiftInfo?.startTime || '')} - {convertTo24HourFormat(shiftInfo?.endTime || '')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>Click to select this date</div>
                    </div>
                  </div>
                ) : 'Staff is not working on this day';
                
                if (!date.isSame(date.clone().startOf('month'), 'month') && !date.isSame(date.clone().endOf('month'), 'month')) {
                  return <div className="ant-picker-calendar-date"></div>;
                }
                
                return (
                  <div className="ant-picker-calendar-date" style={{ 
                    background: isWorkDate && isSelectable 
                      ? isToday ? '#e6f7ff' : '#f0f7ff'
                      : 'transparent',
                    border: isToday ? `1px solid ${token.colorPrimary}` : '1px solid transparent',
                    borderRadius: '4px',
                    cursor: isWorkDate && isSelectable ? 'pointer' : 'default'
                  }}>
                    <div className="ant-picker-calendar-date-value">{date.date()}</div>
                    <div className="ant-picker-calendar-date-content">
                      <Tooltip title={tooltipTitle} mouseEnterDelay={0.3}>
                        <div
                          onClick={() => {
                            if (isWorkDate && isSelectable) {
                              onDateSelect(date.toDate());
                              onClose();
                            }
                          }}
                          style={{
                            height: '100%', 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative',
                          }}
                        >
                          <div style={{ 
                            fontSize: '16px',
                            fontWeight: isToday ? 'bold' : 'normal',
                            color: isWorkDate && isSelectable
                              ? isToday ? token.colorPrimary : token.colorText
                              : isToday ? token.colorPrimary : 'inherit',
                            marginBottom: '4px',
                            marginTop: '2px',
                          }}>
                            {date.date()}
                          </div>
                          
                          {isWorkDate && isSelectable && (
                            <div style={{ 
                              padding: '3px 6px', 
                              fontSize: '12px', 
                              lineHeight: '1.2',
                              color: '#389e0d', 
                              backgroundColor: '#f6ffed', 
                              border: '1px solid #b7eb8f', 
                              borderRadius: '4px',
                              width: '90%',
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {shiftInfo?.shiftName || 'Available'}
                            </div>
                          )}
                          
                          {isWorkDate && isSelectable && (
                            <div style={{ position: 'absolute', bottom: 4, width: '100%', textAlign: 'center' }}>
                              <Badge status="success" />
                            </div>
                          )}
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                );
              }}
              style={{ 
                borderRadius: '8px', 
                border: '1px solid #f0f0f0',
              }}
            />
          </div>
        
          <div style={{ 
            marginTop: '16px', 
            padding: '12px 0 0 0', 
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Badge status="success" />
              <Text style={{ fontSize: '13px' }}>Working days</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: token.colorPrimary, 
                borderRadius: '50%',
                display: 'inline-block'
              }} />
              <Text style={{ fontSize: '13px' }}>Today</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #d9d9d9',
                borderRadius: '2px',
              }} />
              <Text style={{ fontSize: '13px' }}>Non-working days</Text>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StaffScheduleCalendarModal; 