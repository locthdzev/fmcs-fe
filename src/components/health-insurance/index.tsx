import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  DatePicker,
  Pagination,
  Popconfirm,
  Dropdown,
  Menu,
  Checkbox,
  Space,
  Row,
  Col,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  exportHealthInsurances,
  softDeleteHealthInsurances,
  restoreHealthInsurance,
  verifyHealthInsurance,
  createInitialHealthInsurances,
} from "@/api/healthinsurance";
import CreateModal from "./CreateModal";
import DetailModal from "./DetailModal";
import EditModal from "./EditModal";
import { DownOutlined, SearchOutlined } from "@ant-design/icons";
import { getUsers, UserProfile } from "@/api/user";

const { Option } = Select;
const { RangePicker } = DatePicker;

const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return '';
  return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
};

const DEFAULT_VISIBLE_COLUMNS = [
  "policyholder",
  "healthInsuranceNumber",
  "fullName",
  "validPeriod",
  "status",
  "verificationStatus",
  "deadline",
  "actions",
];

export function HealthInsuranceManagement() {
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<HealthInsuranceResponseDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [userFilter, setUserFilter] = useState<string | undefined>();
  const [userOptions, setUserOptions] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [ascending, setAscending] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const users = await getUsers();
      const userRoleUsers = users.filter((user: UserProfile) => 
        user.roles.includes('User')
      ).map((user: UserProfile) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email
      }));
      setUserOptions(userRoleUsers);
    } catch (error) {
      toast.error("Unable to load users");
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
        userFilter
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
    userFilter,
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

  const handleCreateInitial = async () => {
    try {
      const response = await createInitialHealthInsurances();
      if (response.isSuccess) {
        toast.success("Initial insurances created successfully!");
        fetchInsurances();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to create initial insurances.");
    }
  };

  const handleColumnVisibilityChange = (key: string) => {
    const newVisibleColumns = visibleColumns.includes(key)
      ? visibleColumns.filter((col) => col !== key)
      : [...visibleColumns, key];
    setVisibleColumns(newVisibleColumns);
  };

  const ALL_COLUMNS = [
    {
      key: "policyholder",
      title: "Policyholder",
      render: (record: HealthInsuranceResponseDTO) => (
        <div className="flex flex-col">
          <span>{record.user.fullName}</span>
          <span className="text-gray-500">{record.user.email}</span>
        </div>
      ),
    },
    { key: "healthInsuranceNumber", title: "Insurance Number", dataIndex: "healthInsuranceNumber" },
    { key: "fullName", title: "Full Name", dataIndex: "fullName" },
    { 
      key: "dateOfBirth",
      title: "Date of Birth", 
      render: (record: HealthInsuranceResponseDTO) => formatDate(record.dateOfBirth)
    },
    { key: "gender", title: "Gender", dataIndex: "gender" },
    { key: "address", title: "Address", dataIndex: "address" },
    { 
      key: "healthcareProvider",
      title: "Healthcare Provider", 
      render: (record: HealthInsuranceResponseDTO) => 
        `${record.healthcareProviderName || ''} (${record.healthcareProviderCode || ''})` 
    },
    { 
      key: "validPeriod",
      title: "Valid Period",
      render: (record: HealthInsuranceResponseDTO) => 
        `${formatDate(record.validFrom)} - ${formatDate(record.validTo)}`
    },
    { 
      key: "issueDate",
      title: "Issue Date", 
      render: (record: HealthInsuranceResponseDTO) => formatDate(record.issueDate)
    },
    { 
      key: "createdInfo",
      title: "Created Info",
      render: (record: HealthInsuranceResponseDTO) => 
        `${formatDateTime(record.createdAt)}${record.createdBy ? ` by ${record.createdBy.userName}` : ''}`
    },
    { 
      key: "updatedInfo",
      title: "Updated Info",
      render: (record: HealthInsuranceResponseDTO) => 
        record.updatedAt ? `${formatDateTime(record.updatedAt)}${record.updatedBy ? ` by ${record.updatedBy.userName}` : ''}` : null
    },
    { key: "status", title: "Status", dataIndex: "status" },
    { key: "verificationStatus", title: "Verification Status", dataIndex: "verificationStatus" },
    { 
      key: "deadline",
      title: "Deadline", 
      render: (record: HealthInsuranceResponseDTO) => 
        record.deadline ? formatDate(record.deadline) : 'No deadline'
    },
    {
      key: "actions",
      title: "Actions",
      render: (record: HealthInsuranceResponseDTO) => (
        <Space>
          <Button
            onClick={() => {
              setSelectedInsurance(record);
              setIsDetailModalVisible(true);
            }}
          >
            View
          </Button>
          <Button
            onClick={() => {
              setSelectedInsurance(record);
              setIsEditModalVisible(true);
            }}
          >
            Edit
          </Button>
          {record.status === "Submitted" && (
            <>
              <Button
                onClick={() => handleVerify(record.id, "Verified")}
              >
                Verify
              </Button>
              <Button
                onClick={() => handleVerify(record.id, "Rejected")}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const columns = ALL_COLUMNS.filter(col => visibleColumns.includes(col.key));

  const filteredInsurances = React.useMemo(() => {
    if (!searchText) return insurances;
    
    const normalizedSearch = searchText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return insurances.filter(insurance => {
      const normalizedNumber = (insurance.healthInsuranceNumber || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      return normalizedNumber.includes(normalizedSearch);
    });
  }, [insurances, searchText]);

  const handleBulkDelete = async () => {
    try {
      const response = await softDeleteHealthInsurances(selectedRowKeys as string[]);
      if (response.isSuccess) {
        toast.success("Selected insurances deleted successfully!");
        setSelectedRowKeys([]);
        fetchInsurances();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to delete selected insurances.");
    }
  };

  const topContent = (
    <div className="flex flex-col gap-4">
      <Row gutter={[16, 16]} align="middle">
        <Col span={24}>
          <Space size="middle">
            <Input
              placeholder="Search by insurance number"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Select
              showSearch
              allowClear
              style={{ width: 250 }}
              placeholder="Search by policyholder"
              optionFilterProp="label"
              filterOption={(input, option) => {
                if (!option?.label) return false;
                return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
              }}
              onChange={(value) => setUserFilter(value)}
              options={userOptions.map((user) => ({
                value: user.id,
                label: `${user.fullName} (${user.email})`
              }))}
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
            <Dropdown
              overlay={
                <Menu
                  onClick={(e) => e.domEvent.stopPropagation()}
                  getPopupContainer={(trigger) => trigger.parentElement || document.body}
                >
                  <Menu.ItemGroup title="Show Columns">
                    {ALL_COLUMNS.map((column) => (
                      <Menu.Item 
                        key={column.key}
                        style={{ padding: 0 }}
                      >
                        <div 
                          style={{ padding: '5px 12px' }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleColumnVisibilityChange(column.key);
                          }}
                        >
                          <Checkbox 
                            checked={visibleColumns.includes(column.key)}
                          >
                            {column.title}
                          </Checkbox>
                        </div>
                      </Menu.Item>
                    ))}
                  </Menu.ItemGroup>
                </Menu>
              }
              trigger={['click']}
              open={dropdownVisible}
              onOpenChange={setDropdownVisible}
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
            >
              <Button>
                Columns <DownOutlined />
              </Button>
            </Dropdown>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title="Are you sure to delete the selected insurances?"
                onConfirm={handleBulkDelete}
              >
                <Button danger>
                  Delete Selected
                </Button>
              </Popconfirm>
            )}
            <Dropdown overlay={
              <Menu>
                <Menu.Item key="manual" onClick={() => setIsCreateModalVisible(true)}>
                  Create Manual
                </Menu.Item>
                <Menu.Item key="initial" onClick={handleCreateInitial}>
                  Create Initial
                </Menu.Item>
              </Menu>
            }>
              <Button type="primary">
                Create <DownOutlined />
              </Button>
            </Dropdown>
            <Button onClick={exportHealthInsurances}>
              Export to Excel
            </Button>
          </Space>
        </Col>
      </Row>
      <Row justify="space-between" align="middle">
        <Col>
          <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
            Total {total} insurances
          </span>
        </Col>
        <Col>
          <Space align="center">
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Rows per page:</span>
            <Select
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setCurrentPage(1);
              }}
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={15}>15</Option>
            </Select>
          </Space>
        </Col>
      </Row>
    </div>
  );

  const bottomContent = (
    <Row justify="space-between" align="middle" style={{ marginTop: 16 }}>
      <Col>
        <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
          {selectedRowKeys.length > 0 
            ? `Selected ${selectedRowKeys.length} of ${total}`
            : ''}
        </span>
      </Col>
      <Col>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
          showSizeChanger={false}
        />
      </Col>
    </Row>
  );

  return (
    <div>
      {topContent}
      <Table
        columns={columns}
        dataSource={filteredInsurances}
        loading={loading}
        pagination={false}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      />
      {bottomContent}
      <CreateModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSuccess={fetchInsurances}
      />
      <DetailModal
        visible={isDetailModalVisible}
        insurance={selectedInsurance}
        onClose={() => {
          setIsDetailModalVisible(false);
          setSelectedInsurance(null);
        }}
      />
      <EditModal
        visible={isEditModalVisible}
        insurance={selectedInsurance}
        onClose={() => {
          setIsEditModalVisible(false);
          setSelectedInsurance(null);
        }}
        onSuccess={fetchInsurances}
      />
    </div>
  );
}
