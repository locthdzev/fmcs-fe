import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Switch,
  Select,
  Input,
  DatePicker,
  Pagination,
  Space,
} from "antd";
import { Chip, Card, CardHeader, CardBody } from "@heroui/react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  getAllBatchNumbers,
  updateBatchNumberStatus,
  BatchNumberResponseDTO,
  setupBatchNumberRealTime,
  getMergeableBatchGroups,
} from "@/api/batchnumber";
import { exportToExcel } from "@/api/export";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import EditBatchNumberModal from "./EditBatchNumberModal";
import MergeBatchNumbersModal from "./MergeBatchNumbersModal";
import { BatchNumberIcon } from "./Icons";
import debounce from "lodash/debounce";

const { Column } = Table;
const { Option } = Select;
const { RangePicker } = DatePicker;

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
  const [mergeableGroups, setMergeableGroups] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>("");
  const [drugNameFilter, setDrugNameFilter] = useState<string>("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [manufacturingDateRange, setManufacturingDateRange] = useState<
    [string, string] | null
  >(null);
  const [expiryDateRange, setExpiryDateRange] = useState<
    [string, string] | null
  >(null);

  const fetchBatchNumbers = useCallback(async () => {
    try {
      const result = await getAllBatchNumbers(
        currentPage,
        pageSize,
        searchText
      );
      let filteredData = result.data;

      if (drugNameFilter) {
        filteredData = filteredData.filter((b: BatchNumberResponseDTO) =>
          b.drug.name.toLowerCase().includes(drugNameFilter.toLowerCase())
        );
      }
      if (supplierFilter) {
        filteredData = filteredData.filter((b: BatchNumberResponseDTO) =>
          b.supplier.supplierName
            .toLowerCase()
            .includes(supplierFilter.toLowerCase())
        );
      }
      if (statusFilter) {
        filteredData = filteredData.filter(
          (b: BatchNumberResponseDTO) => b.status === statusFilter
        );
      }
      if (manufacturingDateRange) {
        filteredData = filteredData.filter((b: BatchNumberResponseDTO) => {
          if (!b.manufacturingDate) return false;
          const date = new Date(b.manufacturingDate);
          return (
            date >= new Date(manufacturingDateRange[0]) &&
            date <= new Date(manufacturingDateRange[1])
          );
        });
      }
      if (expiryDateRange) {
        filteredData = filteredData.filter((b: BatchNumberResponseDTO) => {
          if (!b.expiryDate) return false;
          const date = new Date(b.expiryDate);
          return (
            date >= new Date(expiryDateRange[0]) &&
            date <= new Date(expiryDateRange[1])
          );
        });
      }

      filteredData.sort(
        (a: BatchNumberResponseDTO, b: BatchNumberResponseDTO) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setBatchNumbers(filteredData);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load batch number list.");
    }
  }, [
    currentPage,
    searchText,
    drugNameFilter,
    supplierFilter,
    statusFilter,
    manufacturingDateRange,
    expiryDateRange,
  ]);

  const fetchMergeableGroups = useCallback(async () => {
    try {
      const groups = await getMergeableBatchGroups();
      setMergeableGroups(groups);
    } catch (error) {
      toast.error("Unable to load mergeable batch groups.");
    }
  }, []);

  useEffect(() => {
    fetchBatchNumbers();
    fetchMergeableGroups();

    const connection = setupBatchNumberRealTime(
      (updatedBatch: BatchNumberResponseDTO) => {
        fetchBatchNumbers();
        fetchMergeableGroups();
      }
    );

    return () => {
      connection.stop();
    };
  }, [fetchBatchNumbers, fetchMergeableGroups]);

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    const batch = batchNumbers.find((b) => b.id === id);
    if (!batch?.manufacturingDate || !batch?.expiryDate) {
      toast.error("Please update Manufacturing Date and Expiry Date first.");
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [id]: true }));
      const response = await updateBatchNumberStatus(
        id,
        isActive ? "Active" : "Inactive"
      );
      if (response.isSuccess) {
        toast.success(response.message || "Status updated successfully!");
        fetchBatchNumbers();
        fetchMergeableGroups();
      } else {
        toast.error(response.message || "Unable to update status");
      }
    } catch (error) {
      toast.error("Unable to update status");
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
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
    toast.success("Downloading Excel file...");
  };

  const handleSearchChange = debounce((value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  }, 300);

  return (
    <div>
      <Card className="m-4">
        <CardHeader className="flex items-center gap-2">
          <BatchNumberIcon />
          <h3 className="text-2xl font-bold">Batch Number Management</h3>
        </CardHeader>
        <CardBody>
          <Space
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Space>
              <Input
                placeholder="Search by BatchCode"
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{ width: 200 }}
              />
              <Input
                placeholder="Filter by Drug Name"
                onChange={(e) => setDrugNameFilter(e.target.value)}
                style={{ width: 200 }}
              />
              <Input
                placeholder="Filter by Supplier"
                onChange={(e) => setSupplierFilter(e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="Filter by Status"
                onChange={(value) => setStatusFilter(value)}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="Priority">Priority</Option>
                <Option value="Active">Active</Option>
                <Option value="NearExpiry">Near Expiry</Option>
                <Option value="Inactive">Inactive</Option>
                <Option value="Expired">Expired</Option>
              </Select>
              <RangePicker
                placeholder={["Manufacturing Start", "End"]}
                onChange={(dates) =>
                  setManufacturingDateRange(
                    dates
                      ? [
                          dates[0]?.format("YYYY-MM-DD") ?? "",
                          dates[1]?.format("YYYY-MM-DD") ?? "",
                        ]
                      : null
                  )
                }
              />
              <RangePicker
                placeholder={["Expiry Start", "End"]}
                onChange={(dates) =>
                  setExpiryDateRange(
                    dates
                      ? [
                          dates[0]?.format("YYYY-MM-DD") ?? "",
                          dates[1]?.format("YYYY-MM-DD") ?? "",
                        ]
                      : null
                  )
                }
              />
            </Space>
            <Space>
              <Button type="primary" onClick={handleExportExcel}>
                Export Excel
              </Button>
              <Button
                type="primary"
                onClick={handleShowMergeModal}
                disabled={mergeableGroups.length === 0}
                icon={<PlusIcon />}
              >
                Merge Batch Numbers
              </Button>
            </Space>
          </Space>

          <Table dataSource={batchNumbers} rowKey="id" pagination={false}>
            <Column
              title="BATCH CODE"
              dataIndex="batchCode"
              key="batchCode"
              sorter={(a, b) => a.batchCode.localeCompare(b.batchCode)}
            />
            <Column
              title="DRUG NAME"
              dataIndex={["drug", "name"]}
              key="drugName"
              sorter={(a, b) => a.drug.name.localeCompare(b.drug.name)}
            />
            <Column
              title="SUPPLIER"
              dataIndex={["supplier", "supplierName"]}
              key="supplierName"
              sorter={(a, b) =>
                a.supplier.supplierName.localeCompare(b.supplier.supplierName)
              }
            />
            <Column
              title="MANUFACTURING DATE"
              dataIndex="manufacturingDate"
              key="manufacturingDate"
              render={(date) =>
                date ? new Date(date).toLocaleDateString("vi-VN") : "-"
              }
              sorter={(a, b) =>
                new Date(a.manufacturingDate || 0).getTime() -
                new Date(b.manufacturingDate || 0).getTime()
              }
            />
            <Column
              title="EXPIRY DATE"
              dataIndex="expiryDate"
              key="expiryDate"
              render={(date) =>
                date ? new Date(date).toLocaleDateString("vi-VN") : "-"
              }
              sorter={(a, b) =>
                new Date(a.expiryDate || 0).getTime() -
                new Date(b.expiryDate || 0).getTime()
              }
            />
            <Column
              title="QUANTITY RECEIVED"
              dataIndex="quantityReceived"
              key="quantityReceived"
              sorter={(a, b) => a.quantityReceived - b.quantityReceived}
            />
            <Column
              title="STATUS"
              dataIndex="status"
              key="status"
              render={(status) => (
                <Chip
                  className="capitalize"
                  color={
                    status === "Priority"
                      ? "primary"
                      : status === "Active"
                      ? "success"
                      : status === "NearExpiry"
                      ? "warning"
                      : status === "Inactive"
                      ? "danger"
                      : "secondary"
                  }
                  size="sm"
                  variant="flat"
                >
                  {status === "NearExpiry" ? "Near Expiry" : status}
                </Chip>
              )}
              sorter={(a, b) => a.status.localeCompare(b.status)}
            />
            <Column
              title="CREATED AT"
              dataIndex="createdAt"
              key="createdAt"
              render={(date) =>
                date ? new Date(date).toLocaleString("vi-VN") : "-"
              }
              sorter={(a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              }
            />
            <Column
              title="UPDATED AT"
              dataIndex="updatedAt"
              key="updatedAt"
              render={(date) =>
                date ? new Date(date).toLocaleString("vi-VN") : "-"
              }
              sorter={(a, b) =>
                new Date(b.updatedAt || 0).getTime() -
                new Date(a.updatedAt || 0).getTime()
              }
            />
            <Column
              title=""
              key="toggle"
              align="center"
              render={(_, record: BatchNumberResponseDTO) => (
                <Switch
                  checked={
                    record.status === "Priority" ||
                    record.status === "Active" ||
                    record.status === "NearExpiry"
                  }
                  disabled={
                    !record.manufacturingDate ||
                    !record.expiryDate ||
                    record.status === "Expired" // Disable nếu Expired
                  }
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
                <Button
                  type="text"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowEditModal(record);
                  }}
                  disabled={record.status === "Expired"} // Disable nếu Expired
                  icon={
                    <PencilSquareIcon
                      className="w-5 h-5"
                      style={{
                        color:
                          record.status === "Expired" ? "#d9d9d9" : "#1890ff",
                      }}
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
        onSuccess={() => {
          fetchBatchNumbers();
          fetchMergeableGroups();
        }}
      />
    </div>
  );
}
