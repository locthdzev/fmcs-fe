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
} from "antd";
import {
  exportDrugOrdersToExcel,
  DrugOrderExportConfigDTO,
} from "@/api/drugorder";
import dayjs from "dayjs";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  InfoCircleOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { DrugOrderCodeOption } from "./index";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  config: DrugOrderExportConfigDTO;
  onChange: (config: Partial<DrugOrderExportConfigDTO>) => void;
  onExport: () => void;
  filters: {
    currentPage: number;
    pageSize: number;
    drugOrderCodeSearch?: string;
    supplierId?: string;
    minTotalPrice?: number;
    maxTotalPrice?: number;
    sortBy: string;
    ascending: boolean;
    status?: string;
    orderDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    updatedDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  };
  drugOrderCodes?: DrugOrderCodeOption[];
  supplierOptions?: { id: string; supplierName: string }[];
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onClose,
  loading,
  config,
  onChange,
  onExport,
  filters,
  drugOrderCodes = [],
  supplierOptions = [],
}) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Reset form when modal becomes visible
  useEffect(() => {
    if (visible) {
      handleReset();
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onChange(values);
      onExport();
    } catch (error) {
      console.error("Export error:", error);
      messageApi.error({
        content: "Please check your form inputs",
        duration: 10,
      });
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
      filterSortDirection: "desc",
      includeDrugOrderCode: true,
      includeSupplier: true,
      includeOrderDate: true,
      includeTotalQuantity: true,
      includeTotalPrice: true,
      includeCreatedBy: true,
      includeCreatedAt: true,
      includeUpdatedAt: true,
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
          exportAllPages: true,
          filterSortDirection: "desc",
          includeDrugOrderCode: true,
          includeSupplier: true,
          includeOrderDate: true,
          includeTotalQuantity: true,
          includeTotalPrice: true,
          includeCreatedBy: true,
          includeCreatedAt: true,
          includeUpdatedAt: true,
          includeStatus: true,
        }}
        onValuesChange={(changedValues, allValues) => {
          onChange(changedValues);
        }}
        preserve={false}
      >
        <Row gutter={[16, 8]}>
          <Col span={24}>
            <Typography.Title level={5}>Basic Options</Typography.Title>
          </Col>
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

          {/* Use Form.Item dependencies to properly update visibility */}
          <Form.Item dependencies={["exportAllPages"]} noStyle>
            {({ getFieldValue }) => {
              const exportAll = getFieldValue("exportAllPages");
              return !exportAll ? (
                <>
                  <Col span={24}>
                    <Typography.Title level={5}>Data Filters</Typography.Title>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      label="Drug Order Code"
                      name="filterDrugOrderCode"
                    >
                      <Select
                        placeholder="Select Drug Order Code"
                        style={{ width: "100%" }}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          (
                            option?.label?.toString().toLowerCase() || ""
                          ).includes(input.toLowerCase())
                        }
                        options={drugOrderCodes.map((code) => ({
                          value: code.value,
                          label: code.label,
                        }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="Supplier" name="filterSupplier">
                      <Select
                        placeholder="Select Supplier"
                        style={{ width: "100%" }}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          (
                            option?.label?.toString().toLowerCase() || ""
                          ).includes(input.toLowerCase())
                        }
                        options={supplierOptions.map((supplier) => ({
                          value: supplier.id,
                          label: supplier.supplierName,
                        }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="Min Total Price" name="filterMinPrice">
                      <Select
                        placeholder="Select Minimum Price"
                        style={{ width: "100%" }}
                        allowClear
                        options={[
                          { value: 100000, label: "100,000 VND" },
                          { value: 500000, label: "500,000 VND" },
                          { value: 1000000, label: "1,000,000 VND" },
                          { value: 5000000, label: "5,000,000 VND" },
                          { value: 10000000, label: "10,000,000 VND" },
                        ]}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="Max Total Price" name="filterMaxPrice">
                      <Select
                        placeholder="Select Maximum Price"
                        style={{ width: "100%" }}
                        allowClear
                        options={[
                          { value: 1000000, label: "1,000,000 VND" },
                          { value: 5000000, label: "5,000,000 VND" },
                          { value: 10000000, label: "10,000,000 VND" },
                          { value: 50000000, label: "50,000,000 VND" },
                          { value: 100000000, label: "100,000,000 VND" },
                        ]}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      label="Order Date Range"
                      name="filterOrderDateRange"
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
                            label: "All Time",
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
                            label: "All Time",
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
                            label: "All Time",
                            value: [dayjs("2020-01-01"), dayjs("2030-12-31")],
                          },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </>
              ) : null;
            }}
          </Form.Item>

          <Col span={24}>
            <Typography.Title level={5}>Include Fields</Typography.Title>
          </Col>
          <Col span={6}>
            <Form.Item name="includeDrugOrderCode" valuePropName="checked">
              <Checkbox>Drug Order Code</Checkbox>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="includeSupplier" valuePropName="checked">
              <Checkbox>Supplier</Checkbox>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="includeOrderDate" valuePropName="checked">
              <Checkbox>Order Date</Checkbox>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="includeTotalQuantity" valuePropName="checked">
              <Checkbox>Total Quantity</Checkbox>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="includeTotalPrice" valuePropName="checked">
              <Checkbox>Total Price</Checkbox>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="includeCreatedBy" valuePropName="checked">
              <Checkbox>Created By</Checkbox>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="includeCreatedAt" valuePropName="checked">
              <Checkbox>Created At</Checkbox>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="includeUpdatedAt" valuePropName="checked">
              <Checkbox>Updated At</Checkbox>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="includeStatus" valuePropName="checked">
              <Checkbox>Status</Checkbox>
            </Form.Item>
          </Col>

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
                filter before exporting. This ensures you get the exact data you
                need.
              </Typography.Text>
            </div>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ExportConfigModal;
