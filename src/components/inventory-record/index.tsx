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
import {
  PencilSquareIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";

const { Column } = Table;

export function InventoryRecordManagement() {
  const router = useRouter();
  const [records, setRecords] = useState<InventoryRecordResponseDTO[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] =
    useState<InventoryRecordResponseDTO | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const fetchRecords = async () => {
    try {
      const result = await getAllInventoryRecords(currentPage, pageSize, "");
      const sortedRecords = result.data.sort((a: InventoryRecordResponseDTO, b: InventoryRecordResponseDTO) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(a.createdAt);
        const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });      setRecords(sortedRecords);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load inventory records list.");
    }
  };

  useEffect(() => {
    fetchRecords();

    const connection = setupInventoryRecordRealTime(
      (updatedRecord: InventoryRecordResponseDTO) => {
        setRecords((prev) =>
          prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
        );
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
  };

  return (
    <div>
      <Card className="m-4">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold">Inventory Record Management</h3>
          </div>
          <Button
            type="primary"
            onClick={handleExportExcel}
            icon={<DocumentArrowDownIcon className="w-5 h-5" />}
          >
            Export Excel
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
              onClick: () =>
                router.push(`/inventoryrecord/detail?id=${record.id}`),
            })}
          >
            <Column
              title="DRUG CODE"
              dataIndex={["drug", "drugCode"]}
              key="drugCode"
              sorter={(a, b) => a.drug.drugCode.localeCompare(b.drug.drugCode)}
            />
            <Column
              title="DRUG NAME"
              dataIndex={["drug", "name"]}
              key="drugName"
              sorter={(a, b) => a.drug.name.localeCompare(b.drug.name)}
            />
            <Column
              title="BATCH CODE"
              dataIndex="batchCode"
              key="batchCode"
              sorter={(a, b) => a.batchCode.localeCompare(b.batchCode)}
            />
            <Column
              title="QUANTITY IN STOCK"
              dataIndex="quantityInStock"
              key="quantityInStock"
              sorter={(a, b) => a.quantityInStock - b.quantityInStock}
            />
            <Column
              title="REORDER LEVEL"
              dataIndex="reorderLevel"
              key="reorderLevel"
              sorter={(a, b) => a.reorderLevel - b.reorderLevel}
            />
            <Column
              title="LAST UPDATED"
              dataIndex="lastUpdated"
              key="lastUpdated"
              render={(lastUpdated, record) => {
                const date = lastUpdated ? new Date(lastUpdated) : new Date(record.createdAt);
                return date.toLocaleString();
              }}
              sorter={(a, b) => {
                const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(a.createdAt);
                const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(b.createdAt);
                return dateA.getTime() - dateB.getTime();
              }}
            />
            <Column
              title="CREATED AT"
              dataIndex="createdAt"
              key="createdAt"
              render={(createdAt) => new Date(createdAt).toLocaleString()}
              sorter={(a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return dateA.getTime() - dateB.getTime();
              }}
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
              title="ACTIONS"
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