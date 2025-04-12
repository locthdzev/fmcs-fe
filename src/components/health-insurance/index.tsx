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
  Card,
  Typography,
  Badge,
  Tag,
  Tooltip,
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
  getHealthInsuranceConfig,
} from "@/api/healthinsurance";
import CreateModal from "./CreateModal";
import EditModal from "./EditModal";
import ConfigModal from "./ConfigModal";
import { 
  DownOutlined, 
  SearchOutlined, 
  SettingOutlined,
  PlusOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { getUsers, UserProfile } from "@/api/user";
import { useRouter } from 'next/router';

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

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Pending':
      return 'processing';
    case 'Submitted':
      return 'warning';
    case 'Expired':
      return 'error';
    case 'DeadlineExpired':
      return 'orange';
    case 'SoftDeleted':
      return 'default';
    case 'NotApplicable':
      return 'default';
    default:
      return 'default';
  }
};

const getVerificationStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'Verified':
      return 'success';
    case 'Rejected':
      return 'error';
    case 'Pending':
      return 'warning';
    default:
      return 'default';
  }
};

export function HealthInsuranceManagement() {
  const router = useRouter();
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
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
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);

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
      // Fetch all insurances based on status filter
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
  }, [currentPage, pageSize, searchText, sortBy, ascending, statusFilter, userFilter]);

  useEffect(() => {
    fetchInsurances();
    const connection = setupHealthInsuranceRealTime(() => {
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
          <Typography.Text strong>{record.user.fullName}</Typography.Text>
          <Typography.Text type="secondary" className="text-sm">{record.user.email}</Typography.Text>
        </div>
      ),
    },
    { 
      key: "healthInsuranceNumber", 
      title: "Insurance Number", 
      render: (record: HealthInsuranceResponseDTO) => (
        <Tooltip title="Click to view details">
          <Typography.Link onClick={() => router.push(`/health-insurance/${record.id}`)}>
            {record.healthInsuranceNumber}
          </Typography.Link>
        </Tooltip>
      )
    },
    { key: "fullName", title: "Full Name", dataIndex: "fullName" },
    { 
      key: "validPeriod",
      title: "Valid Period",
      render: (record: HealthInsuranceResponseDTO) => (
        <Space direction="vertical" size="small">
          <Typography.Text>From: {formatDate(record.validFrom)}</Typography.Text>
          <Typography.Text>To: {formatDate(record.validTo)}</Typography.Text>
        </Space>
      )
    },
    { 
      key: "status", 
      title: "Status", 
      render: (record: HealthInsuranceResponseDTO) => (
        <Tag color={getStatusColor(record.status)}>
          {record.status}
        </Tag>
      )
    },
    { 
      key: "verificationStatus", 
      title: "Verification", 
      render: (record: HealthInsuranceResponseDTO) => (
        <Badge 
          status={getVerificationStatusColor(record.verificationStatus) as any} 
          text={record.verificationStatus} 
        />
      )
    },
    { 
      key: "deadline",
      title: "Deadline", 
      render: (record: HealthInsuranceResponseDTO) => (
        <Typography.Text type={moment(record.deadline).isBefore(moment()) ? "danger" : "success"}>
          {formatDate(record.deadline) || 'No deadline'}
        </Typography.Text>
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (record: HealthInsuranceResponseDTO) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/health-insurance/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedInsurance(record);
                setIsEditModalVisible(true);
              }}
            />
          </Tooltip>
          {record.status === "Submitted" && (
            <>
              <Tooltip title="Verify">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  className="text-green-600"
                  onClick={() => handleVerify(record.id, "Verified")}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  className="text-red-600"
                  onClick={() => handleVerify(record.id, "Rejected")}
                />
              </Tooltip>
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
    <Card className="mb-4 shadow-sm">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Typography.Title level={4} className="mb-4">
            Health Insurance Management
          </Typography.Title>
        </Col>
        <Col span={24}>
          <Space size="middle" wrap>
            <Input.Search
              placeholder="Search by insurance number"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
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
              style={{ width: 170 }}
              allowClear
              suffixIcon={<FilterOutlined />}
            >
              <Option value="Pending">
                <Badge status="processing" text="Pending" />
              </Option>
              <Option value="Submitted">
                <Badge status="warning" text="Submitted" />
              </Option>
              <Option value="Completed">
                <Badge status="success" text="Completed" />
              </Option>
              <Option value="Expired">
                <Badge status="error" text="Expired" />
              </Option>
              <Option value="DeadlineExpired">
                <Badge status="error" text={<span style={{ color: '#ff7a45' }}>Deadline Expired</span>} />
              </Option>
              <Option value="SoftDeleted">
                <Badge status="default" text="Soft Deleted" />
              </Option>
              <Option value="NotApplicable">
                <Badge status="default" text="Not Applicable" />
              </Option>
            </Select>
            <Dropdown
              overlay={
                <Menu>
                  <Menu.ItemGroup title="Show Columns">
                    {ALL_COLUMNS.map((column) => (
                      <Menu.Item key={column.key}>
                        <Checkbox 
                          checked={visibleColumns.includes(column.key)}
                          onChange={() => handleColumnVisibilityChange(column.key)}
                        >
                          {column.title}
                        </Checkbox>
                      </Menu.Item>
                    ))}
                  </Menu.ItemGroup>
                </Menu>
              }
              trigger={['click']}
            >
              <Button icon={<SettingOutlined />}>
                Columns
              </Button>
            </Dropdown>
            <Dropdown overlay={
              <Menu>
                <Menu.Item key="manual" onClick={() => setIsCreateModalVisible(true)}>
                  <PlusOutlined /> Create Manual
                </Menu.Item>
                <Menu.Item key="initial" onClick={handleCreateInitial}>
                  <PlusOutlined /> Create Initial
                </Menu.Item>
              </Menu>
            }>
              <Button type="primary" icon={<PlusOutlined />}>
                Create
              </Button>
            </Dropdown>
            <Button 
              icon={<ExportOutlined />}
              onClick={exportHealthInsurances}
            >
              Export
            </Button>
            <Button 
              icon={<SettingOutlined />}
              onClick={() => setIsConfigModalVisible(true)}
            >
              Settings
            </Button>
          </Space>
        </Col>
        <Col span={24}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title="Are you sure to delete the selected insurances?"
                    onConfirm={handleBulkDelete}
                  >
                    <Button 
                      danger 
                      type="primary"
                      icon={<DeleteOutlined />}
                      className="hover:opacity-90"
                    >
                      Delete Selected ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Col>
            <Col>
              <Space align="center">
                <Typography.Text type="secondary">
                  Rows per page:
                </Typography.Text>
                <Select
                  value={pageSize}
                  onChange={(value) => {
                    setPageSize(value);
                    setCurrentPage(1);
                  }}
                  className="min-w-[80px]"
                >
                  <Option value={5}>5</Option>
                  <Option value={10}>10</Option>
                  <Option value={15}>15</Option>
                </Select>
              </Space>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );

  const bottomContent = (
    <Card className="mt-4 shadow-sm">
      <Row justify="space-between" align="middle">
        <Col>
          <Typography.Text type="secondary">
            Total {total} insurances
          </Typography.Text>
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
    </Card>
  );

  return (
    <div className="p-6">
      {topContent}
      <Card className="shadow-sm">
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
          className="border rounded-lg"
        />
      </Card>
      {bottomContent}
      <CreateModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSuccess={fetchInsurances}
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
      <ConfigModal
        visible={isConfigModalVisible}
        onClose={() => setIsConfigModalVisible(false)}
      />
    </div>
  );
}
