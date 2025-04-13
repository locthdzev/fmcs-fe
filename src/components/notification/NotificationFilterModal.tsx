import React from "react";
import {
  Modal,
  Form,
  Select,
  Button,
  DatePicker,
  Radio,
  Checkbox,
  Typography,
  Space,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

interface NotificationFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filterState: {
    recipientTypeFilter: string;
    createdByFilter: string;
    sendEmailFilter: boolean | null;
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    sortBy: string;
    ascending: boolean;
  };
}

const NotificationFilterModal: React.FC<NotificationFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  onReset,
  filterState,
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        recipientType: filterState.recipientTypeFilter,
        createdBy: filterState.createdByFilter,
        sendEmail: filterState.sendEmailFilter,
        dateRange: filterState.dateRange[0] && filterState.dateRange[1]
          ? [filterState.dateRange[0], filterState.dateRange[1]]
          : undefined,
        sortBy: filterState.sortBy,
        ascending: filterState.ascending,
      });
    }
  }, [visible, filterState, form]);

  const handleApply = async () => {
    try {
      const values = await form.validateFields();
      onApply(values);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Modal
      title="Filter Notifications"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="reset" onClick={handleReset}>
          Reset Filters
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Apply Filters
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="recipientType" label="Recipient Type">
              <Select placeholder="Select recipient type" allowClear>
                <Option value="System">System</Option>
                <Option value="Role">Role</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="sendEmail" label="Email Sent">
              <Select placeholder="Select email sent status" allowClear>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="createdBy" label="Created By">
          <Select 
            placeholder="Filter by creator" 
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {/* User options would be populated here */}
            <Option value="admin">Admin</Option>
            <Option value="system">System</Option>
          </Select>
        </Form.Item>

        <Form.Item name="dateRange" label="Created Date Range">
          <RangePicker 
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
          />
        </Form.Item>

        <Form.Item label="Sort">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Form.Item name="sortBy" noStyle>
              <Radio.Group>
                <Radio.Button value="CreatedAt">Created Date</Radio.Button>
                <Radio.Button value="Title">Title</Radio.Button>
                <Radio.Button value="Status">Status</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item name="ascending" valuePropName="checked" noStyle>
              <Checkbox>Sort Ascending</Checkbox>
            </Form.Item>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NotificationFilterModal; 