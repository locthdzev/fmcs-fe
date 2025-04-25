import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Checkbox,
  Button,
  Divider,
  Space,
  Typography,
  message,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { HealthCheckResultsCreateRequestDTO } from "@/api/healthcheckresult";
import { createHealthCheckResult } from "@/api/healthcheckresult";

const { Option } = Select;
const { TextArea } = Input;

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userOptions: { id: string; fullName: string; email: string }[];
  staffOptions: { id: string; fullName: string; email: string }[];
}

const CreateModal: React.FC<CreateModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userOptions,
  staffOptions,
}) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [followUpRequired, setFollowUpRequired] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Convert form values to DTO
      const requestData: HealthCheckResultsCreateRequestDTO = {
        userId: values.userId,
        checkupDate: values.checkupDate.format("YYYY-MM-DD"),
        followUpRequired: values.followUpRequired || false,
        followUpDate: values.followUpDate
          ? values.followUpDate.format("YYYY-MM-DD")
          : undefined,
        healthCheckResultDetails: values.healthCheckResultDetails.map(
          (detail: any) => ({
            resultSummary: detail.resultSummary,
            diagnosis: detail.diagnosis,
            recommendations: detail.recommendations,
          })
        ),
      };

      const response = await createHealthCheckResult(requestData);

      if (response.isSuccess) {
        messageApi.success("Health check result created successfully!");
        form.resetFields();
        onClose();
        onSuccess();
      } else {
        messageApi.error(
          response.message || "Unable to create health check result"
        );
      }
    } catch (error) {
      console.error("Form validation error:", error);
      messageApi.error("Please check the information you entered");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Custom render for Select options
  const renderUserOption = (user: {
    id: string;
    fullName: string;
    email: string;
  }) => ({
    value: user.id,
    label: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div>
          <strong>{user.fullName}</strong>
        </div>
        <div style={{ fontSize: "12px", color: "#888" }}>{user.email}</div>
        <div style={{ fontSize: "11px", color: "#aaa" }}>ID: {user.id}</div>
      </div>
    ),
  });

  return (
    <Modal
      title="Create New Health Check Result"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Create
        </Button>,
      ]}
    >
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          checkupDate: moment(),
          healthCheckResultDetails: [{}],
        }}
      >
        <Typography.Title level={5}>Basic Information</Typography.Title>
        <Form.Item
          name="userId"
          label="User"
          rules={[{ required: true, message: "Please select a patient" }]}
        >
          <Select
            showSearch
            placeholder="Select user"
            optionFilterProp="label"
            optionLabelProp="label"
            filterOption={(input, option) => {
              const optionData = userOptions.find(
                (u) => u.id === option?.value
              );
              if (!optionData) return false;

              const fullName = optionData.fullName.toLowerCase();
              const email = optionData.email.toLowerCase();
              const id = optionData.id.toLowerCase();
              const searchValue = input.toLowerCase();

              return (
                fullName.includes(searchValue) ||
                email.includes(searchValue) ||
                id.includes(searchValue)
              );
            }}
            options={userOptions.map((user) => ({
              value: user.id,
              label: `${user.fullName} (${user.email})`,
            }))}
            dropdownRender={(menu) => (
              <div>
                <div
                  style={{
                    padding: "8px",
                    fontSize: "12px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Tooltip title="Search by name, email or ID">
                    <UserOutlined /> Total {userOptions.length} patients
                  </Tooltip>
                </div>
                {menu}
              </div>
            )}
          />
        </Form.Item>

        <Form.Item
          name="checkupDate"
          label="Checkup Date"
          rules={[{ required: true, message: "Please select checkup date" }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            placeholder="Select checkup date"
          />
        </Form.Item>

        <Form.Item name="followUpRequired" valuePropName="checked">
          <Checkbox onChange={(e) => setFollowUpRequired(e.target.checked)}>
            Follow-up Required
          </Checkbox>
        </Form.Item>

        {followUpRequired && (
          <Form.Item
            name="followUpDate"
            label="Follow-up Date"
            rules={[
              {
                required: followUpRequired,
                message: "Please select follow-up date",
              },
            ]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder="Select follow-up date"
            />
          </Form.Item>
        )}

        <Divider />

        <Typography.Title level={5}>Health Check Details</Typography.Title>

        <Form.List name="healthCheckResultDetails">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} className="mb-4 border p-4 rounded">
                  <div className="flex justify-between mb-2">
                    <Typography.Text strong>Detail #{key + 1}</Typography.Text>
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Form.Item
                    {...restField}
                    name={[name, "resultSummary"]}
                    label="Symptoms"
                    rules={[
                      {
                        required: true,
                        message: "Please enter symptoms",
                      },
                    ]}
                  >
                    <TextArea rows={2} placeholder="Enter symptoms" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "diagnosis"]}
                    label="Diagnosis"
                    rules={[
                      { required: true, message: "Please enter diagnosis" },
                    ]}
                  >
                    <TextArea rows={3} placeholder="Enter diagnosis" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "recommendations"]}
                    label="Recommendations"
                    rules={[
                      {
                        required: true,
                        message: "Please enter recommendations",
                      },
                    ]}
                  >
                    <TextArea rows={3} placeholder="Enter recommendations" />
                  </Form.Item>
                </div>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Health Check Detail
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default CreateModal;
