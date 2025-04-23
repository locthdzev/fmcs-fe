import React from "react";
import {
  Modal,
  Form,
  Select,
  Button,
  DatePicker,
  Radio,
  Space,
  Typography,
  Divider,
  Row,
  Col,
} from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title } = Typography;

interface NotificationFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filterState: {
    recipientTypeFilter: string | undefined;
    createdByFilter: string | undefined;
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
        dateRange:
          filterState.dateRange[0] && filterState.dateRange[1]
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
      title={
        <Title level={4} style={{ margin: 0 }}>
          Advanced Filters
        </Title>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="reset" onClick={handleReset} icon={<UndoOutlined />}>
          Reset Filters
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          icon={<CheckCircleOutlined />}
        >
          Apply Filters
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Divider orientation="left">Filter Options</Divider>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="recipientType" label="Recipient Type">
                <Select placeholder="Select recipient type" allowClear defaultValue={undefined}>
                  <Option value="System">System</Option>
                  <Option value="Role">Role</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="sendEmail" label="Email Sent">
                <Select placeholder="Select email sent status" allowClear defaultValue={undefined}>
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
              defaultValue={undefined}
            >
              <Option value="admin">Admin</Option>
              <Option value="system">System</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">Date & Sorting</Divider>

          <Form.Item name="dateRange" label="Created Date Range">
            <RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label="Sort Direction (CreatedAt)">
            <Radio.Group
              name="ascending"
              optionType="button"
              buttonStyle="solid"
              style={{ width: "100%" }}
            >
              <Radio.Button
                value={true}
                style={{ width: "50%", textAlign: "center" }}
              >
                <SortAscendingOutlined /> Oldest First
              </Radio.Button>
              <Radio.Button
                value={false}
                style={{ width: "50%", textAlign: "center" }}
              >
                <SortDescendingOutlined /> Newest First
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};

export default NotificationFilterModal;
