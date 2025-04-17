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
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    drugSearch: string;
    batchCodeSearch: string;
    statusFilter: string;
    lastUpdatedRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    ascending: boolean;
  };
  drugOptions: any[];
}

const InventoryRecordFilterModal: React.FC<InventoryRecordFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  drugOptions,
}) => {
  const [form] = Form.useForm();
  const [localFilters, setLocalFilters] = React.useState(filters);

  // Reset localFilters when modal is opened with new filters
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      form.setFieldsValue({
        drugSearch: filters.drugSearch,
        batchCodeSearch: filters.batchCodeSearch,
        statusFilter: filters.statusFilter,
        lastUpdatedRange: filters.lastUpdatedRange,
        ascending: filters.ascending,
      });
    }
  }, [visible, filters, form]);

  // Process and apply filters
  const handleApply = () => {
    form.validateFields().then((values) => {
      onApply({
        ...values,
        lastUpdatedRange: values.lastUpdatedRange || [null, null],
      });
    });
  };

  return (
    <Modal
      title="Advanced Filters"
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="reset" onClick={onReset} icon={<UndoOutlined />}>
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
        <Divider orientation="left">Search Criteria</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="drugSearch" label="Drug">
              <Select
                showSearch
                allowClear
                placeholder="Select Drug"
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={drugOptions.map((drug) => ({
                  value: drug.name,
                  label: `${drug.name} (${drug.drugCode})`,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="batchCodeSearch" label="Batch Code">
              <Input placeholder="Enter batch code" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="statusFilter" label="Status">
              <Select
                allowClear
                placeholder="Select Status"
              >
                <Option value="Priority">Priority</Option>
                <Option value="Active">Active</Option>
                <Option value="NearExpiry">Near Expiry</Option>
                <Option value="Inactive">Inactive</Option>
                <Option value="Expired">Expired</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Date & Sorting</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="lastUpdatedRange" label="Last Updated Range">
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                presets={[
                  { label: "Today", value: [dayjs(), dayjs()] },
                  {
                    label: "Last 7 Days",
                    value: [dayjs().subtract(6, "day"), dayjs()],
                  },
                  {
                    label: "Last 30 Days",
                    value: [dayjs().subtract(29, "day"), dayjs()],
                  },
                  {
                    label: "This Month",
                    value: [dayjs().startOf("month"), dayjs().endOf("month")],
                  },
                  {
                    label: "Last Month",
                    value: [
                      dayjs().subtract(1, "month").startOf("month"),
                      dayjs().subtract(1, "month").endOf("month"),
                    ],
                  },
                  {
                    label: "This Year",
                    value: [dayjs().startOf("year"), dayjs().endOf("year")],
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="ascending" label="Sort Direction (Last Updated)">
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