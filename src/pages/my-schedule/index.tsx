import React, { useState, useEffect, useContext } from "react";
import { Calendar, Badge, Card, Typography, DatePicker, Spin, message, Tag, Row, Col, Tooltip, Button, Table } from "antd";
import { getCurrentUserSchedules } from "@/api/schedule";
import { StaffScheduleResponse } from "@/api/schedule";
import dayjs from "dayjs";
import type { Dayjs } from 'dayjs';
import { UserContext } from "@/context/UserContext";
import { CalendarOutlined, ClockCircleOutlined, InfoCircleOutlined, TableOutlined, AppstoreOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import PageContainer from "@/components/shared/PageContainer";
import { useRouter } from "next/router";

dayjs.extend(weekday);
dayjs.extend(localeData);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function MySchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [schedules, setSchedules] = useState<StaffScheduleResponse[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const userContext = useContext(UserContext);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [todaySchedules, setTodaySchedules] = useState<StaffScheduleResponse[]>([]);
  const [displayMode, setDisplayMode] = useState<"calendar" | "table">("calendar");
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);

  // Thiết lập ngày trong tuần hiện tại
  useEffect(() => {
    setCurrentWeekDays(dayjs());
  }, []);

  const setCurrentWeekDays = (date: Dayjs) => {
    const startOfWeek = date.startOf('week').add(1, 'day'); // Bắt đầu từ thứ 2
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(startOfWeek.add(i, 'day').toDate());
    }
    setCurrentWeek(weekDays);
  };

  // Lấy lịch làm việc từ API
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      
      if (displayMode === "calendar") {
        startDate = dateRange[0].format("YYYY-MM-DD");
        endDate = dateRange[1].format("YYYY-MM-DD");
      } else {
        // Trong chế độ bảng, lấy dữ liệu theo tuần
        startDate = dayjs(currentWeek[0]).format("YYYY-MM-DD");
        endDate = dayjs(currentWeek[6]).format("YYYY-MM-DD");
      }
      
      const response = await getCurrentUserSchedules(startDate, endDate);
      
      if (response && response.isSuccess && response.data) {
        setSchedules(response.data);
        updateTodaySchedules(response.data, selectedDate || dayjs());
      } else {
        message.error("Could not load schedule data. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      message.error("An error occurred while loading schedule data.");
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
    if ((displayMode === "calendar" && dateRange) || 
        (displayMode === "table" && currentWeek.length > 0)) {
      fetchSchedules();
    }
  }, [dateRange, currentWeek, displayMode]);

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

  // Xử lý chuyển đổi tuần trong chế độ bảng
  const handlePrevWeek = () => {
    setCurrentWeekDays(dayjs(currentWeek[0]).subtract(7, 'day'));
  };

  const handleNextWeek = () => {
    setCurrentWeekDays(dayjs(currentWeek[0]).add(7, 'day'));
  };

  const handleThisWeek = () => {
    setCurrentWeekDays(dayjs());
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setCurrentWeekDays(date);
    }
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
          <Text type="secondary">No schedules for {selectedDate.format('DD/MM/YYYY')}</Text>
        </Card>
      );
    }

    return (
      <Card 
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined />
            <span>Schedules for {selectedDate.format('DD/MM/YYYY')}</span>
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

  // Render Table view
  const renderTableView = () => {
    // Tạo columns cho bảng
    const columns = [
      {
        title: "DAY",
        dataIndex: "day",
        key: "day",
        width: 160,
        render: (text: string, record: any) => (
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.date}</div>
          </div>
        )
      },
      ...Array.from({ length: 24 }).map((_, index) => {
        const hour = index;
        const formattedHour = hour.toString().padStart(2, '0');
        return {
          title: `${formattedHour}:00`,
          dataIndex: `hour_${hour}`,
          key: `hour_${hour}`,
          width: 80,
          align: 'center' as 'center',
          render: (text: any) => text || null,
        };
      })
    ];

    // Tạo data cho bảng
    const data = currentWeek.map((date) => {
      // Tạo object cơ bản cho mỗi hàng
      const row: any = {
        key: dayjs(date).format('YYYY-MM-DD'),
        day: dayjs(date).format('ddd').toUpperCase(),
        date: dayjs(date).format('DD/MM/YYYY'),
      };

      // Lấy các ca làm việc của ngày này
      const daySchedules = schedules.filter(s => 
        dayjs(s.workDate).format('YYYY-MM-DD') === dayjs(date).format('YYYY-MM-DD')
      );

      // Điền các shift vào các ô giờ tương ứng
      daySchedules.forEach(schedule => {
        // Lấy giờ bắt đầu
        const startHour = parseInt(schedule.startTime?.split(':')[0] || '0');
        // Lấy giờ kết thúc (nếu kéo dài qua ngày hôm sau, giới hạn ở 23h)
        const endHour = Math.min(parseInt(schedule.endTime?.split(':')[0] || '0'), 23);
        
        // Điền thông tin vào từng ô giờ
        for(let h = startHour; h <= endHour; h++) {
          row[`hour_${h}`] = (
            <Tag color="green" style={{ margin: 0 }}>
              {schedule.shiftName}
            </Tag>
          );
        }
      });

      return row;
    });

    return (
      <div style={{ overflowX: 'auto' }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1500 }}
        />
      </div>
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <PageContainer
      title="My Schedule"
      icon={<CalendarOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
    >
      {/* Controls Card */}
      <Card 
        className="shadow mb-4"
        bodyStyle={{ padding: "16px" }}
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      >
        <Row align="middle" gutter={[16, 16]}>
          <Col span={24}>
            <div className="flex items-center">
              <AppstoreOutlined style={{ marginRight: "8px", fontSize: "20px" }} />
              <Text strong style={{ fontSize: "16px" }}>Schedule Controls</Text>
            </div>
          </Col>
        </Row>

        <div className="mt-4 flex items-center justify-between flex-wrap">
          <div className="flex items-center gap-3 mb-2">
            {displayMode === "calendar" ? (
              <>
                <Text strong>Date Range: </Text>
                <RangePicker 
                  value={dateRange}
                  onChange={handleRangeChange}
                  format="DD/MM/YYYY"
                />
              </>
            ) : (
              <>
                <Button icon={<LeftOutlined />} onClick={handlePrevWeek} />
                <DatePicker
                  value={dayjs(currentWeek[0])}
                  onChange={handleDateChange}
                  picker="week"
                  format="[Week] w - MMMM YYYY"
                  style={{ width: "200px" }}
                />
                <Button icon={<RightOutlined />} onClick={handleNextWeek} />
                <Button onClick={handleThisWeek}>This week</Button>
              </>
            )}
          </div>
          
          <Button.Group>
            <Button
              type={displayMode === "table" ? "primary" : "default"}
              icon={<TableOutlined />}
              onClick={() => setDisplayMode("table")}
            >
              Table
            </Button>
            <Button
              type={displayMode === "calendar" ? "primary" : "default"}
              icon={<AppstoreOutlined />}
              onClick={() => setDisplayMode("calendar")}
            >
              Calendar
            </Button>
          </Button.Group>
        </div>
      </Card>

      {/* Main Content Card */}
      <Card className="shadow">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" tip="Loading schedule data..." />
          </div>
        ) : displayMode === "calendar" ? (
          <Calendar 
            dateCellRender={dateCellRender}
            onSelect={handleDateSelect}
            value={selectedDate || dayjs()}
          />
        ) : (
          renderTableView()
        )}
      </Card>

      {displayMode === "calendar" && renderScheduleDetails()}
    </PageContainer>
  );
} 