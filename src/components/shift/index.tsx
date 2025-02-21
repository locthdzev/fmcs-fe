import React, { useState, useEffect } from "react";
import { Button, Table, Switch } from "antd";
import { Chip } from "@heroui/react";
import {
  getShifts,
  activateShifts,
  deactivateShifts,
  ShiftResponse,
} from "@/api/shift";
import { PlusIcon, ScheduleIcon } from "../schedule/Icons";
import { toast } from "react-toastify";
import EditShiftModal from "./EditShiftModal";
import CreateShiftModal from "./CreateShiftModal";

const { Column } = Table;

export function ShiftManagement() {
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [currentShift, setCurrentShift] = useState<ShiftResponse | null>(null);

  const fetchShifts = async () => {
    try {
      const data = await getShifts();
      setShifts(data);
    } catch (error) {
      toast.error("Failed to fetch shifts.");
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleShowCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const handleShowEditModal = (shift: ShiftResponse) => {
    setCurrentShift(shift);
    setIsEditModalVisible(true);
  };

  const handleToggleStatus = async (shiftId: string, isActive: boolean) => {
    try {
      setLoading((prev) => ({ ...prev, [shiftId]: true }));

      const response = isActive
        ? await activateShifts([shiftId])
        : await deactivateShifts([shiftId]);

      if (response.isSuccess) {
        toast.success(response.message || "Shift status updated!");
      } else {
        toast.error(response.message || "Failed to update shift status");
      }

      setShifts((prevShifts) =>
        prevShifts.map((shift) =>
          shift.id === shiftId
            ? { ...shift, status: isActive ? "Active" : "Inactive" }
            : shift
        )
      );
    } catch (error) {
      toast.error("Failed to toggle shift status");
    } finally {
      setLoading((prev) => ({ ...prev, [shiftId]: false }));
    }
  };

  const calculateTotalHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000/01/01 ${startTime.slice(0, 5)}`);
    const end = new Date(`2000/01/01 ${endTime.slice(0, 5)}`);
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 ml-4">
        <ScheduleIcon />
        <h3 className="text-2xl font-bold">Shift Management</h3>
      </div>
      <div style={{ padding: "16px" }}>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            type="primary"
            onClick={handleShowCreateModal}
            icon={<PlusIcon />}
          >
            Add New Shift
          </Button>
        </div>

        <Table dataSource={shifts} rowKey="id">
          <Column title="SHIFT NAME" dataIndex="shiftName" key="shiftName" />
          <Column
            title="START TIME"
            dataIndex="startTime"
            key="startTime"
            render={(startTime) => startTime.slice(0, 5)}
          />
          <Column
            title="END TIME"
            dataIndex="endTime"
            key="endTime"
            render={(endTime) => endTime.slice(0, 5)}
          />
          <Column
            title="TOTAL TIME"
            key="totalTime"
            render={(_, record) =>
              calculateTotalHours(record.startTime, record.endTime)
            }
          />
          <Column
            title="STATUS"
            dataIndex="status"
            key="status"
            render={(status) => (
              <Chip
                className="capitalize"
                color={status === "Active" ? "success" : "danger"}
                size="sm"
                variant="flat"
              >
                {status}
              </Chip>
            )}
          />
          <Column
            title=""
            key="toggle"
            align="center"
            render={(_, record) => (
              <Switch
                checked={record.status === "Active"}
                loading={loading[record.id]}
                onChange={(checked) => handleToggleStatus(record.id, checked)}
              />
            )}
          />
          <Column
            title="ACTIONS"
            key="actions"
            align="center"
            render={(_, record) => (
              <Button
                type="link"
                onClick={() => handleShowEditModal(record as ShiftResponse)}
              >
                Edit
              </Button>
            )}
          />
        </Table>

        {/* Modal Create Shift */}
        <CreateShiftModal
          visible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onSuccess={fetchShifts}
        />

        {/* Modal Edit Shift */}
        {currentShift && (
          <EditShiftModal
            visible={isEditModalVisible}
            shift={currentShift}
            onClose={() => setIsEditModalVisible(false)}
            onSuccess={fetchShifts}
          />
        )}
      </div>
    </div>
  );
}
