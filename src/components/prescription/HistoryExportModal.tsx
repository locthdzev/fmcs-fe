import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Checkbox,
  Button,
  Typography,
  message,
  Row,
  Col,
  Select,
  DatePicker,
  Radio,
  Space,
  Divider,
} from "antd";
import {
  exportPrescriptionHistoriesToExcelWithConfig,
  PrescriptionHistoryExportConfigDTO,
} from "@/api/prescription";
import dayjs from "dayjs";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  InfoCircleOutlined,
  UndoOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface HistoryExportModalProps {
  visible: boolean;
  onClose: () => void;
  config: PrescriptionHistoryExportConfigDTO;
  onChange: (values: any) => void;
  filters: {
    currentPage: number;
    pageSize: number;
    action?: string;
    performedBySearch?: string;
    previousStatus?: string;
    newStatus?: string;
    sortBy: string;
    ascending: boolean;
    actionDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    prescriptionCode?: string;
    healthCheckResultCode?: string;
  };
  prescriptionCodes?: string[];
  healthCheckCodes?: string[];
  performedByOptions?: { id: string; fullName: string; email: string }[];
  statusOptions?: string[];
  actionOptions?: string[];
}

const HistoryExportModal: React.FC<HistoryExportModalProps> = ({
  visible,
  onClose,
  config,
  onChange,
  filters,
  prescriptionCodes = [],
  healthCheckCodes = [],
  performedByOptions = [],
  statusOptions = [],
  actionOptions = []
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      handleReset();
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (!values.exportAllPages) {
        const hasAnyFilter =
          values.filterAction ||
          values.filterPrescriptionCode ||
          values.filterHealthCheckResultCode ||
          values.filterPerformedBy ||
          values.filterPreviousStatus ||
          values.filterNewStatus ||
          (values.filterActionDateRange &&
            (values.filterActionDateRange[0] || values.filterActionDateRange[1])) ||
          filters.action ||
          filters.prescriptionCode ||
          filters.healthCheckResultCode ||
          filters.performedBySearch ||
          filters.previousStatus ||
          filters.newStatus ||
          (filters.actionDateRange &&
            (filters.actionDateRange[0] || filters.actionDateRange[1]));

        if (!hasAnyFilter) {
          messageApi.error({
            content:
              "Please select 'Export all data' or apply at least one filter",
            duration: 10,
          });
          setLoading(false);
          return;
        }
      }

      const exportConfig: PrescriptionHistoryExportConfigDTO = {
        exportAllPages: values.exportAllPages,
        includePrescriptionCode: values.includePrescriptionCode,
        includeHealthCheckCode: values.includeHealthCheckCode,
        includeAction: values.includeAction,
        includeActionDate: values.includeActionDate,
        includePerformedBy: values.includePerformedBy,
        includePreviousStatus: values.includePreviousStatus,
        includeNewStatus: values.includeNewStatus,
        includeChangeDetails: values.includeChangeDetails,
      };

      const useFilters = values.exportAllPages
        ? filters
        : {
            ...filters,
            action: values.filterAction || filters.action,
            prescriptionCode: values.filterPrescriptionCode || filters.prescriptionCode,
            healthCheckResultCode: values.filterHealthCheckResultCode || filters.healthCheckResultCode,
            performedBySearch: values.filterPerformedBy || filters.performedBySearch,
            previousStatus: values.filterPreviousStatus || filters.previousStatus,
            newStatus: values.filterNewStatus || filters.newStatus,
            actionDateRange: values.filterActionDateRange || filters.actionDateRange,
            ascending: values.filterSortDirection === "asc",
          };

      const {
        currentPage,
        pageSize,
        action,
        prescriptionCode,
        healthCheckResultCode,
        performedBySearch,
        previousStatus,
        newStatus,
        sortBy,
        ascending,
        actionDateRange,
      } = useFilters;

      const startActionDate = actionDateRange?.[0]?.format("YYYY-MM-DD");
      const endActionDate = actionDateRange?.[1]?.format("YYYY-MM-DD");

      const response = await exportPrescriptionHistoriesToExcelWithConfig(
        exportConfig,
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
        prescriptionCode,
        healthCheckResultCode
      );

      if (response.success && response.data) {
        window.open(response.data, "_blank");
        messageApi.success(
          "Prescription histories exported to Excel successfully",
          10
        );
        onChange(values);
        setLoading(false);
        onClose();
      } else {
        messageApi.error({
          content: response.message || "Failed to export Excel file",
          duration: 10,
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Export error:", error);
      messageApi.error({
        content: "An unexpected error occurred",
        duration: 10,
      });
      setLoading(false);
    }
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({
      ...config,
      exportAllPages: true,
      filterAction: null,
      filterPrescriptionCode: null,
      filterHealthCheckResultCode: null,
      filterPerformedBy: null,
      filterPreviousStatus: null,
      filterNewStatus: null,
      filterSortDirection: filters.ascending ? "asc" : "desc",
      filterActionDateRange: null,
      includePrescriptionCode: true,
      includeHealthCheckCode: true,
      includePatient: true,
      includeAction: true,
      includeActionDate: true,
      includePerformedBy: true,
      includePreviousStatus: true,
      includeNewStatus: true,
      includeChangeDetails: true,
    });
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Export Configuration
        </Title>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="reset" onClick={handleReset} icon={<UndoOutlined />}>
          Reset
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Export
        </Button>,
      ]}
      destroyOnClose={false}
    >
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...config,
          filterAction: filters.action || null,
          filterPrescriptionCode: filters.prescriptionCode || null,
          filterHealthCheckResultCode: filters.healthCheckResultCode || null,
          filterPerformedBy: filters.performedBySearch || null,
          filterPreviousStatus: filters.previousStatus || null,
          filterNewStatus: filters.newStatus || null,
          filterSortDirection: filters.ascending ? "asc" : "desc",
          filterActionDateRange: filters.actionDateRange,
          exportAllPages: true,
        }}
        onValuesChange={(changedValues, allValues) => {
          onChange(changedValues);
        }}
        preserve={false}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* Basic Options */}
          <Divider orientation="left">Basic Options</Divider>
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Form.Item
                name="exportAllPages"
                valuePropName="checked"
                style={{ marginBottom: "12px" }}
              >
                <Checkbox>Export all data (ignore pagination)</Checkbox>
              </Form.Item>
            </Col>
            <Col span={24}>
              <div style={{ marginBottom: "16px" }}>
                <div
                  className="filter-label"
                  style={{
                    marginBottom: "8px",
                    color: "#666666",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <SortAscendingOutlined />
                  <span>Sort direction</span>
                </div>
                <Form.Item name="filterSortDirection" noStyle>
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    style={{ width: "100%" }}
                  >
                    <Radio.Button
                      value="asc"
                      style={{ width: "50%", textAlign: "center" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        <SortAscendingOutlined />
                        <span>Oldest First</span>
                      </div>
                    </Radio.Button>
                    <Radio.Button
                      value="desc"
                      style={{ width: "50%", textAlign: "center" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        <SortDescendingOutlined />
                        <span>Newest First</span>
                      </div>
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </div>
            </Col>
          </Row>

          {/* Data Filters */}
          <Form.Item dependencies={["exportAllPages"]} noStyle>
            {({ getFieldValue }) => {
              const exportAll = getFieldValue("exportAllPages");
              return !exportAll ? (
                <>
                  <Divider orientation="left">Data Filters</Divider>
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <Form.Item
                        label="Action"
                        name="filterAction"
                      >
                        <Select
                          placeholder="Select Action"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() || ""
                            ).includes(input.toLowerCase())
                          }
                          options={actionOptions.map((action) => ({
                            value: action,
                            label: action,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Prescription Code"
                        name="filterPrescriptionCode"
                      >
                        <Select
                          placeholder="Select Prescription Code"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() || ""
                            ).includes(input.toLowerCase())
                          }
                          options={prescriptionCodes.map((code) => ({
                            value: code,
                            label: code,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Health Check Result Code"
                        name="filterHealthCheckResultCode"
                      >
                        <Select
                          placeholder="Select Health Check Result Code"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() || ""
                            ).includes(input.toLowerCase())
                          }
                          options={healthCheckCodes.map((code) => ({
                            value: code,
                            label: code,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Performed By" name="filterPerformedBy">
                        <Select
                          placeholder="Select staff who performed the action"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() || ""
                            ).includes(input.toLowerCase())
                          }
                          optionLabelProp="label"
                          options={performedByOptions.map((user) => ({
                            value: user.fullName,
                            label: `${user.fullName} (${user.email})`,
                            email: user.email,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Previous Status"
                        name="filterPreviousStatus"
                      >
                        <Select
                          placeholder="Select Previous Status"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() || ""
                            ).includes(input.toLowerCase())
                          }
                          options={statusOptions.map((status) => ({
                            value: status,
                            label: status,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="New Status"
                        name="filterNewStatus"
                      >
                        <Select
                          placeholder="Select New Status"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() || ""
                            ).includes(input.toLowerCase())
                          }
                          options={statusOptions.map((status) => ({
                            value: status,
                            label: status,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Action Date Range"
                        name="filterActionDateRange"
                      >
                        <RangePicker
                          style={{ width: "100%" }}
                          placeholder={["From date", "To date"]}
                          format="DD/MM/YYYY"
                          allowClear
                          presets={[
                            { label: "Today", value: [dayjs(), dayjs()] },
                            {
                              label: "Last 7 Days",
                              value: [dayjs().subtract(6, "days"), dayjs()],
                            },
                            {
                              label: "Last 30 Days",
                              value: [dayjs().subtract(29, "days"), dayjs()],
                            },
                            {
                              label: "This Month",
                              value: [
                                dayjs().startOf("month"),
                                dayjs().endOf("month"),
                              ],
                            },
                            {
                              label: "All Time (includes 2025)",
                              value: [dayjs("2020-01-01"), dayjs("2030-12-31")],
                            },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ) : null;
            }}
          </Form.Item>

          {/* Include Fields */}
          <Divider orientation="left">Include Fields</Divider>
          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Form.Item name="includePrescriptionCode" valuePropName="checked">
                <Checkbox>Prescription Code</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includeHealthCheckCode" valuePropName="checked">
                <Checkbox>Health Check Code</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includePatient" valuePropName="checked">
                <Checkbox>Patient Details</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includeAction" valuePropName="checked">
                <Checkbox>Action</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includeActionDate" valuePropName="checked">
                <Checkbox>Action Date</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includePerformedBy" valuePropName="checked">
                <Checkbox>Performed By</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includePreviousStatus" valuePropName="checked">
                <Checkbox>Previous Status</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includeNewStatus" valuePropName="checked">
                <Checkbox>New Status</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includeChangeDetails" valuePropName="checked">
                <Checkbox>Change Details</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          {/* Information Note */}
          <Row gutter={[16, 8]}>
            <Col span={24} style={{ marginTop: "8px" }}>
              <div
                style={{
                  background: "#e6f7ff",
                  border: "1px solid #91d5ff",
                  padding: "12px",
                  borderRadius: "4px",
                }}
              >
                <Typography.Text style={{ fontSize: "13px" }}>
                  <InfoCircleOutlined style={{ marginRight: "8px" }} />
                  You must either select "Export all data" or apply at least one
                  filter before exporting. This ensures you get the exact data
                  you need.
                </Typography.Text>
              </div>
            </Col>
          </Row>
        </Space>
      </Form>
    </Modal>
  );
};

export default HistoryExportModal;
