import React from "react";
import { Table, Tag, Button } from "antd";
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
  shifts: ShiftResponse[]; // Thêm props shifts
  staffs: UserProfile[]; // Thêm props staffs
  onDelete: (id: string) => void; // Thêm props onDelete
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
  const getScheduleForCell = (rowId: string, date: Date) => {
    return schedules.find(
      (s) =>
        s[viewMode === "staff" ? "staffId" : "shiftId"] === rowId &&
        dayjs(s.workDate).isSame(date, "day")
    );
  };

  const columns = [
    {
      title: viewMode === "staff" ? "Staff" : "Shift",
      dataIndex: "id",
      key: "id",
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
            (record as ShiftResponse).shiftName
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
              {dayjs(date).format("ddd")}
              <br />
              {dayjs(date).format("DD/MM")}
            </div>
          </div>
        ),
        dataIndex: dateString,
        key: dateString,
        render: (_: any, record: any) => {
          const schedule = getScheduleForCell(record.id, date);
          if (schedule) {
            const isStaffView = viewMode === "staff";
            const relatedId = isStaffView ? schedule.shiftId : schedule.staffId;
            const relatedList = isStaffView ? shifts : staffs;
            const relatedItem = relatedList.find(
              (item) => item.id === relatedId
            );

            let displayText;
            if (relatedItem) {
              if (isStaffView) {
                displayText = (relatedItem as ShiftResponse).shiftName;
              } else {
                const staff = relatedItem as UserProfile;
                displayText = `${staff.fullName}${
                  staff.userName ? ` (${staff.userName})` : ""
                }`;
              }
            } else {
              displayText = relatedId;
            }

            return (
              <div style={{ textAlign: "center" }}>
                <Tag
                  color={schedule.status === "ACTIVE" ? "green" : "red"}
                  closable
                  onClose={() => onDelete(schedule.id)}
                >
                  {displayText}
                </Tag>
                <div style={{ fontSize: 12 }}>{schedule.note}</div>
              </div>
            );
          }
          return (
            <div
              style={{
                position: "relative",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button
                size="small"
                onClick={() => onAdd(dateString, record.id)}
                style={{
                  position: "absolute",
                  opacity: 0,
                  transition: "opacity 0.3s",
                }}
                className="schedule-add-button"
              >
                Add {viewMode === "staff" ? "Shift" : "Staff"}
              </Button>
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

  return (
    <Table
      dataSource={rowData}
      columns={columns}
      rowKey="id"
      bordered
      pagination={false}
    />
  );
};

export default ScheduleTable;
