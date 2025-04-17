import React, { useState, useEffect } from "react";
import { Select, Button, message, Tag, Input, DatePicker, Card } from "antd";
import ScheduleTable from "./ScheduleTable";
import ScheduleModal from "./ScheduleModal";
import {
  getSchedulesByDateRange,
  deleteSchedule,
  createMultipleSchedulesForStaff,
  createMultipleSchedulesForShift,
} from "@/api/schedule";
import { getShifts, ShiftResponse } from "@/api/shift";
import { UserProfile, getAllStaff } from "@/api/user";
import dayjs from "dayjs";
import { ScheduleIcon } from "./Icons";
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import PageContainer from "../shared/PageContainer";

const { Option } = Select;

export function Schedule() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [viewMode, setViewMode] = useState<"staff" | "shift">("staff");
  const [schedules, setSchedules] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedRowId, setSelectedRowId] = useState<string>("");
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [staffs, setStaffs] = useState<UserProfile[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  const [selectedStaffs, setSelectedStaffs] = useState<string[]>([]);
  const [filteredStaffs, setFilteredStaffs] = useState<UserProfile[]>([]);
  const [selectedStaffInfo, setSelectedStaffInfo] = useState<{
    fullName: string;
    userName: string;
  }>({ fullName: "", userName: "" });
  const [selectedShiftInfo, setSelectedShiftInfo] = useState<{
    shiftName: string;
    startTime: string;
    endTime: string;
  }>({ shiftName: "", startTime: "", endTime: "" });

  useEffect(() => {
    setCurrentWeekDays(dayjs());
  }, []);

  const setCurrentWeekDays = (date: dayjs.Dayjs) => {
    const startOfWeek = date.startOf("week").add(1, "day");
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(startOfWeek.add(i, "day").toDate());
    }
    setCurrentWeek(weekDays);
  };

  const fetchData = async () => {
    try {
      const startDate = dayjs(currentWeek[0]).format("YYYY-MM-DD");
      const endDate = dayjs(currentWeek[6]).format("YYYY-MM-DD");

      const scheduleData = await getSchedulesByDateRange(startDate, endDate);
      setSchedules(scheduleData);

      const [shiftData, staffData] = await Promise.all([
        getShifts(),
        getAllStaff(),
      ]);
      setShifts(shiftData);
      const activeStaffs = staffData.filter(
        (staff) => staff.status === "Active"
      );
      setStaffs(activeStaffs);
      if (selectedStaffs.length > 0) {
        const filtered = activeStaffs.filter((staff) =>
          selectedStaffs.includes(staff.id)
        );
        setFilteredStaffs(filtered);
      } else {
        setFilteredStaffs(activeStaffs);
      }
    } catch (error) {
      messageApi.error("Error fetching data");
    }
  };

  useEffect(() => {
    if (currentWeek.length > 0) {
      fetchData();
    }
  }, [currentWeek, viewMode]);

  const handleAdd = (date: string, rowId: string) => {
    if (viewMode === "staff") {
      const selectedStaff = staffs.find((staff) => staff.id === rowId);
      setSelectedDate(date);
      setSelectedRowId(rowId);
      setSelectedStaffInfo({
        fullName: selectedStaff?.fullName || "",
        userName: selectedStaff?.userName || "",
      });
    } else {
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

      const isDuplicate = schedules.some(
        (schedule) =>
          schedule[viewMode === "staff" ? "staffId" : "shiftId"] ===
            selectedRowId &&
          schedule[viewMode === "staff" ? "shiftId" : "staffId"] ===
            values[viewMode === "staff" ? "shiftIds" : "staffIds"] &&
          dayjs(schedule.workDate).isSame(selectedDate, "day")
      );

      if (isDuplicate) {
        messageApi.error("This schedule already exists!");
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

      messageApi.success("Schedule created successfully!");
      setVisible(false);
      fetchData();
    } catch (error) {
      messageApi.error("Failed to create schedule.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSchedule(id);
      messageApi.success("Schedule deleted successfully!");
      fetchData();
    } catch (error) {
      messageApi.error("Failed to delete schedule.");
    }
  };

  const handleStaffSelect = (values: string[]) => {
    setSelectedStaffs(values);
    if (values.length > 0) {
      const filtered = staffs.filter((staff) => values.includes(staff.id));
      setFilteredStaffs(filtered);
    } else {
      setFilteredStaffs(staffs);
    }
  };

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

  const handleBack = () => {
    router.back();
  };

  return (
    <PageContainer
      title="Schedule Management"
      icon={<CalendarOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
    >
      {contextHolder}
      <div>
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
          schedules={schedules}
          selectedRowId={selectedRowId}
        />
      </div>
    </PageContainer>
  );
}
