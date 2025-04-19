import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  Pagination,
  Space,
  Row,
  Col,
  Modal,
  Image,
  Descriptions,
  Tag,
  Card,
  Typography,
  Badge,
  Divider,
  Tooltip,
  Form,
  InputNumber,
  message,
  Dropdown,
  Checkbox,
  Popconfirm,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  verifyHealthInsurance,
  setupHealthInsuranceRealTime,
  exportHealthInsurances,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileImageOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  GlobalOutlined,
  ArrowLeftOutlined,
  UndoOutlined,
  AppstoreOutlined,
  SettingOutlined,
  TagOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { HealthInsuranceIcon } from "@/dashboard/sidebar/icons/HealthInsuranceIcon";

const { Title, Text } = Typography;
const { Option } = Select;

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

export function VerificationList() {
  const router = useRouter();
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [selectedInsurance, setSelectedInsurance] =
    useState<HealthInsuranceResponseDTO | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [insuranceNumberOptions, setInsuranceNumberOptions] = useState<
    string[]
  >([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Add columns visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    policyholder: true,
    insuranceNumber: true,
    fullName: true,
    validPeriod: true,
    actions: true,
  });

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHealthInsurances(
        currentPage,
        pageSize,
        searchText,
        "CreatedAt",
        false,
        "Submitted"
      );
      setInsurances(result.data);
      setTotal(result.totalRecords);

      // Extract unique insurance numbers for search dropdown
      if (result.data && result.data.length > 0) {
        const uniqueNumbers = Array.from(
          new Set(
            result.data
              .filter(
                (insurance: HealthInsuranceResponseDTO) =>
                  insurance.healthInsuranceNumber
              )
              .map(
                (insurance: HealthInsuranceResponseDTO) =>
                  insurance.healthInsuranceNumber
              )
          )
        );
        setInsuranceNumberOptions(uniqueNumbers as string[]);
      }
    } catch (error) {
      messageApi.error("Unable to load health insurances.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, messageApi]);

  // Fetch all insurance numbers for dropdown
  const fetchAllInsuranceNumbers = useCallback(async () => {
    try {
      const result = await getAllHealthInsurances(
        1,
        1000, // Large page size to get as many as possible
        "",
        "CreatedAt",
        false,
        "Submitted"
      );

      if (result.data && result.data.length > 0) {
        const uniqueNumbers = Array.from(
          new Set(
            result.data
              .filter(
                (insurance: HealthInsuranceResponseDTO) =>
                  insurance.healthInsuranceNumber
              )
              .map(
                (insurance: HealthInsuranceResponseDTO) =>
                  insurance.healthInsuranceNumber
              )
          )
        );
        setInsuranceNumberOptions(uniqueNumbers as string[]);
      }
    } catch (error) {
      console.error("Unable to load all insurance numbers", error);
    }
  }, []);

  useEffect(() => {
    fetchInsurances();
    fetchAllInsuranceNumbers();
    const connection = setupHealthInsuranceRealTime(() => {
      fetchInsurances();
    });
    return () => {
      connection.stop();
    };
  }, [fetchInsurances, fetchAllInsuranceNumbers]);

  const handleVerify = async (id: string, status: string) => {
    try {
      const response = await verifyHealthInsurance(id, status);
      if (response.isSuccess) {
        messageApi.success(`Insurance ${status.toLowerCase()}!`);
        fetchInsurances();
        setIsModalVisible(false);
      } else {
        messageApi.error(response.message);
      }
    } catch (error) {
      messageApi.error("Unable to verify insurance.");
    }
  };

  // Handle column visibility change
  const handleColumnVisibilityChange = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle all columns visibility
  const toggleAllColumns = (checked: boolean) => {
    const newVisibility = { ...columnVisibility };
    Object.keys(newVisibility).forEach((key) => {
      newVisibility[key] = checked;
    });
    setColumnVisibility(newVisibility);
  };

  // Check if all columns are visible
  const areAllColumnsVisible = () => {
    return Object.values(columnVisibility).every((value) => value === true);
  };

  // Handle dropdown visibility
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  // Prevent dropdown from closing when clicking checkboxes
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Reset filters
  const handleReset = () => {
    setSearchText("");
    setCurrentPage(1);
  };

  // Handle batch verify
  const handleBatchVerify = async (status: string) => {
    try {
      // Show loading
      setLoading(true);

      // Process each selected insurance sequentially
      for (const id of selectedRowKeys) {
        const response = await verifyHealthInsurance(id as string, status);
        if (!response.isSuccess) {
          messageApi.error(
            `Failed to ${status.toLowerCase()} insurance ${id}: ${
              response.message
            }`
          );
        }
      }

      // Successfully processed all items
      messageApi.success(
        `Successfully ${status.toLowerCase()} ${
          selectedRowKeys.length
        } insurances!`
      );
      setSelectedRowKeys([]);
      fetchInsurances();
    } catch (error) {
      messageApi.error(`Unable to ${status.toLowerCase()} insurances.`);
    } finally {
      setLoading(false);
    }
  };

  const ALL_COLUMNS = [
    {
      key: "policyholder",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          POLICYHOLDER
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <div className="flex flex-col">
          <Typography.Text strong>{record.user.fullName}</Typography.Text>
          <Typography.Text type="secondary" className="text-sm">
            {record.user.email}
          </Typography.Text>
        </div>
      ),
      visible: columnVisibility.policyholder,
    },
    {
      key: "insuranceNumber",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          INSURANCE NUMBER
        </span>
      ),
      dataIndex: "healthInsuranceNumber",
      render: (text: string) => (
        <Text strong className="text-blue-600">
          {text}
        </Text>
      ),
      visible: columnVisibility.insuranceNumber,
    },
    {
      key: "fullName",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          FULL NAME
        </span>
      ),
      dataIndex: "fullName",
      render: (text: string) => <Text strong>{text}</Text>,
      visible: columnVisibility.fullName,
    },
    {
      key: "validPeriod",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          VALID PERIOD
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Space direction="vertical" size="small">
          <Typography.Text>
            From: {formatDate(record.validFrom)}
          </Typography.Text>
          <Typography.Text>To: {formatDate(record.validTo)}</Typography.Text>
        </Space>
      ),
      visible: columnVisibility.validPeriod,
    },
    {
      key: "actions",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => {
            setSelectedInsurance(record);
            setIsModalVisible(true);
          }}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Verify
        </Button>
      ),
      visible: columnVisibility.actions,
    },
  ];

  const columns = ALL_COLUMNS.filter((col) => col.visible);

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {contextHolder}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <HealthInsuranceIcon />
          <h3 className="text-xl font-bold">Insurance Verification List</h3>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <Card
        className="shadow mb-4"
        bodyStyle={{ padding: "16px" }}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "16px",
            }}
          >
            <AppstoreOutlined />
            <span>Toolbar</span>
          </div>
        }
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Insurance Number Search */}
            <Select
              showSearch
              allowClear
              style={{ width: 250 }}
              prefix={<SearchOutlined style={{ color: "blue" }} />}
              placeholder="Search by insurance number"
              optionFilterProp="children"
              onChange={(value) => setSearchText(value || "")}
              value={searchText || undefined}
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {insuranceNumberOptions.map((number) => (
                <Option key={number} value={number}>
                  {number}
                </Option>
              ))}
            </Select>

            {/* Reset Button */}
            <Tooltip title="Reset All Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={!searchText}
              >
                Reset
              </Button>
            </Tooltip>

            {/* Column Settings */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: "selectAll",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={areAllColumnsVisible()}
                          onChange={(e) => toggleAllColumns(e.target.checked)}
                        >
                          <strong>Show All Columns</strong>
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "divider",
                    type: "divider",
                  },
                  {
                    key: "policyholder",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.policyholder}
                          onChange={() =>
                            handleColumnVisibilityChange("policyholder")
                          }
                        >
                          Policyholder
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "insuranceNumber",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.insuranceNumber}
                          onChange={() =>
                            handleColumnVisibilityChange("insuranceNumber")
                          }
                        >
                          Insurance Number
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "fullName",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.fullName}
                          onChange={() =>
                            handleColumnVisibilityChange("fullName")
                          }
                        >
                          Full Name
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "validPeriod",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.validPeriod}
                          onChange={() =>
                            handleColumnVisibilityChange("validPeriod")
                          }
                        >
                          Valid Period
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "actions",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.actions}
                          onChange={() =>
                            handleColumnVisibilityChange("actions")
                          }
                        >
                          Actions
                        </Checkbox>
                      </div>
                    ),
                  },
                ],
                onClick: (e) => {
                  // Prevent dropdown from closing
                  e.domEvent.stopPropagation();
                },
              }}
              trigger={["hover", "click"]}
              placement="bottomRight"
              arrow
              open={dropdownOpen}
              onOpenChange={handleDropdownVisibleChange}
              mouseEnterDelay={0.1}
              mouseLeaveDelay={0.3}
            >
              <Tooltip title="Column Settings">
                <Button icon={<SettingOutlined />}>Columns</Button>
              </Tooltip>
            </Dropdown>
          </div>

          <div>
            {/* Export Button */}
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={exportHealthInsurances}
              disabled={loading}
            >
              Export to Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Selection Actions and Rows per page */}
      <div className="flex justify-between items-center mb-4">
        {/* Selection Actions */}
        <div>
          {selectedRowKeys.length > 0 && (
            <Space>
              <Text>{selectedRowKeys.length} Items selected</Text>
              <Popconfirm
                title="Are you sure you want to verify these insurances?"
                onConfirm={() => handleBatchVerify("Verified")}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Verify Selected
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Are you sure you want to reject these insurances?"
                onConfirm={() => handleBatchVerify("Rejected")}
                okText="Yes"
                cancelText="No"
              >
                <Button danger icon={<CloseCircleOutlined />}>
                  Reject Selected
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>

        {/* Rows per page */}
        <div>
          <Text type="secondary">
            Rows per page:
            <Select
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setCurrentPage(1);
              }}
              style={{ marginLeft: 8, width: 70 }}
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={15}>15</Option>
              <Option value={20}>20</Option>
            </Select>
          </Text>
        </div>
      </div>

      {/* Data Table */}
      <Card className="shadow-sm">
        <Table
          bordered
          columns={columns}
          dataSource={insurances}
          loading={loading}
          pagination={false}
          rowKey="id"
          className="border rounded-lg"
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
            selections: [
              Table.SELECTION_ALL,
              Table.SELECTION_INVERT,
              Table.SELECTION_NONE,
            ],
          }}
        />

        {/* Bottom Pagination */}
        <Card className="mt-4 shadow-sm">
          <Row justify="center" align="middle">
            <Space size="large" align="center">
              <Text type="secondary">Total {total} items</Text>
              <Space align="center" size="large">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onChange={(page) => {
                    setCurrentPage(page);
                  }}
                  showSizeChanger={false}
                  showTotal={() => ""}
                />
                <Space align="center">
                  <Text type="secondary">Go to page:</Text>
                  <InputNumber
                    min={1}
                    max={Math.ceil(total / pageSize)}
                    value={currentPage}
                    onChange={(value) => {
                      if (
                        value &&
                        Number(value) > 0 &&
                        Number(value) <= Math.ceil(total / pageSize)
                      ) {
                        setCurrentPage(Number(value));
                      }
                    }}
                    style={{ width: "60px" }}
                  />
                </Space>
              </Space>
            </Space>
          </Row>
        </Card>
      </Card>

      {/* Verification Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <FileImageOutlined className="text-blue-500" />
            <Text strong>Insurance Verification Details</Text>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() =>
              handleVerify(selectedInsurance?.id || "", "Rejected")
            }
          >
            Reject
          </Button>,
          <Button
            key="verify"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() =>
              handleVerify(selectedInsurance?.id || "", "Verified")
            }
            className="bg-green-500 hover:bg-green-600"
          >
            Verify
          </Button>,
        ]}
        width={800}
        className="verification-modal"
      >
        {selectedInsurance && (
          <div className="space-y-6">
            <Card className="shadow-sm">
              <Descriptions
                title={
                  <div className="flex items-center space-x-2 mb-4">
                    <IdcardOutlined className="text-blue-500" />
                    <Text strong>Insurance Information</Text>
                  </div>
                }
                bordered
                column={2}
              >
                <Descriptions.Item
                  label={
                    <div className="flex items-center space-x-2">
                      <IdcardOutlined />
                      <span>Insurance Number</span>
                    </div>
                  }
                >
                  <Text strong>{selectedInsurance.healthInsuranceNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <div className="flex items-center space-x-2">
                      <UserOutlined />
                      <span>Full Name</span>
                    </div>
                  }
                >
                  <Text strong>{selectedInsurance.fullName}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <div className="flex items-center space-x-2">
                      <CalendarOutlined />
                      <span>Date of Birth</span>
                    </div>
                  }
                >
                  {formatDate(selectedInsurance.dateOfBirth)}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <div className="flex items-center space-x-2">
                      <UserOutlined />
                      <span>Gender</span>
                    </div>
                  }
                >
                  {selectedInsurance.gender}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <div className="flex items-center space-x-2">
                      <HomeOutlined />
                      <span>Address</span>
                    </div>
                  }
                  span={2}
                >
                  {selectedInsurance.address}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <div className="flex items-center space-x-2">
                      <MedicineBoxOutlined />
                      <span>Healthcare Provider</span>
                    </div>
                  }
                  span={2}
                >
                  <Space>
                    <Text strong>
                      {selectedInsurance.healthcareProviderName}
                    </Text>
                    <Tag color="blue">
                      {selectedInsurance.healthcareProviderCode}
                    </Tag>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <div className="flex items-center space-x-2">
                      <CalendarOutlined />
                      <span>Valid Period</span>
                    </div>
                  }
                  span={2}
                >
                  <Space>
                    <Badge
                      status="processing"
                      text={`From: ${formatDate(selectedInsurance.validFrom)}`}
                    />
                    <Badge
                      status="warning"
                      text={`To: ${formatDate(selectedInsurance.validTo)}`}
                    />
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <div className="flex items-center space-x-2">
                      <GlobalOutlined />
                      <span>Issue Date</span>
                    </div>
                  }
                >
                  {formatDate(selectedInsurance.issueDate)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedInsurance.imageUrl && (
              <Card
                title={
                  <div className="flex items-center space-x-2">
                    <FileImageOutlined className="text-blue-500" />
                    <Text strong>Insurance Image</Text>
                  </div>
                }
                className="shadow-sm"
              >
                <Image
                  src={selectedInsurance.imageUrl}
                  alt="Insurance"
                  style={{ maxWidth: "100%" }}
                  className="rounded-lg"
                />
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
