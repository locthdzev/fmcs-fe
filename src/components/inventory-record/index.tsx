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
  getAllInventoryRecords,
  InventoryRecordResponseDTO,
  setupInventoryRecordRealTime,
} from "@/api/inventoryrecord";
import { exportToExcel } from "@/api/export";
import { toast } from "react-toastify";
import EditInventoryRecordModal from "./EditInventoryRecordModal";
import { PencilSquareIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";

const { Column } = Table;

export function InventoryRecordManagement() {
  const router = useRouter();
  const [records, setRecords] = useState<InventoryRecordResponseDTO[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<InventoryRecordResponseDTO | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const fetchRecords = async () => {
    try {
      const result = await getAllInventoryRecords(currentPage, pageSize, "");
      setRecords(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Không thể tải danh sách inventory records.");
    }
  };

  useEffect(() => {
    fetchRecords();

    const connection = setupInventoryRecordRealTime(
      (updatedRecord: InventoryRecordResponseDTO) => {
        setRecords((prev) =>
          prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
        );
        toast.info(`Inventory record ${updatedRecord.batchCode} đã được cập nhật!`);
      }
    );

    return () => {
      connection.stop();
    };
  }, [currentPage]);

  const handleShowEditModal = (record: InventoryRecordResponseDTO) => {
    setCurrentRecord(record);
    setIsEditModalVisible(true);
  };

  const handleExportExcel = () => {
    exportToExcel(
      "/inventoryrecord-management/inventoryrecords/export",
      "inventory_records.xlsx"
    );
    toast.success("Đang tải file Excel...");
  };

  return (
    <div>
      <Card className="m-4">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold">Quản lý Inventory Record</h3>
          </div>
          <Button
            type="primary"
            onClick={handleExportExcel}
            icon={<DocumentArrowDownIcon className="w-5 h-5" />}
          >
            Xuất Excel
          </Button>
        </CardHeader>
        <CardBody>
          <Table
            dataSource={records}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              onChange: (page) => setCurrentPage(page),
            }}
            onRow={(record) => ({
              onClick: () => router.push(`/inventoryrecord/detail?id=${record.id}`),
            })}
          >
            <Column
              title="TÊN THUỐC"
              dataIndex={["drug", "name"]}
              key="drugName"
              sorter={(a, b) => a.drug.name.localeCompare(b.drug.name)}
            />
            <Column
              title="MÃ BATCH"
              dataIndex="batchCode"
              key="batchCode"
              sorter={(a, b) => a.batchCode.localeCompare(b.batchCode)}
            />
            <Column
              title="SỐ LƯỢNG TỒN"
              dataIndex="quantityInStock"
              key="quantityInStock"
              sorter={(a, b) => a.quantityInStock - b.quantityInStock}
            />
            <Column
              title="MỨC ĐẶT LẠI"
              dataIndex="reorderLevel"
              key="reorderLevel"
              sorter={(a, b) => a.reorderLevel - b.reorderLevel}
            />
            <Column
              title="TRẠNG THÁI"
              dataIndex="status"
              key="status"
              render={(status) => (
                <Chip
                  className="capitalize"
                  color={status === "ACTIVE" ? "success" : "danger"}
                  size="sm"
                  variant="flat"
                >
                  {status}
                </Chip>
              )}
            />
            <Column
              title="HÀNH ĐỘNG"
              key="actions"
              align="center"
              render={(_, record: InventoryRecordResponseDTO) => (
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
              )}
            />
          </Table>

          {currentRecord && (
            <EditInventoryRecordModal
              visible={isEditModalVisible}
              record={currentRecord}
              onClose={() => setIsEditModalVisible(false)}
              onSuccess={fetchRecords}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
