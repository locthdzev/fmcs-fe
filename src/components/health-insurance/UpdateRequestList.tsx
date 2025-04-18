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
  Form,
  Card,
  Typography,
  Badge,
  Divider,
  Tag,
  Tooltip,
  InputNumber,
  Dropdown,
  Checkbox,
  message,
  DatePicker,
} from "antd";
import moment from "moment";
import dayjs from "dayjs";
import {
  getUpdateRequests,
  UpdateRequestDTO,
  reviewUpdateRequest,
  setupHealthInsuranceRealTime,
  exportHealthInsurances,
  UpdateRequestParams
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
  ClockCircleOutlined,
  MailOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
  UndoOutlined,
  AppstoreOutlined,
  SettingOutlined,
  FileExcelOutlined,
  TagOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { HealthInsuranceIcon } from "@/dashboard/sidebar/icons/HealthInsuranceIcon";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY HH:mm:ss");
};

export function UpdateRequestList() {
  const router = useRouter();
  const [requests, setRequests] = useState<UpdateRequestDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequestDTO | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Add filter state
  const [filterState, setFilterState] = useState({
    statusFilter: "",
    requestDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    ascending: false,
  });

  // Add columns visibility state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    requestedBy: true,
    insuranceNumber: true,
    fullName: true,
    requestedAt: true,
    status: true,
    actions: true,
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Convert date ranges to ISO strings if they exist
      const requestedAtFrom = filterState.requestDateRange[0]
        ? filterState.requestDateRange[0].toISOString()
        : undefined;
      const requestedAtTo = filterState.requestDateRange[1]
        ? filterState.requestDateRange[1].toISOString()
        : undefined;

      // Sử dụng đối tượng tham số để bao gồm tất cả các tùy chọn lọc
      const requestParams: UpdateRequestParams = {
        page: currentPage,
        pageSize: pageSize,
        search: searchText,
        sortBy: "RequestedAt",
        ascending: filterState.ascending,
        status: statusFilter,
        requestedAtFrom,
        requestedAtTo
      };

      const result = await getUpdateRequests(requestParams);
      setRequests(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      messageApi.error("Unable to load update requests.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter, filterState, messageApi]);

  useEffect(() => {
    fetchRequests();
    const connection = setupHealthInsuranceRealTime(() => {
      fetchRequests();
    });
    return () => {
      connection.stop();
    };
  }, [fetchRequests]);

  const handleReview = async (requestId: string, isApproved: boolean) => {
    try {
      const response = await reviewUpdateRequest(requestId, isApproved, isApproved ? undefined : rejectionReason);
      if (response.isSuccess) {
        messageApi.success(isApproved ? "Request approved!" : "Request rejected!");
        fetchRequests();
        setIsModalVisible(false);
        setRejectionReason("");
      } else {
        messageApi.error(response.message);
      }
    } catch (error) {
      messageApi.error("Unable to review request.");
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

  // Open filter modal
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  // Apply filters
  const handleApplyFilters = (filters: any) => {
    setFilterState(filters);
    setStatusFilter(filters.statusFilter);
    setCurrentPage(1);
    setFilterModalVisible(false);
  };

  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = {
      statusFilter: "",
      requestDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
      ascending: false,
    };
    
    setFilterState(resetFilters);
    setStatusFilter(undefined);
    setCurrentPage(1);
    setFilterModalVisible(false);
    
    // Refresh data
    fetchRequests();
  };

  // Reset all filters including search
  const handleReset = () => {
    setSearchText("");
    setStatusFilter(undefined);
    setCurrentPage(1);
    
    // Reset the filter state as well
    setFilterState({
      statusFilter: "",
      requestDateRange: [null, null],
      ascending: false,
    });
  };

  const ALL_COLUMNS = [
    {
      key: "requestedBy",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          REQUESTED BY
        </span>
      ),
      render: (record: UpdateRequestDTO) => (
        <div className="flex flex-col">
          <Typography.Text strong>{record.requestedBy.userName}</Typography.Text>
          <Typography.Text type="secondary" className="text-sm">{record.requestedBy.email}</Typography.Text>
        </div>
      ),
      visible: columnVisibility.requestedBy,
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
        <Text strong className="text-blue-600">{text}</Text>
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
      render: (text: string) => (
        <Text strong>{text}</Text>
      ),
      visible: columnVisibility.fullName,
    },
    {
      key: "requestedAt",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          REQUESTED AT
        </span>
      ),
      render: (record: UpdateRequestDTO) => (
        <Tooltip title={moment(record.requestedAt).fromNow()}>
          <Text>{formatDateTime(record.requestedAt)}</Text>
        </Tooltip>
      ),
      visible: columnVisibility.requestedAt,
    },
    {
      key: "status",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      dataIndex: "status",
      render: (status: string) => {
        const statusConfig = {
          Pending: { color: 'warning' },
          Approved: { color: 'success' },
          Rejected: { color: 'error' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag color={config.color}>{status}</Tag>
        );
      },
      visible: columnVisibility.status,
    },
    {
      key: "actions",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      render: (record: UpdateRequestDTO) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => {
            setSelectedRequest(record);
            setIsModalVisible(true);
          }}
          disabled={record.status !== "Pending"}
        >
          Review
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
          <h3 className="text-xl font-bold">Insurance Update Requests</h3>
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
            {/* Search Input */}
            <Input.Search
              placeholder="Search by insurance number"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />

            {/* Status Filter */}
            <div>
              <Select
                placeholder={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <TagOutlined style={{ marginRight: 8 }} />
                    <span>Status</span>
                  </div>
                }
                allowClear
                style={{ width: "150px" }}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                disabled={loading}
              >
                <Option value="Pending">
                  <Badge status="warning" text="Pending" />
                </Option>
                <Option value="Approved">
                  <Badge status="success" text="Approved" />
                </Option>
                <Option value="Rejected">
                  <Badge status="error" text="Rejected" />
                </Option>
              </Select>
            </div>

            {/* Advanced Filters Button */}
            <Tooltip title="Advanced Filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color:
                        filterState.requestDateRange[0] ||
                        filterState.requestDateRange[1]
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
                disabled={!(searchText || statusFilter || 
                  filterState.requestDateRange[0] || filterState.requestDateRange[1])}
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
                    key: "requestedBy",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.requestedBy}
                          onChange={() =>
                            handleColumnVisibilityChange("requestedBy")
                          }
                        >
                          Requested By
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
                    key: "requestedAt",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.requestedAt}
                          onChange={() =>
                            handleColumnVisibilityChange("requestedAt")
                          }
                        >
                          Requested At
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
          dataSource={requests}
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

      {/* Review Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <FileImageOutlined className="text-blue-500" />
            <Text strong>Review Insurance Update Request</Text>
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setRejectionReason("");
        }}
        footer={[
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleReview(selectedRequest?.id || "", false)}
            disabled={!rejectionReason}
          >
            Reject
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleReview(selectedRequest?.id || "", true)}
            className="bg-green-500 hover:bg-green-600"
          >
            Approve
          </Button>,
        ]}
        width={800}
        className="review-modal"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <Card className="shadow-sm">
              <Descriptions title={
                <div className="flex items-center space-x-2 mb-4">
                  <IdcardOutlined className="text-blue-500" />
                  <Text strong>Request Information</Text>
                </div>
              } bordered column={2}>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <IdcardOutlined />
                      <span>Insurance Number</span>
                    </div>
                  }
                >
                  <Text strong>{selectedRequest.healthInsuranceNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <UserOutlined />
                      <span>Full Name</span>
                    </div>
                  }
                >
                  <Text strong>{selectedRequest.fullName}</Text>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <CalendarOutlined />
                      <span>Date of Birth</span>
                    </div>
                  }
                >
                  {formatDate(selectedRequest.dateOfBirth)}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <UserOutlined />
                      <span>Gender</span>
                    </div>
                  }
                >
                  {selectedRequest.gender}
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
                  {selectedRequest.address}
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
                    <Text strong>{selectedRequest.healthcareProviderName}</Text>
                    <Tag color="blue">{selectedRequest.healthcareProviderCode}</Tag>
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
                    <Badge status="processing" text={`From: ${formatDate(selectedRequest.validFrom)}`} />
                    <Badge status="warning" text={`To: ${formatDate(selectedRequest.validTo)}`} />
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
                  {formatDate(selectedRequest.issueDate)}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <ExclamationCircleOutlined />
                      <span>Has Insurance</span>
                    </div>
                  }
                >
                  <Tag color={selectedRequest.hasInsurance ? "success" : "error"}>
                    {selectedRequest.hasInsurance ? "Yes" : "No"}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedRequest.imageUrl && (
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
                  src={selectedRequest.imageUrl}
                  alt="Insurance"
                  style={{ maxWidth: "100%" }}
                  className="rounded-lg"
                />
              </Card>
            )}

            <Card 
              title={
                <div className="flex items-center space-x-2">
                  <CloseCircleOutlined className="text-red-500" />
                  <Text strong>Rejection Reason</Text>
                </div>
              }
              className="shadow-sm"
            >
              <Form layout="vertical">
                <Form.Item
                  required={true}
                  rules={[{ required: true, message: "Please provide a rejection reason" }]}
                >
                  <TextArea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="rejection-reason"
                  />
                </Form.Item>
              </Form>
            </Card>
          </div>
        )}
      </Modal>

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
          <Form.Item label="Status">
            <Select
              placeholder="Select status"
              allowClear
              style={{ width: "100%" }}
              value={filterState.statusFilter}
              onChange={(value) => setFilterState(prev => ({ ...prev, statusFilter: value }))}
            >
              <Option value="Pending">
                <Badge status="warning" text="Pending" />
              </Option>
              <Option value="Approved">
                <Badge status="success" text="Approved" />
              </Option>
              <Option value="Rejected">
                <Badge status="error" text="Rejected" />
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Request Date Range">
            <RangePicker
              style={{ width: "100%" }}
              value={filterState.requestDateRange}
              onChange={(dates) => 
                setFilterState(prev => ({ 
                  ...prev, 
                  requestDateRange: dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] 
                }))
              }
            />
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
        </Form>
      </Modal>
    </div>
  );
}
