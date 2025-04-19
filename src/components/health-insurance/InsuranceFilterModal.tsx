import React, { useState } from "react";
import {
  Modal,
  Form,
  Button,
  Space,
  Typography,
  Divider,
  DatePicker,
  Select,
  Input,
  Radio,
  Card,
} from "antd";
import { FilterOutlined, CalendarOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface InsuranceFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  initialFilters?: any;
  tabKey: string;
}

const InsuranceFilterModal: React.FC<InsuranceFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = {},
  tabKey,
}) => {
  const [form] = Form.useForm();

  const handleReset = () => {
    form.resetFields();
  };

  const handleApply = () => {
    const values = form.getFieldsValue();
    onApply(values);
    onClose();
  };

  // Convert filter options based on selected tab
  const getStatusOptions = () => {
    switch (tabKey) {
      case "verified":
        return [
          { value: "Active", label: "Active" },
          { value: "AboutToExpire", label: "About To Expire" },
          { value: "Expired", label: "Expired" },
        ];
      case "initial":
        return [
          { value: "Initial", label: "Initial" },
          { value: "PendingDeadline", label: "Pending Deadline" },
        ];
      case "verification":
        return [
          { value: "Pending", label: "Pending Verification" },
        ];
      case "updateRequest":
        return [
          { value: "Pending", label: "Pending Review" },
          { value: "Rejected", label: "Rejected" },
          { value: "Approved", label: "Approved" },
        ];
      case "expiredUpdate":
        return [
          { value: "ExpiredUpdate", label: "Expired Update" },
        ];
      case "expired":
        return [
          { value: "Expired", label: "Expired" },
        ];
      case "uninsured":
        return [
          { value: "NoInsurance", label: "No Insurance" },
        ];
      case "softDelete":
        return [
          { value: "SoftDeleted", label: "Soft Deleted" },
        ];
      default:
        return [];
    }
  };

  const getVerificationOptions = () => {
    if (tabKey === "verified") {
      return [
        { value: "Verified", label: "Verified" },
        { value: "Rejected", label: "Rejected" },
      ];
    }
    return [];
  };

  return (
    <Modal
      title={
        <Space>
          <FilterOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Filter Health Insurance Records
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleReset}>Reset</Button>
          <Button type="primary" onClick={handleApply}>
            Apply Filters
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialFilters}
      >
        <Card className="mb-4">
          <Space align="center" className="mb-2">
            <UserOutlined />
            <Text strong>User Information</Text>
          </Space>
          <Divider style={{ margin: "8px 0" }} />

          <Form.Item name="userSearch" label="User Search">
            <Input placeholder="Search by user name or email" />
          </Form.Item>
        </Card>

        <Card className="mb-4">
          <Space align="center" className="mb-2">
            <CalendarOutlined />
            <Text strong>Date Filters</Text>
          </Space>
          <Divider style={{ margin: "8px 0" }} />

          {(tabKey === "verified" || tabKey === "expired") && (
            <>
              <Form.Item name="validPeriod" label="Valid Period">
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item name="issueDate" label="Issue Date">
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </>
          )}

          <Form.Item name="createdAtRange" label="Created At">
            <RangePicker style={{ width: "100%" }} showTime />
          </Form.Item>

          {tabKey !== "initial" && tabKey !== "uninsured" && (
            <Form.Item name="updatedAtRange" label="Updated At">
              <RangePicker style={{ width: "100%" }} showTime />
            </Form.Item>
          )}

          {(tabKey === "initial" || tabKey === "expiredUpdate") && (
            <Form.Item name="deadlineRange" label="Deadline">
              <RangePicker style={{ width: "100%" }} showTime />
            </Form.Item>
          )}

          {(tabKey === "verification" || tabKey === "updateRequest") && (
            <Form.Item name="requestedAtRange" label="Requested At">
              <RangePicker style={{ width: "100%" }} showTime />
            </Form.Item>
          )}
        </Card>

        <Card className="mb-4">
          <Space align="center" className="mb-2">
            <FilterOutlined />
            <Text strong>Status Filters</Text>
          </Space>
          <Divider style={{ margin: "8px 0" }} />

          <Form.Item name="status" label="Status">
            <Select
              mode="multiple"
              placeholder="Select status"
              style={{ width: "100%" }}
              options={getStatusOptions()}
            />
          </Form.Item>

          {tabKey === "verified" && (
            <Form.Item name="verificationStatus" label="Verification Status">
              <Select
                mode="multiple"
                placeholder="Select verification status"
                style={{ width: "100%" }}
                options={getVerificationOptions()}
              />
            </Form.Item>
          )}

          {(tabKey === "verified" || tabKey === "expired") && (
            <Form.Item name="hasImage" label="Has Insurance Card Image">
              <Radio.Group>
                <Radio value={true}>Yes</Radio>
                <Radio value={false}>No</Radio>
                <Radio value={undefined}>All</Radio>
              </Radio.Group>
            </Form.Item>
          )}
        </Card>
      </Form>
    </Modal>
  );
};

export default InsuranceFilterModal;
