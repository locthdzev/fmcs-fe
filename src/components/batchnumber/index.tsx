import React, { useState, useEffect } from "react";
import { Button, Table, Switch, Select, Input, Pagination } from "antd";
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
  getBatchNumbersByDrugId,
  getBatchNumbersByStatus,
  BatchNumberResponseDTO,
  setupBatchNumberRealTime,
} from "@/api/batchnumber";
import { exportToExcel } from "@/api/export";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import EditBatchNumberModal from "./EditBatchNumberModal";
import MergeBatchNumbersModal from "./MergeBatchNumbersModal";

const { Column } = Table;
const { Option } = Select;

export function BatchNumberManagement() {
  const router = useRouter();
  const [batchNumbers, setBatchNumbers] = useState<BatchNumberResponseDTO[]>(
    []
  );
  const [filteredBatchNumbers, setFilteredBatchNumbers] = useState<
    BatchNumberResponseDTO[]
  >([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"toggle" | "merge" | null>(
    null
  );
  const [currentBatchNumber, setCurrentBatchNumber] =
    useState<BatchNumberResponseDTO | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drugIdFilter, setDrugIdFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const fetchBatchNumbers = async () => {
    try {
      const result = await getAllBatchNumbers(
        currentPage,
        pageSize,
        searchText
      );
      setBatchNumbers(result.data);
      setFilteredBatchNumbers(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Không thể tải danh sách batch number.");
    }
  };

  useEffect(() => {
    fetchBatchNumbers();

    const connection = setupBatchNumberRealTime(
      (updatedBatch: BatchNumberResponseDTO) => {
        toast.info(`Batch ${updatedBatch.batchCode} đã được cập nhật!`);
        fetchBatchNumbers(); // Làm mới toàn bộ danh sách mỗi khi nhận tín hiệu
      }
    );

    return () => {
      connection.stop();
    };
  }, [currentPage, drugIdFilter, statusFilter, searchText]);

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

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchBatchNumbers();
  };

  const handleRowSelection = (selectedRowKeys: React.Key[]) => {
    setSelectedIds(selectedRowKeys as string[]);
  };

  const rowSelection = {
    selectedRowKeys: selectedIds,
    onChange: handleRowSelection,
  };

  const handleExportExcel = () => {
    exportToExcel(
      "/batchnumber-management/batchnumbers/export",
      "batch_numbers.xlsx"
    );
    toast.success("Đang tải file Excel...");
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">Quản lý Batch Number</h3>
          <div className="flex gap-2">
            <Button type="primary" onClick={handleExportExcel}>
              Xuất Excel
            </Button>
            <Button
              type="primary"
              onClick={() => setIsMergeModalVisible(true)}
              disabled={selectedIds.length < 2}
            >
              Gộp Batch Numbers
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              <Input.Search
                placeholder="Tìm kiếm theo BatchCode hoặc Drug Name"
                onSearch={handleSearch}
                style={{ width: 300, marginRight: 16 }}
              />
              <Select
                placeholder="Lọc theo Drug ID"
                onChange={(value) => setDrugIdFilter(value)}
                style={{ width: 200, marginRight: 16 }}
                allowClear
              >
                {/* Giả sử lấy danh sách Drug ID từ API */}
              </Select>
              <Select
                placeholder="Lọc theo trạng thái"
                onChange={(value) => setStatusFilter(value)}
                style={{ width: 200 }}
                allowClear
              >
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
                <Option value="EXPIRED">Expired</Option>
                <Option value="NEAR_EXPIRY">Near Expiry</Option>
              </Select>
            </div>
          </div>

          <Table
            dataSource={filteredBatchNumbers}
            rowKey="id"
            rowSelection={rowSelection}
            pagination={false}
            scroll={{ x: true }}
            onRow={(record) => ({
              onClick: () => router.push(`/batchnumber/detail?id=${record.id}`),
            })}
          >
            <Column
              title="MÃ BATCH"
              dataIndex="batchCode"
              key="batchCode"
              sorter={(a, b) => a.batchCode.localeCompare(b.batchCode)}
            />
            <Column
              title="TÊN THUỐC"
              dataIndex={["drug", "name"]}
              key="drugName"
              sorter={(a, b) => a.drug.name.localeCompare(b.drug.name)}
            />
            <Column
              title="NHÀ CUNG CẤP"
              dataIndex={["supplier", "supplierName"]}
              key="supplierName"
            />
            <Column
              title="NGÀY SẢN XUẤT"
              dataIndex="manufacturingDate"
              key="manufacturingDate"
              render={(date) =>
                date ? new Date(date).toLocaleDateString("vi-VN") : "-"
              }
              sorter={(a, b) =>
                (a.manufacturingDate || "").localeCompare(
                  b.manufacturingDate || ""
                )
              }
            />
            <Column
              title="NGÀY HẾT HẠN"
              dataIndex="expiryDate"
              key="expiryDate"
              render={(date) =>
                date ? new Date(date).toLocaleDateString("vi-VN") : "-"
              }
              sorter={(a, b) =>
                (a.expiryDate || "").localeCompare(b.expiryDate || "")
              }
            />
            <Column
              title="SỐ LƯỢNG NHẬN"
              dataIndex="quantityReceived"
              key="quantityReceived"
              sorter={(a, b) => a.quantityReceived - b.quantityReceived}
            />
            <Column
              title="TRẠNG THÁI"
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
              title="BẬT/TẮT"
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
              title="HÀNH ĐỘNG"
              key="actions"
              align="center"
              render={(_, record: BatchNumberResponseDTO) => (
                <Button
                  type="text"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBatchNumber(record);
                    setIsEditModalVisible(true);
                  }}
                  icon={
                    <PencilSquareIcon
                      className="w-5 h-5"
                      style={{ color: "#1890ff" }}
                    />
                  }
                />
              )}
            />
          </Table>

          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={(page) => setCurrentPage(page)}
            style={{ marginTop: 16, textAlign: "right" }}
          />
        </CardBody>
      </Card>

      {currentBatchNumber && (
        <EditBatchNumberModal
          visible={isEditModalVisible}
          batchNumber={currentBatchNumber}
          onClose={() => setIsEditModalVisible(false)}
          onSuccess={fetchBatchNumbers}
        />
      )}

      <MergeBatchNumbersModal
        visible={isMergeModalVisible}
        onClose={() => setIsMergeModalVisible(false)}
        onSuccess={fetchBatchNumbers}
        selectedIds={selectedIds}
      />

      <Modal
        isOpen={isConfirmModalOpen}
        onOpenChange={(open) => !open && setIsConfirmModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>Xác nhận hành động</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc chắn muốn{" "}
              {confirmAction === "toggle" ? "thay đổi trạng thái" : "gộp"} các
              batch number đã chọn không?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setIsConfirmModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={confirmAction === "merge" ? handleMerge : () => {}}
            >
              Xác nhận
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
