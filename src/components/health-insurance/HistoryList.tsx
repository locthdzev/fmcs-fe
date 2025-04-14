import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Input,
  Select,
  Pagination,
  Space,
  Row,
  Col,
  Tag,
  Card,
  Typography,
  Badge,
  Divider,
  Tooltip,
  Button,
  InputNumber,
  Dropdown,
  Checkbox,
  message,
  DatePicker,
  Modal,
  Form,
} from "antd";
import type { TableProps } from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import dayjs from "dayjs";
import {
  getAllHealthInsuranceHistories,
  HistoryDTO,
  setupHealthInsuranceRealTime,
  exportHealthInsurances,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  UserOutlined,
  HistoryOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
  UndoOutlined,
  AppstoreOutlined,
  SettingOutlined,
  FileExcelOutlined,
  FilterOutlined,
  CalendarOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { HealthInsuranceIcon } from "@/dashboard/sidebar/icons/HealthInsuranceIcon";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const formatDateTime = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY HH:mm:ss");
};

export function HistoryList() {
  const router = useRouter();
  const [histories, setHistories] = useState<HistoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("UpdatedAt");
  const [ascending, setAscending] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Add filter state
  const [filterState, setFilterState] = useState({
    sortBy: "UpdatedAt",
    ascending: false,
    updatedDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    userName: "",
  });

  // Add columns visibility state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    updatedBy: true,
    updatedAt: true,
    statusChange: true,
    changeDetails: true,
  });

  const fetchHistories = useCallback(async () => {
    setLoading(true);
    try {
      // Base API call
      const result = await getAllHealthInsuranceHistories(
        currentPage,
        pageSize,
        searchText,
        filterState.sortBy,
        filterState.ascending
      );
      
      // Additional client-side filtering for date range if needed
      let filteredData = result.data;
      if (filterState.updatedDateRange[0] || filterState.updatedDateRange[1]) {
        filteredData = result.data.filter((history: HistoryDTO) => {
          const updatedAt = new Date(history.updatedAt);
          const fromDate = filterState.updatedDateRange[0] ? filterState.updatedDateRange[0].toDate() : null;
          const toDate = filterState.updatedDateRange[1] ? filterState.updatedDateRange[1].toDate() : null;
          
          if (fromDate && toDate) {
            return updatedAt >= fromDate && updatedAt <= toDate;
          } else if (fromDate) {
            return updatedAt >= fromDate;
          } else if (toDate) {
            return updatedAt <= toDate;
          }
          return true;
        });
        
        // Filter by username if provided
        if (filterState.userName) {
          filteredData = filteredData.filter((history: HistoryDTO) => {
            return history.updatedBy.userName.toLowerCase().includes(filterState.userName.toLowerCase());
          });
        }
      }
      
      setHistories(filteredData);
      setTotal(filteredData.length > 0 ? filteredData.length : result.totalRecords);
    } catch (error) {
      messageApi.error("Unable to load histories.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, filterState, messageApi]);

  useEffect(() => {
    fetchHistories();
    const connection = setupHealthInsuranceRealTime(() => {
      fetchHistories();
    });
    return () => {
      connection.stop();
    };
  }, [fetchHistories]);

  // Open filter modal
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  // Apply filters from modal
  const handleApplyFilters = (filters: any) => {
    setFilterState(filters);
    setSortBy(filters.sortBy);
    setAscending(filters.ascending);
    setCurrentPage(1);
    setFilterModalVisible(false);
  };

  // Reset filters in modal
  const handleResetFilters = () => {
    const resetFilters = {
      sortBy: "UpdatedAt",
      ascending: false,
      updatedDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
      userName: "",
    };
    
    setFilterState(resetFilters);
    setSortBy("UpdatedAt");
    setAscending(false);
    setCurrentPage(1);
    setFilterModalVisible(false);
    
    // Refresh data
    fetchHistories();
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

  // Reset all filters
  const handleReset = () => {
    setSearchText("");
    setSortBy("UpdatedAt");
    setAscending(false);
    setCurrentPage(1);
    
    // Reset the filter state as well
    setFilterState({
      sortBy: "UpdatedAt",
      ascending: false,
      updatedDateRange: [null, null],
      userName: "",
    });
  };

  const ALL_COLUMNS = [
    {
      key: "updatedBy",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          UPDATED BY
        </span>
      ),
      render: (record: HistoryDTO) => (
        <div className="flex flex-col">
          <Typography.Text strong>{record.updatedBy.userName}</Typography.Text>
          <Typography.Text type="secondary" className="text-sm">{record.updatedBy.email}</Typography.Text>
        </div>
      ),
      visible: columnVisibility.updatedBy,
    },
    {
      key: "updatedAt",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          UPDATED AT
        </span>
      ),
      render: (record: HistoryDTO) => (
        <Tooltip title={moment(record.updatedAt).fromNow()}>
          <Text>{formatDateTime(record.updatedAt)}</Text>
        </Tooltip>
      ),
      sorter: true,
      sortOrder: filterState.sortBy === "UpdatedAt" ? (filterState.ascending ? "ascend" : "descend") : undefined,
      visible: columnVisibility.updatedAt,
    },
    {
      key: "statusChange",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS CHANGE
        </span>
      ),
      render: (record: HistoryDTO) => (
        <Space direction="vertical" size="middle">
          {record.previousStatus !== record.newStatus && (
            <div className="flex items-center space-x-2">
              <Text>Status:</Text>
              <Tag color="orange">{record.previousStatus}</Tag>
              <SwapOutlined />
              <Tag color="green">{record.newStatus}</Tag>
            </div>
          )}
          {record.previousVerificationStatus !== record.newVerificationStatus && (
            <div className="flex items-center space-x-2">
              <Text>Verification:</Text>
              <Tag color="orange">{record.previousVerificationStatus}</Tag>
              <SwapOutlined />
              <Tag color="green">{record.newVerificationStatus}</Tag>
            </div>
          )}
        </Space>
      ),
      visible: columnVisibility.statusChange,
    },
    {
      key: "changeDetails",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CHANGE DETAILS
        </span>
      ),
      dataIndex: "changeDetails",
      width: "30%",
      render: (text: string) => (
        <div className="whitespace-pre-wrap">
          <Text>{text}</Text>
        </div>
      ),
      visible: columnVisibility.changeDetails,
    },
  ];

  const columns = ALL_COLUMNS.filter((col) => col.visible) as TableProps<HistoryDTO>["columns"];

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
          <h3 className="text-xl font-bold">Insurance History Records</h3>
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
              placeholder="Search by user or details"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />

            {/* Advanced Filters Button */}
            <Tooltip title="Advanced Filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color:
                        filterState.updatedDateRange[0] ||
                        filterState.updatedDateRange[1] ||
                        filterState.userName ||
                        filterState.sortBy !== "UpdatedAt" ||
                        filterState.ascending
                          ? "#1890ff"
                          : undefined,
                    }}
                  />
                }
                onClick={handleOpenFilterModal}
              >
                Filters
              </Button>
            </Tooltip>

            {/* Reset Button */}
            <Tooltip title="Reset All Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={
                  !searchText && 
                  filterState.sortBy === "UpdatedAt" && 
                  !filterState.ascending && 
                  !filterState.updatedDateRange[0] && 
                  !filterState.updatedDateRange[1] &&
                  !filterState.userName
                }
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
                    key: "updatedBy",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.updatedBy}
                          onChange={() =>
                            handleColumnVisibilityChange("updatedBy")
                          }
                        >
                          Updated By
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "updatedAt",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.updatedAt}
                          onChange={() =>
                            handleColumnVisibilityChange("updatedAt")
                          }
                        >
                          Updated At
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "statusChange",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.statusChange}
                          onChange={() =>
                            handleColumnVisibilityChange("statusChange")
                          }
                        >
                          Status Change
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "changeDetails",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.changeDetails}
                          onChange={() =>
                            handleColumnVisibilityChange("changeDetails")
                          }
                        >
                          Change Details
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
          dataSource={histories}
          loading={loading}
          pagination={false}
          rowKey="id"
          className="border rounded-lg"
          onChange={(pagination, filters, sorter) => {
            if (sorter && !Array.isArray(sorter)) {
              const newAscending = sorter.order === "ascend";
              setAscending(newAscending);
              setFilterState(prev => ({...prev, ascending: newAscending}));
            }
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

      {/* Filter Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FilterOutlined />
            <span>Advanced Filters</span>
          </div>
        }
        open={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        footer={[
          <Button key="reset" onClick={handleResetFilters} icon={<UndoOutlined />}>
            Reset
          </Button>,
          <Button
            key="apply"
            type="primary"
            onClick={() => handleApplyFilters(filterState)}
          >
            Apply Filters
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Sort By">
            <Select
              value={filterState.sortBy}
              onChange={(value) => 
                setFilterState(prev => ({ ...prev, sortBy: value }))
              }
              style={{ width: "100%" }}
            >
              <Option value="UpdatedAt">
                <ClockCircleOutlined className="mr-2" />Updated At
              </Option>
              <Option value="UserName">
                <UserOutlined className="mr-2" />User Name
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Sort Order">
            <Select
              value={filterState.ascending ? "asc" : "desc"}
              onChange={(value) => 
                setFilterState(prev => ({ 
                  ...prev, 
                  ascending: value === "asc" 
                }))
              }
              style={{ width: "100%" }}
            >
              <Option value="asc">
                <SortAscendingOutlined className="mr-2" />Ascending
              </Option>
              <Option value="desc">
                <SortDescendingOutlined className="mr-2" />Descending
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Updated Date Range">
            <RangePicker
              style={{ width: "100%" }}
              value={filterState.updatedDateRange}
              onChange={(dates) => 
                setFilterState(prev => ({ 
                  ...prev, 
                  updatedDateRange: dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] 
                }))
              }
              showTime
            />
          </Form.Item>
          
          <Form.Item label="User Name">
            <Input
              placeholder="Filter by user name"
              value={filterState.userName}
              onChange={(e) => 
                setFilterState(prev => ({ ...prev, userName: e.target.value }))
              }
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 