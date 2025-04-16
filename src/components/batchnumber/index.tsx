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
  message,
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
import EditBatchNumberModal from "./EditBatchNumberModal";
import MergeBatchNumbersModal from "./MergeBatchNumbersModal";
import { BatchNumberIcon } from "./Icons";
import debounce from "lodash/debounce";

const { Column } = Table;
const { Option } = Select;
const { RangePicker } = DatePicker;

export function BatchNumberManagement() {
  const [messageApi, contextHolder] = message.useMessage();
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
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("CreatedAt");
  const [ascending, setAscending] = useState<boolean>(false);

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
        searchText,
        sortBy,
        ascending,
        drugNameFilter,
        supplierFilter,
        statusFilter,
        manufacturingDateRange?.[0],
        manufacturingDateRange?.[1],
        expiryDateRange?.[0],
        expiryDateRange?.[1]
      );
      setBatchNumbers(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      messageApi.error({
        content: "Unable to load batch number list.",
        duration: 5,
      });
    }
  }, [
    currentPage,
    pageSize,
    searchText,
    sortBy,
    ascending,
    drugNameFilter,
    supplierFilter,
    statusFilter,
    manufacturingDateRange,
    expiryDateRange,
    messageApi,
  ]);

  const fetchMergeableGroups = useCallback(async () => {
    try {
      const groups = await getMergeableBatchGroups();
      setMergeableGroups(groups);
    } catch (error) {
      messageApi.error({
        content: "Unable to load mergeable batch groups.",
        duration: 5,
      });
    }
  }, [messageApi]);

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
      messageApi.error({
        content: "Please update Manufacturing Date and Expiry Date first.",
        duration: 5,
      });
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [id]: true }));
      const response = await updateBatchNumberStatus(
        id,
        isActive ? "Active" : "Inactive"
      );
      if (response.isSuccess) {
        messageApi.success({
          content: response.message || "Status updated successfully!",
          duration: 5,
        });
        fetchBatchNumbers();
        fetchMergeableGroups();
      } else {
        messageApi.error({
          content: response.message || "Unable to update status",
          duration: 5,
        });
      }
    } catch (error) {
      messageApi.error({
        content: "Unable to update status",
        duration: 5,
      });
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
    messageApi.success({
      content: "Downloading Excel file...",
      duration: 5,
    });
  };

  const handleSearchChange = debounce((value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  }, 300);

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (_: number, size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const { field, order } = sorter;
    if (field && order) {
      setSortBy(
        field === "drug.name"
          ? "DrugName"
          : field === "supplier.supplierName"
          ? "SupplierName"
          : field
      );
      setAscending(order === "ascend");
    } else {
      setSortBy("CreatedAt");
      setAscending(false);
    }
    setCurrentPage(pagination.current);
    fetchBatchNumbers();
  };

  return (
    <div>
      {contextHolder}
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
                placeholder="Search by Batch Code"
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

          <Table
            dataSource={batchNumbers}
            rowKey="id"
            pagination={false}
            onChange={handleTableChange}
          >
            <Column
              title="BATCH CODE"
              dataIndex="batchCode"
              key="batchCode"
              sorter={(a, b) => a.batchCode.localeCompare(b.batchCode)}
            />
            <Column
              title="DRUG NAME"
              dataIndex={["drug", "name"]}
              key="drug.name"
              sorter={(a, b) => a.drug.name.localeCompare(b.drug.name)}
            />
            <Column
              title="SUPPLIER"
              dataIndex={["supplier", "supplierName"]}
              key="supplier.supplierName"
              sorter={(a, b) =>
                a.supplier.supplierName.localeCompare(b.supplier.supplierName)
              }
            />
            <Column
              title="MANUFACTURING DATE"
              dataIndex="manufacturingDate"
              key="manufacturingDate"
              render={(date) =>
                date ? new Date(date).toLocaleDateString() : "-"
              }
              sorter={(a, b) =>
                (a.manufacturingDate || "").localeCompare(
                  b.manufacturingDate || ""
                )
              }
            />
            <Column
              title="EXPIRY DATE"
              dataIndex="expiryDate"
              key="expiryDate"
              render={(date) =>
                date ? new Date(date).toLocaleDateString() : "-"
              }
              sorter={(a, b) =>
                (a.expiryDate || "").localeCompare(b.expiryDate || "")
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
              render={(date) => (date ? new Date(date).toLocaleString() : "-")}
              sorter={(a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              }
            />
            <Column
              title="CREATED BY"
              dataIndex={["createdBy", "userName"]}
              key="createdBy"
              render={(userName) => userName || "-"}
              sorter={(a, b) =>
                (a.createdBy?.userName || "").localeCompare(
                  b.createdBy?.userName || ""
                )
              }
            />
            <Column
              title="UPDATED AT"
              dataIndex="updatedAt"
              key="updatedAt"
              render={(date) => (date ? new Date(date).toLocaleString() : "-")}
              sorter={(a, b) =>
                (a.updatedAt || "").localeCompare(b.updatedAt || "")
              }
            />
            <Column
              title="UPDATED BY"
              dataIndex={["updatedBy", "userName"]}
              key="updatedBy"
              render={(userName) => userName || "-"}
              sorter={(a, b) =>
                (a.updatedBy?.userName || "").localeCompare(
                  b.updatedBy?.userName || ""
                )
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
                    record.status === "Expired"
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
                  disabled={record.status === "Expired"}
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
            onShowSizeChange={handlePageSizeChange}
            showSizeChanger
            pageSizeOptions={["10", "20", "50", "100"]}
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
