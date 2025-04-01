import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  DatePicker,
  Pagination,
  Space,
  Row,
  Col,
  Typography,
  Tag,
  Tooltip,
  Divider,
  Empty,
  Spin,
  Modal,
  Form,
  Checkbox,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllTreatmentPlanHistories,
  TreatmentPlanHistoryResponseDTO,
  exportTreatmentPlanHistoriesToExcelWithConfig,
  TreatmentPlanHistoryExportConfigDTO,
  PerformedByInfo,
} from "@/api/treatment-plan";
import { useRouter } from 'next/router';
import { 
  SearchOutlined, 
  ExportOutlined,
  EyeOutlined,
  FilterOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// Helper functions
const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return '';
  return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
};

const DEFAULT_EXPORT_CONFIG = {
  exportAllPages: true,
  includeTreatmentPlanCode: true,
  includeHealthCheckCode: true,
  includePatient: true,
  includeAction: true,
  includeActionDate: true,
  includePerformedBy: true,
  includePreviousStatus: true,
  includeNewStatus: true,
  includeChangeDetails: true,
};

export function TreatmentPlanHistoryList() {
  const router = useRouter();
  const [histories, setHistories] = useState<TreatmentPlanHistoryResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState<string | undefined>(undefined);
  const [performedBySearch, setPerformedBySearch] = useState("");
  const [previousStatus, setPreviousStatus] = useState<string | undefined>(undefined);
  const [newStatus, setNewStatus] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState("ActionDate");
  const [ascending, setAscending] = useState(false);
  const [treatmentPlanCode, setTreatmentPlanCode] = useState("");
  const [healthCheckResultCode, setHealthCheckResultCode] = useState("");
  const [actionDateRange, setActionDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [showExportConfigModal, setShowExportConfigModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportConfig, setExportConfig] = useState<TreatmentPlanHistoryExportConfigDTO>({
    exportAllPages: false,
    includeTreatmentPlanCode: true,
    includeHealthCheckCode: true,
    includePatient: true,
    includeAction: true,
    includeActionDate: true,
    includePerformedBy: true,
    includePreviousStatus: true,
    includeNewStatus: true,
    includeChangeDetails: true,
  });
  const [form] = Form.useForm();

  // Fetch histories
  const fetchHistories = useCallback(async () => {
    setLoading(true);
    try {
      const startActionDate = actionDateRange[0]?.format('YYYY-MM-DD');
      const endActionDate = actionDateRange[1]?.format('YYYY-MM-DD');

      const response = await getAllTreatmentPlanHistories(
        currentPage,
        pageSize,
        action,
        startActionDate,
        endActionDate,
        performedBySearch,
        previousStatus,
        newStatus,
        sortBy,
        ascending,
        treatmentPlanCode,
        healthCheckResultCode
      );

      if (response.success) {
        setHistories(response.data.items || response.data);
        setTotal(response.data.totalCount || response.data.length || 0);
      } else {
        toast.error("Failed to fetch treatment plan histories");
      }
    } catch (error) {
      console.error("Error fetching treatment plan histories:", error);
      toast.error("Failed to fetch treatment plan histories");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    action,
    actionDateRange,
    performedBySearch,
    previousStatus,
    newStatus,
    sortBy,
    ascending,
    treatmentPlanCode,
    healthCheckResultCode,
  ]);

  useEffect(() => {
    fetchHistories();
  }, []);

  useEffect(() => {
    fetchHistories();
  }, [
    currentPage,
    pageSize,
    sortBy,
    ascending,
  ]);

  // Event handlers
  const handleSearch = () => {
    setCurrentPage(1);
    fetchHistories();
  };

  const handleReset = () => {
    setAction(undefined);
    setPerformedBySearch("");
    setPreviousStatus(undefined);
    setNewStatus(undefined);
    setSortBy("ActionDate");
    setAscending(false);
    setTreatmentPlanCode("");
    setHealthCheckResultCode("");
    setActionDateRange([null, null]);
    setCurrentPage(1);
    fetchHistories();
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  const handleOpenExportConfig = () => {
    setShowExportConfigModal(true);
  };

  const closeExportConfigModal = () => {
    setShowExportConfigModal(false);
  };

  const handleExportConfigChange = (changedValues: any) => {
    setExportConfig({ ...exportConfig, ...changedValues });
  };

  const handleExportWithConfig = async () => {
    try {
      const values = await form.validateFields();
      setExportLoading(true);

      const exportConfigData: TreatmentPlanHistoryExportConfigDTO = {
        exportAllPages: values.exportAllPages,
        includeTreatmentPlanCode: values.includeTreatmentPlanCode,
        includeHealthCheckCode: values.includeHealthCheckCode,
        includePatient: values.includePatient,
        includeAction: values.includeAction,
        includeActionDate: values.includeActionDate,
        includePerformedBy: values.includePerformedBy,
        includePreviousStatus: values.includePreviousStatus,
        includeNewStatus: values.includeNewStatus,
        includeChangeDetails: values.includeChangeDetails,
      };

      const startActionDate = actionDateRange[0]?.format('YYYY-MM-DD');
      const endActionDate = actionDateRange[1]?.format('YYYY-MM-DD');

      const response = await exportTreatmentPlanHistoriesToExcelWithConfig(
        exportConfigData,
        currentPage,
        pageSize,
        action,
        startActionDate,
        endActionDate,
        performedBySearch,
        previousStatus,
        newStatus,
        sortBy,
        ascending,
        treatmentPlanCode,
        healthCheckResultCode
      );

      if (response.success && response.data) {
        window.open(response.data, "_blank");
        toast.success("Treatment plan histories exported to Excel successfully");
      } else {
        toast.error(response.message || "Failed to export Excel file");
      }
      
      setExportConfig(exportConfigData);
      closeExportConfigModal();
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel file");
    } finally {
      setExportLoading(false);
    }
  };

  // Status and action colors
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'processing';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'SOFT_DELETED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'Create':
        return 'green';
      case 'Update':
        return 'blue';
      case 'Cancel':
        return 'red';
      case 'StatusChange':
        return 'orange';
      case 'SoftDelete':
        return 'gray';
      case 'Restore':
        return 'green';
      default:
        return 'blue';
    }
  };

  // Column definitions for the table
  const columns = [
    {
      title: "Treatment Plan Code",
      dataIndex: ["treatmentPlan", "treatmentPlanCode"],
      key: "treatmentPlanCode",
      render: (text: string, record: TreatmentPlanHistoryResponseDTO) => (
        record.treatmentPlan ? (
          <Button 
            type="link" 
            onClick={() => router.push(`/treatment-plan/${record.treatmentPlan?.id}`)}
          >
            {text}
          </Button>
        ) : "N/A"
      ),
    },
    {
      title: "Health Check Code",
      dataIndex: ["treatmentPlan", "healthCheckResult", "healthCheckResultCode"],
      key: "healthCheckResultCode",
      render: (text: string, record: TreatmentPlanHistoryResponseDTO) => (
        record.treatmentPlan?.healthCheckResult ? (
          <Button 
            type="link" 
            onClick={() => router.push(`/health-check-result/${record.treatmentPlan?.healthCheckResult?.id}`)}
          >
            {text}
          </Button>
        ) : "N/A"
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (text: string) => (
        <Tag color={getActionColor(text)}>{text}</Tag>
      ),
    },
    {
      title: "Action Date",
      dataIndex: "actionDate",
      key: "actionDate",
      render: (text: string) => formatDateTime(text),
      sorter: true,
    },
    {
      title: "Performed By",
      dataIndex: "performedBy",
      key: "performedBy",
      render: (performedBy: PerformedByInfo) => (
        performedBy ? (
          <>
            <div><strong>{performedBy.fullName}</strong></div>
            <div>{performedBy.email}</div>
          </>
        ) : "N/A"
      ),
    },
    {
      title: "Previous Status",
      dataIndex: "previousStatus",
      key: "previousStatus",
      render: (status: string) => (
        status ? (
          <Tag color={getStatusColor(status)}>{status}</Tag>
        ) : "N/A"
      ),
    },
    {
      title: "New Status",
      dataIndex: "newStatus",
      key: "newStatus",
      render: (status: string) => (
        status ? (
          <Tag color={getStatusColor(status)}>{status}</Tag>
        ) : "N/A"
      ),
    },
    {
      title: "Change Details",
      dataIndex: "changeDetails",
      key: "changeDetails",
      render: (text: string) => (
        text ? (
          <Tooltip title={text}>
            <div className="truncate max-w-md">{text}</div>
          </Tooltip>
        ) : "N/A"
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: TreatmentPlanHistoryResponseDTO) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => router.push(`/treatment-plan/${record.treatmentPlan?.id}`)}
            title="View Treatment Plan Details"
          />
        </Space>
      ),
    },
  ];

  // Export config modal
  const renderExportConfigModal = () => (
    <Modal
      title="Export Configuration"
      open={showExportConfigModal}
      onCancel={closeExportConfigModal}
      footer={[
        <Button key="back" onClick={closeExportConfigModal}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={exportLoading}
          onClick={handleExportWithConfig}
        >
          Export
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={exportConfig}
      >
        <Form.Item
          name="exportAllPages"
          valuePropName="checked"
        >
          <Checkbox>Export all pages (not just current page)</Checkbox>
        </Form.Item>

        <Divider />
        <Title level={5}>Include Columns</Title>
        
        <Form.Item
          name="includeTreatmentPlanCode"
          valuePropName="checked"
        >
          <Checkbox>Treatment Plan Code</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeHealthCheckCode"
          valuePropName="checked"
        >
          <Checkbox>Health Check Code</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includePatient"
          valuePropName="checked"
        >
          <Checkbox>Patient</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeAction"
          valuePropName="checked"
        >
          <Checkbox>Action</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeActionDate"
          valuePropName="checked"
        >
          <Checkbox>Action Date</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includePerformedBy"
          valuePropName="checked"
        >
          <Checkbox>Performed By</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includePreviousStatus"
          valuePropName="checked"
        >
          <Checkbox>Previous Status</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeNewStatus"
          valuePropName="checked"
        >
          <Checkbox>New Status</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeChangeDetails"
          valuePropName="checked"
        >
          <Checkbox>Change Details</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );

  // Main render
  return (
    <div className="p-4">
      <Title level={2}>Treatment Plan History</Title>
      
      {/* Toolbar Section */}
      <div className="flex flex-wrap justify-between mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            icon={<ExportOutlined />}
            onClick={handleOpenExportConfig}
          >
            Export to Excel
          </Button>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="mb-6 bg-gray-50 p-4 rounded">
        <Title level={5}>Search & Filters</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by Treatment Plan Code"
              value={treatmentPlanCode}
              onChange={(e) => setTreatmentPlanCode(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by Health Check Code"
              value={healthCheckResultCode}
              onChange={(e) => setHealthCheckResultCode(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Action"
              value={action}
              onChange={(value) => setAction(value)}
              style={{ width: "100%" }}
              allowClear
            >
              <Option value="Create">Create</Option>
              <Option value="Update">Update</Option>
              <Option value="Cancel">Cancel</Option>
              <Option value="StatusChange">Status Change</Option>
              <Option value="SoftDelete">Soft Delete</Option>
              <Option value="Restore">Restore</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by Performed By"
              value={performedBySearch}
              onChange={(e) => setPerformedBySearch(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Previous Status"
              value={previousStatus}
              onChange={(value) => setPreviousStatus(value)}
              style={{ width: "100%" }}
              allowClear
            >
              <Option value="IN_PROGRESS">In Progress</Option>
              <Option value="COMPLETED">Completed</Option>
              <Option value="CANCELLED">Cancelled</Option>
              <Option value="SOFT_DELETED">Soft Deleted</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by New Status"
              value={newStatus}
              onChange={(value) => setNewStatus(value)}
              style={{ width: "100%" }}
              allowClear
            >
              <Option value="IN_PROGRESS">In Progress</Option>
              <Option value="COMPLETED">Completed</Option>
              <Option value="CANCELLED">Cancelled</Option>
              <Option value="SOFT_DELETED">Soft Deleted</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              placeholder={["Action Start Date", "Action End Date"]}
              value={actionDateRange as any}
              onChange={(dates) => setActionDateRange(dates as [moment.Moment | null, moment.Moment | null])}
              style={{ width: "100%" }}
              showTime
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space>
              <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
                Search
              </Button>
              <Button onClick={handleReset}>Reset</Button>
            </Space>
          </Col>
        </Row>
      </div>
      
      {/* Table Section */}
      <div className="mb-4">
        <Table
          columns={columns}
          dataSource={histories}
          rowKey="id"
          loading={loading}
          pagination={false}
          onChange={(pagination, filters, sorter: any) => {
            if (sorter.field) {
              setSortBy(sorter.field);
              setAscending(sorter.order === 'ascend');
              fetchHistories();
            }
          }}
        />
        
        <div className="mt-4 flex justify-end">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            showTotal={(total) => `Total ${total} items`}
          />
        </div>
      </div>
      
      {/* Export Config Modal */}
      {renderExportConfigModal()}
    </div>
  );
} 