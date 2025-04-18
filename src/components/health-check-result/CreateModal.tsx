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
import { toast } from "react-toastify";
import { PlusOutlined, MinusCircleOutlined, UserOutlined } from "@ant-design/icons";
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
  const [loading, setLoading] = useState(false);
  const [followUpRequired, setFollowUpRequired] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Chuyển đổi giá trị từ form sang DTO
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
        toast.success("Tạo kết quả khám thành công!");
        form.resetFields();
        onClose();
        onSuccess();
      } else {
        toast.error(response.message || "Không thể tạo kết quả khám");
      }
    } catch (error) {
      console.error("Form validation error:", error);
      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Custom render cho option trong Select
  const renderUserOption = (user: { id: string; fullName: string; email: string }) => ({
    value: user.id,
    label: (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div><strong>{user.fullName}</strong></div>
        <div style={{ fontSize: '12px', color: '#888' }}>{user.email}</div>
        <div style={{ fontSize: '11px', color: '#aaa' }}>ID: {user.id}</div>
      </div>
    ),
  });

  return (
    <Modal
      title="Tạo kết quả khám mới"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Tạo
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          checkupDate: moment(),
          healthCheckResultDetails: [{}],
        }}
      >
        <Typography.Title level={5}>Thông tin cơ bản</Typography.Title>
        <Form.Item
          name="userId"
          label="Bệnh nhân"
          rules={[{ required: true, message: "Vui lòng chọn bệnh nhân" }]}
        >
          <Select
            showSearch
            placeholder="Chọn bệnh nhân"
            optionFilterProp="label"
            optionLabelProp="label"
            filterOption={(input, option) => {
              const optionData = userOptions.find(u => u.id === option?.value);
              if (!optionData) return false;
              
              const fullName = optionData.fullName.toLowerCase();
              const email = optionData.email.toLowerCase();
              const id = optionData.id.toLowerCase();
              const searchValue = input.toLowerCase();
              
              return fullName.includes(searchValue) || 
                     email.includes(searchValue) ||
                     id.includes(searchValue);
            }}
            options={userOptions.map(user => ({
              value: user.id,
              label: `${user.fullName} (${user.email})`,
            }))}
            dropdownRender={menu => (
              <div>
                <div style={{ padding: '8px', fontSize: '12px', borderBottom: '1px solid #eee' }}>
                  <Tooltip title="Tìm theo tên, email hoặc ID">
                    <UserOutlined /> Tổng số {userOptions.length} bệnh nhân
                  </Tooltip>
                </div>
                {menu}
              </div>
            )}
          />
        </Form.Item>

        <Form.Item
          name="checkupDate"
          label="Ngày khám"
          rules={[{ required: true, message: "Vui lòng chọn ngày khám" }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            placeholder="Chọn ngày khám"
          />
        </Form.Item>

        <Form.Item
          name="followUpRequired"
          valuePropName="checked"
        >
          <Checkbox onChange={(e) => setFollowUpRequired(e.target.checked)}>
            Yêu cầu tái khám
          </Checkbox>
        </Form.Item>

        {followUpRequired && (
          <Form.Item
            name="followUpDate"
            label="Ngày tái khám"
            rules={[
              {
                required: followUpRequired,
                message: "Vui lòng chọn ngày tái khám",
              },
            ]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder="Chọn ngày tái khám"
            />
          </Form.Item>
        )}

        <Divider />

        <Typography.Title level={5}>Chi tiết kết quả khám</Typography.Title>

        <Form.List name="healthCheckResultDetails">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} className="mb-4 border p-4 rounded">
                  <div className="flex justify-between mb-2">
                    <Typography.Text strong>Chi tiết #{key + 1}</Typography.Text>
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      >
                        Xóa
                      </Button>
                    )}
                  </div>

                  <Form.Item
                    {...restField}
                    name={[name, "resultSummary"]}
                    label="Tóm tắt kết quả"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tóm tắt kết quả",
                      },
                    ]}
                  >
                    <TextArea
                      rows={2}
                      placeholder="Nhập tóm tắt kết quả khám"
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "diagnosis"]}
                    label="Chẩn đoán"
                    rules={[
                      { required: true, message: "Vui lòng nhập chẩn đoán" },
                    ]}
                  >
                    <TextArea rows={3} placeholder="Nhập chẩn đoán" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "recommendations"]}
                    label="Khuyến nghị"
                    rules={[
                      { required: true, message: "Vui lòng nhập khuyến nghị" },
                    ]}
                  >
                    <TextArea rows={3} placeholder="Nhập khuyến nghị" />
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
                  Thêm chi tiết kết quả khám
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