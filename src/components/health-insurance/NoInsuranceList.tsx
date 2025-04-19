import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Input,
  Pagination,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Badge,
  Divider,
  Tag,
  Tooltip,
  Button,
  Select,
  InputNumber,
  Dropdown,
  Checkbox,
  message,
  Form,
} from "antd";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  exportHealthInsurances,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  UserOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  MailOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  UndoOutlined,
  AppstoreOutlined,
  SettingOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { HealthInsuranceIcon } from "@/dashboard/sidebar/icons/HealthInsuranceIcon";

const { Title, Text } = Typography;
const { Option } = Select;

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
};

export function NoInsuranceList() {
  const router = useRouter();
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Add columns visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    userInfo: true,
    status: true,
    lastUpdated: true,
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
        "NoInsurance"
      );
      setInsurances(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      messageApi.error("Unable to load users without insurance.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, messageApi]);

  useEffect(() => {
    fetchInsurances();
    const connection = setupHealthInsuranceRealTime(() => {
      fetchInsurances();
    });
    return () => {
      connection.stop();
    };
  }, [fetchInsurances]);

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

  const ALL_COLUMNS = [
    {
      key: "userInfo",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          USER INFORMATION
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
      visible: columnVisibility.userInfo,
    },
    {
      key: "status",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      dataIndex: "status",
      render: (status: string) => <Tag color="error">No Insurance</Tag>,
      visible: columnVisibility.status,
    },
    {
      key: "lastUpdated",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          LAST UPDATED
        </span>
      ),
      dataIndex: "updatedAt",
      render: (datetime: string) => (
        <Tooltip title={moment(datetime).fromNow()}>
          <Text>{formatDateTime(datetime)}</Text>
        </Tooltip>
      ),
      visible: columnVisibility.lastUpdated,
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
          <h3 className="text-xl font-bold">Users Without Insurance</h3>
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
            {/* Search */}
            <Input.Search
              placeholder="Search by name or email"
              value={searchText}
              prefix={<SearchOutlined style={{ color: "blue" }} />}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              className="search-input"
            />

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
                    key: "userInfo",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.userInfo}
                          onChange={() =>
                            handleColumnVisibilityChange("userInfo")
                          }
                        >
                          User Information
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.status}
                          onChange={() =>
                            handleColumnVisibilityChange("status")
                          }
                        >
                          Status
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "lastUpdated",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.lastUpdated}
                          onChange={() =>
                            handleColumnVisibilityChange("lastUpdated")
                          }
                        >
                          Last Updated
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

      {/* Rows per page */}
      <div className="flex justify-end items-center mb-4">
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
    </div>
  );
}
