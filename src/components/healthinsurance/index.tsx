import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  DatePicker,
  Pagination,
  Popconfirm,
} from "antd";
import { toast } from "react-toastify";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  exportHealthInsurances,
  softDeleteHealthInsurances,
  restoreHealthInsurance,
  verifyHealthInsurance,
} from "@/api/healthinsurance";
import CreateModal from "./CreateModal";
import DetailModal from "./DetailModal";

const { Option } = Select;
const { RangePicker } = DatePicker;

export function HealthInsuranceManagement() {
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedInsurance, setSelectedInsurance] =
    useState<HealthInsuranceResponseDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [userIdFilter, setUserIdFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [ascending, setAscending] = useState(false);

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
      toast.error("Unable to load health insurances.");
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
    const connection = setupHealthInsuranceRealTime((updatedInsurance) => {
      fetchInsurances();
    });
    return () => {
      connection.stop();
    };
  }, [fetchInsurances]);
  const handleSoftDelete = async (id: string) => {
    try {
      const response = await softDeleteHealthInsurances([id]);
      if (response.isSuccess) {
        toast.success("Insurance soft deleted!");
        fetchInsurances();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to soft delete insurance.");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await restoreHealthInsurance(id);
      if (response.isSuccess) {
        toast.success("Insurance restored!");
        fetchInsurances();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to restore insurance.");
    }
  };

  const handleVerify = async (id: string, status: string) => {
    try {
      const response = await verifyHealthInsurance(id, status);
      if (response.isSuccess) {
        toast.success(`Insurance ${status.toLowerCase()}!`);
        fetchInsurances();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to verify insurance.");
    }
  };

  const columns = [
    {
      title: "Policyholder",
      render: (record: HealthInsuranceResponseDTO) =>
        `${record.user.fullName} (${record.user.userName}, ${record.user.email})`,
    },
    { title: "Insurance Number", dataIndex: "healthInsuranceNumber" },
    { title: "Full Name", dataIndex: "fullName" },
    { title: "Valid From", dataIndex: "validFrom" },
    { title: "Valid To", dataIndex: "validTo" },
    { title: "Status", dataIndex: "status" },
    { title: "Verification", dataIndex: "verificationStatus" },
    {
      title: "Actions",
      render: (record: HealthInsuranceResponseDTO) => (
        <div>
          <Button
            onClick={() => {
              setSelectedInsurance(record);
              setIsDetailModalVisible(true);
            }}
            style={{ marginRight: 8 }}
          >
            View
          </Button>
          {record.status !== "SoftDeleted" ? (
            <Popconfirm
              title="Are you sure to soft delete this insurance?"
              onConfirm={() => handleSoftDelete(record.id)}
            >
              <Button danger>Delete</Button>
            </Popconfirm>
          ) : (
            <Button onClick={() => handleRestore(record.id)}>Restore</Button>
          )}
          {record.status === "Submitted" && (
            <>
              <Button
                onClick={() => handleVerify(record.id, "Verified")}
                style={{ marginLeft: 8 }}
              >
                Verify
              </Button>
              <Button
                onClick={() => handleVerify(record.id, "Rejected")}
                style={{ marginLeft: 8 }}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by insurance number or username"
          onSearch={(value) => setSearchText(value)}
          style={{ width: 300, marginRight: 16 }}
        />
        <Select
          placeholder="Filter by status"
          onChange={(value) => setStatusFilter(value)}
          style={{ width: 150 }}
          allowClear
        >
          <Option value="Pending">Pending</Option>
          <Option value="Completed">Completed</Option>
          <Option value="Expired">Expired</Option>
          <Option value="SoftDeleted">Soft Deleted</Option>
        </Select>
        <Button
          type="primary"
          onClick={() => setIsCreateModalVisible(true)}
          style={{ marginLeft: 16 }}
        >
          Create Manual
        </Button>
        <Button onClick={exportHealthInsurances} style={{ marginLeft: 16 }}>
          Export to Excel
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={insurances}
        loading={loading}
        pagination={false}
        rowKey="id"
      />
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={total}
        onChange={(page, size) => {
          setCurrentPage(page);
          setPageSize(size);
        }}
        style={{ marginTop: 16, textAlign: "right" }}
      />
      <CreateModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSuccess={fetchInsurances}
      />
      <DetailModal
        visible={isDetailModalVisible}
        insurance={selectedInsurance}
        onClose={() => setIsDetailModalVisible(false)}
        onSuccess={fetchInsurances}
      />
    </div>
  );
}
