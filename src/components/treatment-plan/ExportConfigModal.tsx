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
  exportTreatmentPlansToExcelWithConfig,
  TreatmentPlanExportConfigDTO,
} from "@/api/treatment-plan";
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

interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  config: TreatmentPlanExportConfigDTO;
  onChange: (values: any) => void;
  filters: {
    currentPage: number;
    pageSize: number;
    treatmentPlanCodeSearch?: string;
    healthCheckResultCodeSearch?: string;
    userSearch?: string;
    drugSearch?: string;
    updatedBySearch?: string;
    sortBy: string;
    ascending: boolean;
    statusFilter?: string;
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    updatedDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  };
  treatmentPlanCodes?: string[];
  healthCheckCodes?: string[];
  drugOptions?: { id: string; name: string; drugCode: string }[];
  updatedByOptions?: { id: string; fullName: string; email: string }[];
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onClose,
  config,
  onChange,
  filters,
  treatmentPlanCodes = [],
  healthCheckCodes = [],
  drugOptions = [],
  updatedByOptions = [],
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
          values.filterTreatmentPlanCode ||
          values.filterHealthCheckResultCode ||
          values.filterDrug ||
          values.filterUpdatedBy ||
          (values.filterDateRange &&
            (values.filterDateRange[0] || values.filterDateRange[1])) ||
          (values.filterCreatedDateRange &&
            (values.filterCreatedDateRange[0] ||
              values.filterCreatedDateRange[1])) ||
          (values.filterUpdatedDateRange &&
            (values.filterUpdatedDateRange[0] ||
              values.filterUpdatedDateRange[1])) ||
          filters.treatmentPlanCodeSearch ||
          filters.healthCheckResultCodeSearch ||
          filters.drugSearch ||
          filters.updatedBySearch ||
          (filters.dateRange &&
            (filters.dateRange[0] || filters.dateRange[1])) ||
          (filters.createdDateRange &&
            (filters.createdDateRange[0] || filters.createdDateRange[1])) ||
          (filters.updatedDateRange &&
            (filters.updatedDateRange[0] || filters.updatedDateRange[1]));

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

      const exportConfig: TreatmentPlanExportConfigDTO = {
        exportAllPages: values.exportAllPages,
        includePatient: values.includePatient,
        includeHealthCheckCode: values.includeHealthCheckCode,
        includeDrug: values.includeDrug,
        includeTreatmentDescription: values.includeTreatmentDescription,
        includeInstructions: values.includeInstructions,
        includeStartDate: values.includeStartDate,
        includeEndDate: values.includeEndDate,
        includeCreatedAt: values.includeCreatedAt,
        includeCreatedBy: values.includeCreatedBy,
        includeUpdatedAt: values.includeUpdatedAt,
        includeUpdatedBy: values.includeUpdatedBy,
        includeStatus: values.includeStatus,
      };

      const useFilters = values.exportAllPages
        ? filters
        : {
            ...filters,
            treatmentPlanCodeSearch:
              values.filterTreatmentPlanCode || filters.treatmentPlanCodeSearch,
            healthCheckResultCodeSearch:
              values.filterHealthCheckResultCode ||
              filters.healthCheckResultCodeSearch,
            drugSearch: values.filterDrug || filters.drugSearch,
            updatedBySearch: values.filterUpdatedBy || filters.updatedBySearch,
            dateRange: values.filterDateRange || filters.dateRange,
            createdDateRange:
              values.filterCreatedDateRange || filters.createdDateRange,
            updatedDateRange:
              values.filterUpdatedDateRange || filters.updatedDateRange,
            ascending: values.filterSortDirection === "asc",
          };

      const {
        currentPage,
        pageSize,
        treatmentPlanCodeSearch,
        healthCheckResultCodeSearch,
        userSearch,
        drugSearch,
        updatedBySearch,
        sortBy,
        ascending,
        statusFilter,
        dateRange,
        createdDateRange,
        updatedDateRange,
      } = useFilters;

      const startDate = dateRange?.[0]?.format("YYYY-MM-DD");
      const endDate = dateRange?.[1]?.format("YYYY-MM-DD");
      const createdStartDate = createdDateRange?.[0]?.format("YYYY-MM-DD");
      const createdEndDate = createdDateRange?.[1]?.format("YYYY-MM-DD");
      const updatedStartDate = updatedDateRange?.[0]?.format("YYYY-MM-DD");
      const updatedEndDate = updatedDateRange?.[1]?.format("YYYY-MM-DD");

      const response = await exportTreatmentPlansToExcelWithConfig(
        exportConfig,
        currentPage,
        pageSize,
        treatmentPlanCodeSearch,
        healthCheckResultCodeSearch,
        userSearch,
        drugSearch,
        updatedBySearch,
        sortBy,
        ascending,
        statusFilter as string,
        startDate,
        endDate,
        createdStartDate,
        createdEndDate,
        updatedStartDate,
        updatedEndDate
      );

      if (response.success && response.data) {
        window.open(response.data, "_blank");
        messageApi.success(
          "Treatment plans exported to Excel successfully",
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
      filterTreatmentPlanCode: null,
      filterHealthCheckResultCode: null,
      filterDrug: null,
      filterUpdatedBy: null,
      filterSortDirection: filters.ascending ? "asc" : "desc",
      filterDateRange: null,
      filterCreatedDateRange: null,
      filterUpdatedDateRange: null,
      includePatient: true,
      includeHealthCheckCode: true,
      includeDrug: true,
      includeTreatmentDescription: true,
      includeInstructions: true,
      includeStartDate: true,
      includeEndDate: true,
      includeCreatedAt: true,
      includeCreatedBy: true,
      includeUpdatedAt: true,
      includeUpdatedBy: true,
      includeStatus: true,
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
          filterTreatmentPlanCode: filters.treatmentPlanCodeSearch || null,
          filterHealthCheckResultCode:
            filters.healthCheckResultCodeSearch || null,
          filterDrug: filters.drugSearch || null,
          filterUpdatedBy: filters.updatedBySearch || null,
          filterSortDirection: filters.ascending ? "asc" : "desc",
          filterDateRange: filters.dateRange,
          filterCreatedDateRange: filters.createdDateRange,
          filterUpdatedDateRange: filters.updatedDateRange,
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
                        label="Treatment Plan Code"
                        name="filterTreatmentPlanCode"
                      >
                        <Select
                          placeholder="Select Treatment Plan Code"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() || ""
                            ).includes(input.toLowerCase())
                          }
                          options={treatmentPlanCodes.map((code) => ({
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
                      <Form.Item label="Drug" name="filterDrug">
                        <Select
                          placeholder="Select Drug"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() || ""
                            ).includes(input.toLowerCase())
                          }
                          options={drugOptions.map((drug) => ({
                            value: drug.name,
                            label: `${drug.name} (${drug.drugCode})`,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Updated By" name="filterUpdatedBy">
                        <Select
                          placeholder="Select staff who updated"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() || ""
                            ).includes(input.toLowerCase())
                          }
                          optionLabelProp="label"
                          options={updatedByOptions.map((user) => ({
                            value: user.fullName,
                            label: `${user.fullName} (${user.email})`,
                            email: user.email,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Treatment Date Range"
                        name="filterDateRange"
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
                    <Col span={12}>
                      <Form.Item
                        label="Created Date Range"
                        name="filterCreatedDateRange"
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
                    <Col span={12}>
                      <Form.Item
                        label="Updated Date Range"
                        name="filterUpdatedDateRange"
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
            <Col span={6}>
              <Form.Item name="includePatient" valuePropName="checked">
                <Checkbox>Patient Details</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="includeHealthCheckCode" valuePropName="checked">
                <Checkbox>Health Check Code</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="includeDrug" valuePropName="checked">
                <Checkbox>Drug Information</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="includeTreatmentDescription"
                valuePropName="checked"
              >
                <Checkbox>Treatment Description</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="includeInstructions" valuePropName="checked">
                <Checkbox>Instructions</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="includeStartDate" valuePropName="checked">
                <Checkbox>Start Date</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="includeEndDate" valuePropName="checked">
                <Checkbox>End Date</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="includeCreatedAt" valuePropName="checked">
                <Checkbox>Created At</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="includeCreatedBy" valuePropName="checked">
                <Checkbox>Created By</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="includeUpdatedAt" valuePropName="checked">
                <Checkbox>Updated At</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="includeUpdatedBy" valuePropName="checked">
                <Checkbox>Updated By</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="includeStatus" valuePropName="checked">
                <Checkbox>Status</Checkbox>
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

export default ExportConfigModal;
