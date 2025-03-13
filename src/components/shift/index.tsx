import React, { useState, useEffect } from "react";
import { Button, Table, Switch } from "antd";
import {
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  CardHeader,
  CardBody,
} from "@heroui/react";
import {
  getShifts,
  activateShifts,
  deactivateShifts,
  deleteShift,
  ShiftResponse,
} from "@/api/shift";
import { PlusIcon, ScheduleIcon } from "../schedule/Icons";
import { toast } from "react-toastify";
import EditShiftModal from "./EditShiftModal";
import CreateShiftModal from "./CreateShiftModal";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

const { Column } = Table;

export function ShiftManagement() {
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [currentShift, setCurrentShift] = useState<ShiftResponse | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] =
    useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);

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

  const handleShowDeleteConfirm = (shiftId: string) => {
    setShiftToDelete(shiftId);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleDeleteShift = async () => {
    if (!shiftToDelete) return;
    try {
      const response = await deleteShift(shiftToDelete);
      if (response.isSuccess) {
        toast.success(response.message || "Shift deleted successfully!");
        fetchShifts();
      } else {
        toast.error(response.message || "Failed to delete shift");
      }
    } catch (error) {
      toast.error("Failed to delete shift");
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setShiftToDelete(null);
    }
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
      <Card className="m-4">
        <CardHeader className="flex items-center gap-2">
          <ScheduleIcon />
          <h3 className="text-2xl font-bold">Shift Management</h3>
        </CardHeader>
        <CardBody>
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

          <Table dataSource={shifts} rowKey="id" pagination={false}>
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
                <div className="space-x-2">
                  <Button
                    type="text"
                    onClick={() => handleShowEditModal(record as ShiftResponse)}
                    icon={
                      <PencilSquareIcon
                        className="w-5 h-5"
                        style={{ color: "#1890ff" }}
                      />
                    }
                  />
                  <Button
                    type="text"
                    onClick={() => handleShowDeleteConfirm(record.id)}
                    icon={
                      <TrashIcon
                        className="w-5 h-5"
                        style={{ color: "#ff4d4f" }}
                      />
                    }
                  />
                </div>
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

          {/* Modal Confirm Delete */}
          <Modal
            isOpen={isConfirmDeleteModalOpen}
            onOpenChange={(open) => !open && setIsConfirmDeleteModalOpen(false)}
          >
            <ModalContent className="max-w-[500px] rounded-lg shadow-lg border border-gray-200 bg-white">
              <ModalHeader className="border-b pb-3">Confirm Delete</ModalHeader>
              <ModalBody>
                <p className="text-gray-700">
                  Are you sure you want to{" "}
                  <span className="text-red-600">delete</span> this shift?
                </p>
              </ModalBody>
              <ModalFooter className="border-t pt-4">
                <div className="flex justify-end gap-3">
                  <Button onClick={() => setIsConfirmDeleteModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="primary" onClick={handleDeleteShift}>
                    Confirm
                  </Button>
                </div>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </CardBody>
      </Card>
    </div>
  );
}
