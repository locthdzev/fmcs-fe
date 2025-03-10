import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Select,
  Input,
  Pagination,
  Space,
  Tag,
} from "antd";
import { Card, CardHeader, CardBody } from "@heroui/react";
import {
  PencilSquareIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  TrashIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  exportHealthInsurancesToExcel,
} from "@/api/health-insurance-api";
import { toast } from "react-toastify";
import EditHealthInsuranceModal from "./EditHealthInsuranceModal";
import CreateInitialHealthInsurancesModal from "./CreateInitialHealthInsurancesModal";
import SendUpdateRequestModal from "./SendUpdateRequestModal";
import RenewHealthInsuranceModal from "./RenewHealthInsuranceModal";
import VerifyHealthInsuranceModal from "./VerifyHealthInsuranceModal";
import SetHealthInsuranceConfigModal from "./SetHealthInsuranceConfigModal";
import ViewHealthInsuranceConfigModal from "./ViewHealthInsuranceConfigModal";
import UserInsuranceStatusModal from "./UserInsuranceStatusModal";
import HealthInsuranceHistoryModal from "./HealthInsuranceHistoryModal";
import ViewHealthInsuranceModal from "./ViewHealthInsuranceModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import HealthInsuranceDashboard from "./HealthInsuranceDashboard";
import debounce from "lodash/debounce";

const { Column } = Table;
const { Option } = Select;

export function HealthInsuranceManagement() {
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCreateInitialModalVisible, setIsCreateInitialModalVisible] = useState(false);
  const [isSendRequestModalVisible, setIsSendRequestModalVisible] = useState(false);
  const [isRenewModalVisible, setIsRenewModalVisible] = useState(false);
  const [isVerifyModalVisible, setIsVerifyModalVisible] = useState(false);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [isViewConfigModalVisible, setIsViewConfigModalVisible] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [currentInsurance, setCurrentInsurance] = useState<HealthInsuranceResponseDTO | null>(null);
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("CreatedAt");
  const [ascending, setAscending] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState<string>("");

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHealthInsurances(
        currentPage,
        pageSize,
        searchText,
        sortBy,
        ascending,
        statusFilter,
        userIdFilter
      );
      setInsurances(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load health insurance list.");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    searchText,
    sortBy,
    ascending,
    statusFilter,
    userIdFilter,
  ]);

  useEffect(() => {
    fetchInsurances();

    const connection = setupHealthInsuranceRealTime(
      (updatedInsurance: HealthInsuranceResponseDTO) => {
        fetchInsurances();
      }
    );

    return () => {
      connection.stop();
    };
  }, [fetchInsurances]);

  const handleShowModal = (
    modalSetter: (value: boolean) => void,
    param?: HealthInsuranceResponseDTO | string
  ) => {
    if (typeof param === "string") {
      setSelectedInsuranceId(param);
    } else {
      setCurrentInsurance(param || null);
    }
    modalSetter(true);
  };

  const handleExportExcel = () => {
    exportHealthInsurancesToExcel(statusFilter);
    toast.success("Downloading Excel file...");
  };

  const handleSearchChange = debounce((value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  }, 300);

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const { field, order } = sorter;
    if (field && order) {
      setSortBy(field);
      setAscending(order === "ascend");
    } else {
      setSortBy("CreatedAt");
      setAscending(false);
    }
    setCurrentPage(pagination.current);
    fetchInsurances();
  };

  return (
    <div>
      <HealthInsuranceDashboard />
      <Card className="m-4">
        <CardHeader className="flex items-center gap-2">
          <h3 className="text-2xl font-bold">Health Insurance Management</h3>
        </CardHeader>
        <CardBody>
          <Space style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
            <Space>
              <Input
                placeholder="Search by Insurance Number"
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{ width: 200 }}
              />
              <Input
                placeholder="Filter by User ID"
                onChange={(e) => setUserIdFilter(e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="Filter by Status"
                onChange={(value) => setStatusFilter(value)}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="Pending">Pending</Option>
                <Option value="Submitted">Submitted</Option>
                <Option value="Completed">Completed</Option>
                <Option value="Rejected">Rejected</Option>
                <Option value="NotApplicable">Not Applicable</Option>
              </Select>
            </Space>
            <Space>
              <Button onClick={() => setIsStatusModalVisible(true)}>Check User Status</Button>
              <Button onClick={() => setIsViewConfigModalVisible(true)}>View Config</Button>
              <Button onClick={() => setIsConfigModalVisible(true)}>Set Config</Button>
              <Button onClick={() => setIsSendRequestModalVisible(true)}>Send Update Requests</Button>
              <Button onClick={() => setIsCreateInitialModalVisible(true)}>Create Initial</Button>
              <Button type="primary" onClick={handleExportExcel}>
                Export Excel
              </Button>
              <Button type="primary" icon={<PlusIcon />} onClick={() => setIsEditModalVisible(true)}>
                Add New
              </Button>
            </Space>
          </Space>

          <Table
            dataSource={insurances}
            rowKey="id"
            pagination={false}
            loading={loading}
            onChange={handleTableChange}
          >
            <Column
              title="User ID"
              dataIndex="userId"
              key="userId"
              sorter={(a, b) => a.userId.localeCompare(b.userId)}
            />
            <Column
              title="Insurance Number"
              dataIndex="healthInsuranceNumber"
              key="healthInsuranceNumber"
              sorter={(a, b) =>
                (a.healthInsuranceNumber || "").localeCompare(b.healthInsuranceNumber || "")
              }
              render={(text) => text || "-"}
            />
            <Column
              title="Full Name"
              dataIndex="fullName"
              key="fullName"
              sorter={(a, b) => (a.fullName || "").localeCompare(b.fullName || "")}
              render={(text) => text || "-"}
            />
            <Column
              title="Valid From"
              dataIndex="validFrom"
              key="validFrom"
              sorter={(a, b) => (a.validFrom || "").localeCompare(b.validFrom || "")}
              render={(date) => (date ? new Date(date).toLocaleDateString() : "-")}
            />
            <Column
              title="Valid To"
              dataIndex="validTo"
              key="validTo"
              sorter={(a, b) => (a.validTo || "").localeCompare(b.validTo || "")}
              render={(date) => (date ? new Date(date).toLocaleDateString() : "-")}
            />
            <Column
              title="Status"
              dataIndex="status"
              key="status"
              sorter={(a, b) => (a.status || "").localeCompare(b.status || "")}
              render={(status) => (
                <Tag
                  color={
                    status === "Completed"
                      ? "green"
                      : status === "Pending"
                      ? "blue"
                      : status === "Submitted"
                      ? "orange"
                      : status === "Rejected"
                      ? "red"
                      : "gray"
                  }
                >
                  {status}
                </Tag>
              )}
            />
            <Column
              title="Verification Status"
              dataIndex="verificationStatus"
              key="verificationStatus"
              sorter={(a, b) =>
                (a.verificationStatus || "").localeCompare(b.verificationStatus || "")
              }
              render={(text) => text || "-"}
            />
            <Column
              title="Created At"
              dataIndex="createdAt"
              key="createdAt"
              sorter={(a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              }
              render={(date) => new Date(date).toLocaleString()}
            />
            <Column
              title="Actions"
              key="actions"
              align="center"
              render={(_, record: HealthInsuranceResponseDTO) => (
                <Space>
                  <Button
                    type="text"
                    onClick={() => handleShowModal(setIsViewModalVisible, record.id)}
                    icon={<EyeIcon className="w-5 h-5" />}
                  />
                  <Button
                    type="text"
                    onClick={() => handleShowModal(setIsEditModalVisible, record)}
                    icon={<PencilSquareIcon className="w-5 h-5" />}
                  />
                  <Button
                    type="text"
                    onClick={() => handleShowModal(setIsRenewModalVisible, record)}
                    icon={<PlusIcon className="w-5 h-5" />}
                  />
                  <Button
                    type="text"
                    onClick={() => handleShowModal(setIsVerifyModalVisible, record)}
                    icon={<CheckCircleIcon className="w-5 h-5" />}
                  />
                  <Button
                    type="text"
                    onClick={() => handleShowModal(setIsHistoryModalVisible, record)}
                    icon={<ClockIcon className="w-5 h-5" />}
                  />
                  <Button
                    type="text"
                    danger
                    onClick={() => {
                      setSelectedInsuranceId(record.id);
                      setIsDeleteModalVisible(true);
                    }}
                    icon={<TrashIcon className="w-5 h-5" />}
                  />
                </Space>
              )}
            />
          </Table>

          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={(page) => setCurrentPage(page)}
            onShowSizeChange={(_, size) => setPageSize(size)}
            showSizeChanger
            pageSizeOptions={["10", "20", "50", "100"]}
            style={{ marginTop: 16, textAlign: "right" }}
          />
        </CardBody>
      </Card>

      <EditHealthInsuranceModal
        visible={isEditModalVisible}
        insurance={currentInsurance}
        onClose={() => setIsEditModalVisible(false)}
        onSuccess={fetchInsurances}
      />
      <CreateInitialHealthInsurancesModal
        visible={isCreateInitialModalVisible}
        onClose={() => setIsCreateInitialModalVisible(false)}
        onSuccess={fetchInsurances}
      />
      <SendUpdateRequestModal
        visible={isSendRequestModalVisible}
        onClose={() => setIsSendRequestModalVisible(false)}
        onSuccess={fetchInsurances}
      />
      <RenewHealthInsuranceModal
        visible={isRenewModalVisible}
        insurance={currentInsurance}
        onClose={() => setIsRenewModalVisible(false)}
        onSuccess={fetchInsurances}
      />
      <VerifyHealthInsuranceModal
        visible={isVerifyModalVisible}
        insurance={currentInsurance}
        onClose={() => setIsVerifyModalVisible(false)}
        onSuccess={fetchInsurances}
      />
      <SetHealthInsuranceConfigModal
        visible={isConfigModalVisible}
        onClose={() => setIsConfigModalVisible(false)}
        onSuccess={fetchInsurances}
      />
      <ViewHealthInsuranceConfigModal
        visible={isViewConfigModalVisible}
        onClose={() => setIsViewConfigModalVisible(false)}
      />
      <UserInsuranceStatusModal
        visible={isStatusModalVisible}
        onClose={() => setIsStatusModalVisible(false)}
      />
      <HealthInsuranceHistoryModal
        visible={isHistoryModalVisible}
        insurance={currentInsurance}
        onClose={() => setIsHistoryModalVisible(false)}
      />
      <ViewHealthInsuranceModal
        visible={isViewModalVisible}
        insuranceId={selectedInsuranceId}
        onClose={() => setIsViewModalVisible(false)}
      />
      <ConfirmDeleteModal
        visible={isDeleteModalVisible}
        insuranceId={selectedInsuranceId}
        onClose={() => setIsDeleteModalVisible(false)}
        onSuccess={fetchInsurances}
      />
    </div>
  );
}

export default HealthInsuranceManagement;