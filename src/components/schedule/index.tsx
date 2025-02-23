import React, { useState, useEffect } from "react";
import { Select, Button, message, Tag, Input, DatePicker } from "antd";
import ScheduleTable from "./ScheduleTable";
import ScheduleModal from "./ScheduleModal";
import {
  getSchedulesByDateRange,
  createSchedule,
  deleteSchedule,
  createMultipleSchedulesForStaff,
  createMultipleSchedulesForShift,
} from "@/api/schedule";
import { getShifts, ShiftResponse } from "@/api/shift";
import { UserProfile, getAllStaff } from "@/api/user";
import dayjs from "dayjs";
import { ScheduleIcon } from "./Icons";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

const { Option } = Select;

export function Schedule() {
  const [viewMode, setViewMode] = useState<"staff" | "shift">("staff");
  const [schedules, setSchedules] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedRowId, setSelectedRowId] = useState<string>("");
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [staffs, setStaffs] = useState<UserProfile[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  const [selectedStaffs, setSelectedStaffs] = useState<string[]>([]); // State để lưu các staff được chọn
  const [filteredStaffs, setFilteredStaffs] = useState<UserProfile[]>([]); // State để lưu danh sách staff đã filter
  const [selectedStaffInfo, setSelectedStaffInfo] = useState<{
    fullName: string;
    userName: string;
  }>({ fullName: "", userName: "" });
  const [selectedShiftInfo, setSelectedShiftInfo] = useState<{
    shiftName: string;
    startTime: string;
    endTime: string;
  }>({ shiftName: "", startTime: "", endTime: "" });

  // Khởi tạo tuần hiện tại
  useEffect(() => {
    setCurrentWeekDays(dayjs());
  }, []);

  const setCurrentWeekDays = (date: dayjs.Dayjs) => {
    const startOfWeek = date.startOf("week").add(1, "day"); // Thứ 2 đầu tuần
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(startOfWeek.add(i, "day").toDate());
    }
    setCurrentWeek(weekDays);
  };

  // Fetch dữ liệu
  const fetchData = async () => {
    try {
      const startDate = dayjs(currentWeek[0]).format("YYYY-MM-DD");
      const endDate = dayjs(currentWeek[6]).format("YYYY-MM-DD");

      // Lấy schedules
      const scheduleData = await getSchedulesByDateRange(startDate, endDate);
      setSchedules(scheduleData);

      // Lấy danh sách shift và staff
      const [shiftData, staffData] = await Promise.all([
        getShifts(),
        getAllStaff(),
      ]);
      setShifts(shiftData);
      setStaffs(staffData);
      if (selectedStaffs.length > 0) {
        const filtered = staffData.filter((staff) =>
          selectedStaffs.includes(staff.id)
        );
        setFilteredStaffs(filtered);
      } else {
        setFilteredStaffs(staffData);
      }
    } catch (error) {
      message.error("Error fetching data");
    }
  };

  useEffect(() => {
    if (currentWeek.length > 0) {
      fetchData();
    }
  }, [currentWeek, viewMode]);

  const handleAdd = (date: string, rowId: string) => {
    if (viewMode === "staff") {
      // Trường hợp thêm ca làm việc cho nhân viên
      const selectedStaff = staffs.find((staff) => staff.id === rowId);
      setSelectedDate(date);
      setSelectedRowId(rowId);
      setSelectedStaffInfo({
        fullName: selectedStaff?.fullName || "",
        userName: selectedStaff?.userName || "",
      });
    } else {
      // Trường hợp thêm nhân viên cho ca làm việc
      const selectedShift = shifts.find((shift) => shift.id === rowId);
      setSelectedDate(date);
      setSelectedRowId(rowId);
      setSelectedShiftInfo({
        shiftName: selectedShift?.shiftName || "",
        startTime: selectedShift?.startTime || "",
        endTime: selectedShift?.endTime || "",
      });
    }
    setVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        [viewMode === "staff" ? "staffId" : "shiftId"]: selectedRowId,
        workDate: selectedDate,
      };

      // Kiểm tra xem ca làm việc hoặc nhân viên đã được thêm vào chưa
      const isDuplicate = schedules.some(
        (schedule) =>
          schedule[viewMode === "staff" ? "staffId" : "shiftId"] ===
            selectedRowId &&
          schedule[viewMode === "staff" ? "shiftId" : "staffId"] ===
            values[viewMode === "staff" ? "shiftIds" : "staffIds"] &&
          dayjs(schedule.workDate).isSame(selectedDate, "day")
      );

      if (isDuplicate) {
        message.error("This schedule already exists!");
        return;
      }

      if (viewMode === "staff") {
        await createMultipleSchedulesForStaff({
          staffId: selectedRowId,
          shiftIds: values.shiftIds,
          workDate: selectedDate,
          note: values.note,
          isRecurring: values.isRecurring,
          recurringDays: values.recurringDays,
          recurringEndDate: values.recurringEndDate,
        });
      } else {
        await createMultipleSchedulesForShift({
          shiftId: selectedRowId,
          staffIds: values.staffIds,
          workDate: selectedDate,
          note: values.note,
          isRecurring: values.isRecurring,
          recurringDays: values.recurringDays,
          recurringEndDate: values.recurringEndDate,
        });
      }

      message.success("Schedule created successfully!");
      setVisible(false);
      fetchData();
    } catch (error) {
      message.error("Failed to create schedule.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSchedule(id);
      message.success("Schedule deleted successfully!");
      fetchData();
    } catch (error) {
      message.error("Failed to delete schedule.");
    }
  };

  // Hàm xử lý khi chọn staff
  const handleStaffSelect = (values: string[]) => {
    setSelectedStaffs(values);
    if (values.length > 0) {
      const filtered = staffs.filter((staff) => values.includes(staff.id));
      setFilteredStaffs(filtered);
    } else {
      setFilteredStaffs(staffs);
    }
  };

  // Hàm lấy dữ liệu hiển thị
  const getRowData = () => {
    if (viewMode === "staff") {
      return selectedStaffs.length > 0 ? filteredStaffs : staffs;
    }
    return shifts;
  };

  const handlePrevWeek = () => {
    setCurrentWeekDays(dayjs(currentWeek[0]).subtract(7, "day"));
  };

  const handleNextWeek = () => {
    setCurrentWeekDays(dayjs(currentWeek[0]).add(7, "day"));
  };

  const handleThisWeek = () => {
    setCurrentWeekDays(dayjs());
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setCurrentWeekDays(date);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 ml-4">
        <ScheduleIcon />
        <h3 className="text-2xl font-bold">Schedule Management</h3>
      </div>
      <div style={{ padding: "16px" }}>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <Select
            mode="multiple"
            placeholder="Select staff"
            style={{ width: 300 }}
            onChange={handleStaffSelect}
            allowClear
            showSearch
            optionFilterProp="children"
            value={selectedStaffs}
          >
            {staffs.map((staff) => (
              <Option key={staff.id} value={staff.id}>
                {staff.fullName} ({staff.userName})
              </Option>
            ))}
          </Select>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
          </div>

          <div style={{ marginLeft: "auto" }}>
            <Select
              defaultValue="staff"
              style={{ width: 130 }}
              onChange={(value: "staff" | "shift") => setViewMode(value)}
            >
              <Option value="staff">View by Staff</Option>
              <Option value="shift">View by Shift</Option>
            </Select>
          </div>
        </div>

        <ScheduleTable
          viewMode={viewMode}
          schedules={schedules}
          currentWeek={currentWeek}
          rowData={getRowData()}
          onAdd={handleAdd}
          shifts={shifts}
          staffs={staffs}
          onDelete={handleDelete}
        />

        <ScheduleModal
          visible={visible}
          onCancel={() => setVisible(false)}
          onSubmit={handleSubmit}
          viewMode={viewMode}
          options={viewMode === "staff" ? shifts : staffs}
          fullName={selectedStaffInfo.fullName}
          userName={selectedStaffInfo.userName}
          selectedDate={selectedDate}
          shiftName={selectedShiftInfo.shiftName}
          startTime={selectedShiftInfo.startTime}
          endTime={selectedShiftInfo.endTime}
          schedules={schedules} // Truyền schedules xuống ScheduleModal
          selectedRowId={selectedRowId} // Thêm prop này
        />
      </div>
    </div>
  );
}
