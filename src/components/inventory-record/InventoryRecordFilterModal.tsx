import React from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  Select,
  DatePicker,
  Radio,
  Divider,
  Row,
  Col,
  Input,
  Form,
  InputNumber,
  Slider,
} from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface InventoryRecordFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: InventoryRecordFilters) => void;
  onReset: () => void;
  filters: InventoryRecordFilters;
}

// Interface for filter values
export interface InventoryRecordFilters {
  quantityInStockRange: [number | null, number | null];
  reorderLevelRange: [number | null, number | null];
  lastUpdatedRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  createdAtRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  sortField: string;
  ascending: boolean;
}

const InventoryRecordFilterModal: React.FC<InventoryRecordFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
}) => {
  const [form] = Form.useForm();

  // Reset form when modal is opened with new filters
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        quantityInStockRange: filters.quantityInStockRange || [null, null],
        reorderLevelRange: filters.reorderLevelRange || [null, null],
        lastUpdatedRange: filters.lastUpdatedRange || [null, null],
        createdAtRange: filters.createdAtRange || [null, null],
        ascending: filters.ascending !== undefined ? filters.ascending : false,
        sortField: filters.sortField || "createdAt",
      });
    }
  }, [visible, filters, form]);

  // Process and apply filters
  const handleApply = () => {
    form
      .validateFields()
      .then((values) => {
        console.log("Raw form values:", values);

        // Ensure proper handling of date ranges
        const formattedValues = {
          ...values,
          quantityInStockRange: values.quantityInStockRange || [null, null],
          reorderLevelRange: values.reorderLevelRange || [null, null],
          lastUpdatedRange: values.lastUpdatedRange || [null, null],
          createdAtRange: values.createdAtRange || [null, null],
        };

        console.log("Applying filter values:", formattedValues);
        onApply(formattedValues);
      })
      .catch((err) => {
        console.error("Form validation error:", err);
      });
  };

  // Handle reset - chỉ reset form hiện tại, không reset các filter ở toolbar
  const handleResetModal = () => {
    form.resetFields();
    // Không gọi onReset từ props để tránh reset toàn bộ filters
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Advanced Filters
        </Title>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="reset" onClick={handleResetModal} icon={<UndoOutlined />}>
          Reset
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          icon={<CheckCircleOutlined />}
        >
          Apply
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={filters}>
        <Divider orientation="left">Filter Options</Divider>

        <Row gutter={16}>
          {/* Quantity In Stock Range */}
          <Col span={12}>
            <Form.Item
              name="quantityInStockRange"
              label="Quantity In Stock Range"
              tooltip="Filter by quantity in stock range"
            >
              <Input.Group compact style={{ display: "flex" }}>
                <InputNumber
                  style={{ width: "45%" }}
                  placeholder="Min"
                  min={0}
                  onChange={(value) => {
                    const current = form.getFieldValue(
                      "quantityInStockRange"
                    ) || [null, null];
                    form.setFieldsValue({
                      quantityInStockRange: [value, current[1]],
                    });
                  }}
                />
                <Input
                  style={{
                    width: "10%",
                    borderLeft: 0,
                    borderRight: 0,
                    pointerEvents: "none",
                    textAlign: "center",
                  }}
                  placeholder="~"
                  disabled
                />
                <InputNumber
                  style={{ width: "45%" }}
                  placeholder="Max"
                  min={0}
                  onChange={(value) => {
                    const current = form.getFieldValue(
                      "quantityInStockRange"
                    ) || [null, null];
                    form.setFieldsValue({
                      quantityInStockRange: [current[0], value],
                    });
                  }}
                />
              </Input.Group>
            </Form.Item>
          </Col>

          {/* Reorder Level Range */}
          <Col span={12}>
            <Form.Item
              name="reorderLevelRange"
              label="Reorder Level Range"
              tooltip="Filter by reorder level range"
            >
              <Input.Group compact style={{ display: "flex" }}>
                <InputNumber
                  style={{ width: "45%" }}
                  placeholder="Min"
                  min={0}
                  onChange={(value) => {
                    const current = form.getFieldValue("reorderLevelRange") || [
                      null,
                      null,
                    ];
                    form.setFieldsValue({
                      reorderLevelRange: [value, current[1]],
                    });
                  }}
                />
                <Input
                  style={{
                    width: "10%",
                    borderLeft: 0,
                    borderRight: 0,
                    pointerEvents: "none",
                    textAlign: "center",
                  }}
                  placeholder="~"
                  disabled
                />
                <InputNumber
                  style={{ width: "45%" }}
                  placeholder="Max"
                  min={0}
                  onChange={(value) => {
                    const current = form.getFieldValue("reorderLevelRange") || [
                      null,
                      null,
                    ];
                    form.setFieldsValue({
                      reorderLevelRange: [current[0], value],
                    });
                  }}
                />
              </Input.Group>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Date & Sorting</Divider>

        <Row gutter={16}>
          {/* Last Updated Range */}
          <Col span={12}>
            <Form.Item name="lastUpdatedRange" label="Last Updated Range">
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                presets={[
                  {
                    label: "Today",
                    value: [dayjs().startOf("day"), dayjs().endOf("day")],
                  },
                  {
                    label: "Last 7 Days",
                    value: [
                      dayjs().subtract(6, "day").startOf("day"),
                      dayjs().endOf("day"),
                    ],
                  },
                  {
                    label: "Last 30 Days",
                    value: [
                      dayjs().subtract(29, "day").startOf("day"),
                      dayjs().endOf("day"),
                    ],
                  },
                  {
                    label: "This Month",
                    value: [
                      dayjs().startOf("month").startOf("day"),
                      dayjs().endOf("month").endOf("day"),
                    ],
                  },
                  {
                    label: "Last Month",
                    value: [
                      dayjs()
                        .subtract(1, "month")
                        .startOf("month")
                        .startOf("day"),
                      dayjs().subtract(1, "month").endOf("month").endOf("day"),
                    ],
                  },
                  {
                    label: "This Year",
                    value: [
                      dayjs().startOf("year").startOf("day"),
                      dayjs().endOf("year").endOf("day"),
                    ],
                  },
                ]}
              />
            </Form.Item>
          </Col>

          {/* Created At Range */}
          <Col span={12}>
            <Form.Item name="createdAtRange" label="Created At Range">
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                presets={[
                  {
                    label: "Today",
                    value: [dayjs().startOf("day"), dayjs().endOf("day")],
                  },
                  {
                    label: "Last 7 Days",
                    value: [
                      dayjs().subtract(6, "day").startOf("day"),
                      dayjs().endOf("day"),
                    ],
                  },
                  {
                    label: "Last 30 Days",
                    value: [
                      dayjs().subtract(29, "day").startOf("day"),
                      dayjs().endOf("day"),
                    ],
                  },
                  {
                    label: "This Month",
                    value: [
                      dayjs().startOf("month").startOf("day"),
                      dayjs().endOf("month").endOf("day"),
                    ],
                  },
                  {
                    label: "Last Month",
                    value: [
                      dayjs()
                        .subtract(1, "month")
                        .startOf("month")
                        .startOf("day"),
                      dayjs().subtract(1, "month").endOf("month").endOf("day"),
                    ],
                  },
                  {
                    label: "This Year",
                    value: [
                      dayjs().startOf("year").startOf("day"),
                      dayjs().endOf("year").endOf("day"),
                    ],
                  },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Sort Field */}
          <Col span={12}>
            <Form.Item name="sortField" label="Sort By Field">
              <Select>
                <Option value="createdAt">Created At</Option>
                <Option value="lastUpdated">Last Updated</Option>
                <Option value="quantityInStock">Quantity In Stock</Option>
                <Option value="reorderLevel">Reorder Level</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Sort Direction */}
          <Col span={12}>
            <Form.Item name="ascending" label="Sort Direction">
              <Radio.Group buttonStyle="solid" style={{ width: "100%" }}>
                <Radio.Button
                  value={true}
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
                  value={false}
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
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default InventoryRecordFilterModal;
