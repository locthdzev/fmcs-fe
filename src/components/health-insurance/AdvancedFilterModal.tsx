import React, { useEffect } from "react";
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
  Checkbox,
  Row,
  Col,
} from "antd";
import {
  FilterOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  HealthInsuranceResponseDTO,
  UpdateRequestDTO,
} from "@/api/healthinsurance";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AdvancedFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  tabKey: string;
  data: HealthInsuranceResponseDTO[] | UpdateRequestDTO[];
  initialFilters?: any;
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  onReset,
  tabKey,
  data,
  initialFilters = {},
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialFilters);
    }
  }, [visible, initialFilters, form]);

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  const handleApply = () => {
    const values = form.getFieldsValue();
    onApply(values);
    onClose();
  };

  // Lấy các options cho filter theo status dựa trên tab
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
          { value: "Unverified", label: "Unverified" },
        ];
      case "updateRequest":
        return [
          { value: "Pending", label: "Pending Review" },
          { value: "Rejected", label: "Rejected" },
          { value: "Approved", label: "Approved" },
        ];
      case "expiredUpdate":
        return [{ value: "ExpiredUpdate", label: "Expired Update" }];
      case "expired":
        return [{ value: "Expired", label: "Expired" }];
      case "uninsured":
        return [{ value: "NoInsurance", label: "No Insurance" }];
      case "softDelete":
        return [{ value: "SoftDeleted", label: "Soft Deleted" }];
      case "rejected":
        return [{ value: "Rejected", label: "Rejected" }];
      default:
        return [];
    }
  };

  // Lấy các options cho filter theo verification status
  const getVerificationOptions = () => {
    if (tabKey === "verified" || tabKey === "rejected") {
      return [
        { value: "Verified", label: "Verified" },
        { value: "Rejected", label: "Rejected" },
      ];
    }
    return [];
  };

  // Lấy unique users từ data
  const getUniqueUsers = () => {
    const users = new Set<string>();
    const options: { value: string; label: string }[] = [];

    data.forEach((item: any) => {
      const user = item.user || item.requestedBy;
      if (user && user.id && !users.has(user.id)) {
        users.add(user.id);
        options.push({
          value: user.id,
          label: `${user.fullName || user.userName || "Unknown"} (${
            user.email || "No email"
          })`,
        });
      }
    });

    return options;
  };

  // Lấy unique healthcare providers từ data
  const getUniqueHealthcareProviders = () => {
    if (!["verified", "expired", "rejected"].includes(tabKey)) return [];

    const providers = new Set<string>();
    const options: { value: string; label: string }[] = [];

    data.forEach((item: any) => {
      if (
        item.healthcareProviderName &&
        !providers.has(item.healthcareProviderName)
      ) {
        providers.add(item.healthcareProviderName);
        options.push({
          value: item.healthcareProviderName,
          label: item.healthcareProviderName,
        });
      }
    });

    return options;
  };

  return (
    <Modal
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            Advanced Filters
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
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
      <Form form={form} layout="vertical" initialValues={initialFilters}>
        <Row gutter={16}>
          <Col span={8}>
            {/* User Information */}
            <Card className="mb-4">
              <Space align="center" className="mb-2">
                <UserOutlined />
                <Text strong>User Information</Text>
              </Space>
              <Divider style={{ margin: "8px 0" }} />

              <Form.Item name="userSearch" label="User Search">
                <Input placeholder="Search by user name or email" />
              </Form.Item>

              <Form.Item name="userId" label="User">
                <Select
                  allowClear
                  showSearch
                  placeholder="Select user"
                  filterOption={(input, option) =>
                    (option?.label?.toString().toLowerCase() || "").includes(
                      input.toLowerCase()
                    )
                  }
                  options={getUniqueUsers()}
                />
              </Form.Item>
            </Card>
          </Col>

          <Col span={8}>
            {/* Date Filters */}
            <Card className="mb-4">
              <Space align="center" className="mb-2">
                <CalendarOutlined />
                <Text strong>Date Filters</Text>
              </Space>
              <Divider style={{ margin: "8px 0" }} />

              {(tabKey === "verified" ||
                tabKey === "expired" ||
                tabKey === "rejected") && (
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
          </Col>

          <Col span={8}>
            {/* Status Filters */}
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

              {(tabKey === "verified" || tabKey === "rejected") && (
                <Form.Item
                  name="verificationStatus"
                  label="Verification Status"
                >
                  <Select
                    mode="multiple"
                    placeholder="Select verification status"
                    style={{ width: "100%" }}
                    options={getVerificationOptions()}
                  />
                </Form.Item>
              )}

              {(tabKey === "verified" ||
                tabKey === "expired" ||
                tabKey === "rejected") && (
                <>
                  <Form.Item name="hasImage" label="Has Insurance Card Image">
                    <Radio.Group>
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                      <Radio value={undefined}>All</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    name="healthcareProvider"
                    label="Healthcare Provider"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select healthcare provider"
                      style={{ width: "100%" }}
                      options={getUniqueHealthcareProviders()}
                    />
                  </Form.Item>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default AdvancedFilterModal;
