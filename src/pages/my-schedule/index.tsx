import React, { useState, useEffect, useContext } from "react";
import { Calendar, Badge, Card, Typography, DatePicker, Spin, message, Tag, Row, Col, Tooltip } from "antd";
import { getCurrentUserSchedules } from "@/api/schedule";
import { StaffScheduleResponse } from "@/api/schedule";
import dayjs from "dayjs";
import type { Dayjs } from 'dayjs';
import { UserContext } from "@/context/UserContext";
import { CalendarOutlined, ClockCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';

dayjs.extend(weekday);
dayjs.extend(localeData);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function MySchedulePage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [schedules, setSchedules] = useState<StaffScheduleResponse[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const userContext = useContext(UserContext);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [todaySchedules, setTodaySchedules] = useState<StaffScheduleResponse[]>([]);

  // Lấy lịch làm việc từ API
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");
      
      const response = await getCurrentUserSchedules(startDate, endDate);
      
      if (response && response.isSuccess && response.data) {
        setSchedules(response.data);
        updateTodaySchedules(response.data, selectedDate || dayjs());
      } else {
        message.error("Không thể tải lịch làm việc. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      message.error("Đã xảy ra lỗi khi tải lịch làm việc.");
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật danh sách lịch làm việc cho ngày đã chọn
  const updateTodaySchedules = (allSchedules: StaffScheduleResponse[], date: Dayjs) => {
    const filtered = allSchedules.filter(schedule => 
      dayjs(schedule.workDate).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
    );
    setTodaySchedules(filtered);
  };

  // Load lịch làm việc khi component mount hoặc khi thay đổi khoảng thời gian
  useEffect(() => {
    fetchSchedules();
  }, [dateRange]);

  // Xử lý khi thay đổi khoảng thời gian
  const handleRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  // Xử lý khi chọn ngày trên lịch
  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    updateTodaySchedules(schedules, date);
  };

  // Tạo dữ liệu cho lịch
  const getListData = (value: Dayjs) => {
    const dateString = value.format('YYYY-MM-DD');
    return schedules.filter(schedule => 
      dayjs(schedule.workDate).format('YYYY-MM-DD') === dateString
    );
  };

  // Render các cell của lịch
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    
    return (
      <ul className="p-0 m-0 list-none">
        {listData.map((item) => (
          <li key={item.id} className="mb-0.5 overflow-hidden text-ellipsis">
            <Badge 
              status="success" 
              text={
                <Tooltip title={`${item.startTime} - ${item.endTime}`}>
                  <span className="text-xs">
                    {item.shiftName}
                  </span>
                </Tooltip>
              } 
            />
          </li>
        ))}
      </ul>
    );
  };

  // Tạo nội dung hiển thị chi tiết ca làm việc trong ngày
  const renderScheduleDetails = () => {
    if (!selectedDate) return null;
    
    if (todaySchedules.length === 0) {
      return (
        <Card className="mt-4 text-center">
          <Text type="secondary">Không có lịch làm việc cho ngày {selectedDate.format('DD/MM/YYYY')}</Text>
        </Card>
      );
    }

    return (
      <Card 
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined />
            <span>Lịch làm việc ngày {selectedDate.format('DD/MM/YYYY')}</span>
          </div>
        } 
        className="mt-4"
      >
        {todaySchedules.map((schedule) => (
          <Card.Grid key={schedule.id} style={{ width: '100%', padding: '12px' }}>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <div className="flex items-center gap-2">
                  <Tag color="green">{schedule.shiftName}</Tag>
                </div>
              </Col>
              <Col span={8}>
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined />
                  <Text>{schedule.startTime} - {schedule.endTime}</Text>
                </div>
              </Col>
              <Col span={8}>
                {schedule.note && (
                  <div className="flex items-center gap-2">
                    <InfoCircleOutlined />
                    <Text>{schedule.note}</Text>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Grid>
        ))}
      </Card>
    );
  };

  return (
    <div className="p-4">
      <Title level={2} className="flex items-center gap-2 mb-6">
        <CalendarOutlined />
        <span>Lịch làm việc của tôi</span>
      </Title>

      <Card className="mb-4">
        <div className="mb-4">
          <Text strong>Khoảng thời gian: </Text>
          <RangePicker 
            value={dateRange}
            onChange={handleRangeChange}
            format="DD/MM/YYYY"
            className="ml-2"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Calendar 
            dateCellRender={dateCellRender}
            onSelect={handleDateSelect}
            value={selectedDate || dayjs()}
          />
        )}
      </Card>

      {renderScheduleDetails()}
    </div>
  );
} 