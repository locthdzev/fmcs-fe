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
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  getAllBatchNumbers,
  toggleBatchNumberStatus,
  mergeBatchNumbers,
  BatchNumberResponseDTO,
  setupBatchNumberRealTime,
} from "@/api/batchnumber";
import { exportToExcel } from "@/api/export";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import EditBatchNumberModal from "./EditBatchNumberModal";
import MergeBatchNumbersModal from "./MergeBatchNumbersModal";
import { BatchNumberIcon } from "./Icons";

const { Column } = Table;

export function BatchNumberManagement() {
  const router = useRouter();
  const [batchNumbers, setBatchNumbers] = useState<BatchNumberResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
  const [currentBatchNumber, setCurrentBatchNumber] =
    useState<BatchNumberResponseDTO | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchBatchNumbers = async () => {
    try {
      const result = await getAllBatchNumbers(1, 1000); // Lấy tất cả để đồng bộ với Shift
      setBatchNumbers(result.data);
    } catch (error) {
      toast.error("Không thể tải danh sách batch number.");
    }
  };

  useEffect(() => {
    fetchBatchNumbers();

    const connection = setupBatchNumberRealTime(
      (updatedBatch: BatchNumberResponseDTO) => {
        toast.info(`Batch ${updatedBatch.batchCode} đã được cập nhật!`);
        fetchBatchNumbers();
      }
    );

    return () => {
      connection.stop();
    };
  }, []);

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      setLoading((prev) => ({ ...prev, [id]: true }));
      const response = await toggleBatchNumberStatus(
        id,
        isActive ? "ACTIVE" : "INACTIVE"
      );
      if (response.isSuccess) {
        toast.success(response.message || "Cập nhật trạng thái thành công!");
        fetchBatchNumbers();
      } else {
        toast.error(response.message || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái");
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleMerge = async () => {
    if (selectedIds.length < 2) {
      toast.error("Vui lòng chọn ít nhất 2 batch number để gộp.");
      return;
    }
    try {
      const response = await mergeBatchNumbers({ batchNumberIds: selectedIds });
      if (response.isSuccess) {
        toast.success("Gộp batch number thành công!");
        setSelectedIds([]);
        fetchBatchNumbers();
      } else {
        toast.error(response.message || "Không thể gộp batch number");
      }
    } catch {
      toast.error("Không thể gộp batch number");
    }
  };

  const handleShowEditModal = (batch: BatchNumberResponseDTO) => {
    setCurrentBatchNumber(batch);
    setIsEditModalVisible(true);
  };

  const handleShowMergeModal = () => {
    setIsMergeModalVisible(true);
  };

  const handleExportExcel = () => {
    exportToExcel(
      "/batchnumber-management/batchnumbers/export",
      "batch_numbers.xlsx"
    );
    toast.success("Đang tải file Excel...");
  };

  const rowSelection = {
    selectedRowKeys: selectedIds,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedIds(selectedRowKeys as string[]);
    },
  };

  return (
    <div>
      <Card className="m-4">
        <CardHeader className="flex items-center gap-2">
          <BatchNumberIcon /> {/* Thay bằng icon phù hợp nếu có */}
          <h3 className="text-2xl font-bold">Batch Number Management</h3>
        </CardHeader>
        <CardBody>
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <Button type="primary" onClick={handleExportExcel}>
              Export Excel
            </Button>
            <Button
              type="primary"
              onClick={handleShowMergeModal}
              disabled={selectedIds.length < 2}
              icon={<PlusIcon />}
            >
              Merge Batch Numbers
            </Button>
          </div>

          <Table
            dataSource={batchNumbers}
            rowKey="id"
            rowSelection={rowSelection}
            pagination={false}
            // onRow={(record) => ({
            //   onClick: () => router.push(`/batchnumber/detail?id=${record.id}`),
            // })}
          >
            <Column title="BATCH CODE" dataIndex="batchCode" key="batchCode" />
            <Column
              title="DRUG NAME"
              dataIndex={["drug", "name"]}
              key="drugName"
            />
            <Column
              title="SUPPLIER"
              dataIndex={["supplier", "supplierName"]}
              key="supplierName"
            />
            <Column
              title="MANUFACTURING DATE"
              dataIndex="manufacturingDate"
              key="manufacturingDate"
              render={(date) =>
                date ? new Date(date).toLocaleDateString("vi-VN") : "-"
              }
            />
            <Column
              title="EXPIRY DATE"
              dataIndex="expiryDate"
              key="expiryDate"
              render={(date) =>
                date ? new Date(date).toLocaleDateString("vi-VN") : "-"
              }
            />
            <Column
              title="QUANTITY RECEIVED"
              dataIndex="quantityReceived"
              key="quantityReceived"
            />
            <Column
              title="STATUS"
              dataIndex="status"
              key="status"
              render={(status) => (
                <Chip
                  className="capitalize"
                  color={
                    status === "ACTIVE"
                      ? "success"
                      : status === "INACTIVE"
                      ? "danger"
                      : "warning"
                  }
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
              render={(_, record: BatchNumberResponseDTO) => (
                <Switch
                  checked={record.status === "ACTIVE"}
                  loading={loading[record.id]}
                  onChange={(checked) => handleToggleStatus(record.id, checked)}
                />
              )}
            />
            <Column
              title="ACTIONS"
              key="actions"
              align="center"
              render={(_, record: BatchNumberResponseDTO) => (
                <div className="space-x-2">
                  <Button
                    type="text"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowEditModal(record);
                    }}
                    icon={
                      <PencilSquareIcon
                        className="w-5 h-5"
                        style={{ color: "#1890ff" }}
                      />
                    }
                  />
                </div>
              )}
            />
          </Table>

          {/* Modal Edit Batch Number */}
          {currentBatchNumber && (
            <EditBatchNumberModal
              visible={isEditModalVisible}
              batchNumber={currentBatchNumber}
              onClose={() => setIsEditModalVisible(false)}
              onSuccess={fetchBatchNumbers}
            />
          )}

          {/* Modal Merge Batch Numbers */}
          <MergeBatchNumbersModal
            visible={isMergeModalVisible}
            onClose={() => setIsMergeModalVisible(false)}
            onSuccess={fetchBatchNumbers}
            selectedIds={selectedIds}
          />
        </CardBody>
      </Card>
    </div>
  );
}
