import React from "react";
import { Table, Tag, Button, message } from "antd";
import dayjs from "dayjs";
import { ScheduleResponse } from "@/api/schedule";
import { ShiftResponse } from "@/api/shift";
import { UserProfile } from "@/api/user";

interface ScheduleTableProps {
  viewMode: "staff" | "shift";
  schedules: ScheduleResponse[];
  currentWeek: Date[];
  rowData: (UserProfile | ShiftResponse)[];
  onAdd: (date: string, rowId: string) => void;
  shifts: ShiftResponse[];
  staffs: UserProfile[];
  onDelete: (id: string) => void;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  viewMode,
  schedules,
  currentWeek,
  rowData,
  onAdd,
  shifts,
  staffs,
  onDelete,
}) => {
  const [messageApi, contextHolder] = message.useMessage();

  const getScheduleForCell = (rowId: string, date: Date) => {
    return schedules.filter(
      (s) =>
        s[viewMode === "staff" ? "staffId" : "shiftId"] === rowId &&
        dayjs(s.workDate).isSame(date, "day")
    );
  };

  const handleDelete = (id: string) => {
    try {
      onDelete(id);
      messageApi.success({
        content: "Schedule deleted successfully",
        duration: 5,
      });
    } catch (error) {
      messageApi.error({
        content: "Failed to delete schedule",
        duration: 5,
      });
    }
  };

  const handleAdd = (date: string, rowId: string) => {
    try {
      onAdd(date, rowId);
    } catch (error) {
      messageApi.error({
        content: "Failed to add schedule",
        duration: 5,
      });
    }
  };

  const generateColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 50%)`;
    return color;
  };

  const renderCellContent = (
    schedules: ScheduleResponse[],
    isStaffView: boolean
  ) => {
    return schedules.map((schedule) => {
      const relatedId =
        (isStaffView ? schedule.shiftId : schedule.staffId) ?? "defaultId";
      const relatedList = isStaffView
        ? shifts
        : staffs.filter((staff) => staff.status === "Active");
      const relatedItem = relatedList.find((item) => {
        if (isStaffView) {
          return (
            item.id === relatedId && (item as ShiftResponse).status === "Active"
          );
        }
        return item.id === relatedId;
      });

      if (!relatedItem) return null;

      let displayText;
      let timeInfo = "";
      if (relatedItem) {
        if (isStaffView) {
          const shift = relatedItem as ShiftResponse;
          displayText = shift.shiftName;
          timeInfo = `(${shift.startTime.slice(0, 5)} - ${shift.endTime.slice(
            0,
            5
          )})`;
        } else {
          const staff = relatedItem as UserProfile;
          displayText = `${staff.fullName}${
            staff.userName ? ` (${staff.userName})` : ""
          }`;
        }
      } else {
        displayText = relatedId;
      }

      const color = generateColor(relatedId);

      return (
        <div
          key={schedule.id}
          style={{ textAlign: "center", marginBottom: "8px" }}
        >
          <Tag color={color} closable onClose={() => handleDelete(schedule.id)}>
            {displayText}
          </Tag>
          {timeInfo && <div style={{ fontSize: 12 }}>{timeInfo}</div>}
          <div style={{ fontSize: 12 }}>{schedule.note}</div>
        </div>
      );
    });
  };

  const areAllOptionsAssigned = (rowId: string, date: Date) => {
    if (viewMode === "staff") {
      const existingShifts = schedules
        .filter(
          (s) => s.staffId === rowId && dayjs(s.workDate).isSame(date, "day")
        )
        .map((s) => s.shiftId)
        .filter((shiftId) =>
          shifts.some(
            (shift) => shift.id === shiftId && shift.status === "Active"
          )
        );

      const availableActiveShifts = shifts
        .filter((shift) => shift.status === "Active")
        .map((shift) => shift.id);

      return (
        availableActiveShifts.length > 0 &&
        availableActiveShifts.every((shiftId) =>
          existingShifts.includes(shiftId)
        )
      );
    } else {
      const existingStaffs = schedules
        .filter(
          (s) => s.shiftId === rowId && dayjs(s.workDate).isSame(date, "day")
        )
        .map((s) => s.staffId)
        .filter((staffId) =>
          staffs.some(
            (staff) => staff.id === staffId && staff.status === "Active"
          )
        );

      const availableActiveStaffs = staffs
        .filter((staff) => staff.status === "Active")
        .map((staff) => staff.id);

      return (
        availableActiveStaffs.length > 0 &&
        availableActiveStaffs.every((staffId) =>
          existingStaffs.includes(staffId)
        )
      );
    }
  };

  const columns = [
    {
      title: viewMode === "staff" ? "STAFF" : "SHIFT",
      dataIndex: "id",
      key: "id",
      fixed: 'left' as const,
      width: 200,
      render: (id: string, record: any) => (
        <div>
          {viewMode === "staff" ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>{(record as UserProfile).fullName}</div>
              {(record as UserProfile).userName && (
                <div style={{ color: "#666" }}>
                  ({(record as UserProfile).userName})
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>{(record as ShiftResponse).shiftName}</div>
              <div style={{ color: "#666", fontSize: "12px" }}>
                ({(record as ShiftResponse).startTime.slice(0, 5)} -{" "}
                {(record as ShiftResponse).endTime.slice(0, 5)})
              </div>
            </div>
          )}
        </div>
      ),
    },
    ...currentWeek.map((date, index) => {
      const dateString = dayjs(date).format("YYYY-MM-DD");
      const isToday = dayjs(date).isSame(dayjs(), "day");

      return {
        title: (
          <div style={{ textAlign: "center" }}>
            <div
              style={
                isToday
                  ? {
                      backgroundColor: "orange",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "50%",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      width: "fit-content",
                      margin: "0 auto",
                    }
                  : {}
              }
            >
              {dayjs(date).format("ddd").toUpperCase()}
              <br />
              {dayjs(date).format("DD/MM")}
            </div>
          </div>
        ),
        dataIndex: dateString,
        key: dateString,
        render: (_: any, record: any) => {
          const schedules = getScheduleForCell(record.id, date);
          return (
            <div
              style={{
                position: "relative",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {schedules.length > 0 &&
                renderCellContent(schedules, viewMode === "staff")}
              {!areAllOptionsAssigned(record.id, date) && (
                <Button
                  size="small"
                  onClick={() => handleAdd(dateString, record.id)}
                  style={{
                    opacity: 0,
                    transition: "opacity 0.3s",
                  }}
                  className="schedule-add-button"
                >
                  Add {viewMode === "staff" ? "Shift" : "Staff"}
                </Button>
              )}
              <style>
                {`
                  td:hover .schedule-add-button {
                    opacity: 1 !important;
                  }
                  .schedule-add-button:hover {
                    opacity: 1 !important;
                  }
                `}
              </style>
            </div>
          );
        },
        align: "center" as "center",
      };
    }),
  ];

  const filteredRowData =
    viewMode === "staff"
      ? (rowData as UserProfile[]).filter((staff) => staff.status === "Active")
      : rowData;

  return (
    <>
      {contextHolder}
      <Table
        dataSource={filteredRowData}
        columns={columns}
        rowKey="id"
        bordered
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </>
  );
};

export default ScheduleTable;
