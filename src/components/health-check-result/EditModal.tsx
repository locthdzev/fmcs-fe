import React, { useState, useEffect } from "react";
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
} from "antd";
import { toast } from "react-toastify";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import moment from "moment";
import {
  HealthCheckResultsResponseDTO,
  HealthCheckResultsUpdateWithIdRequestDTO,
  updateHealthCheckResult,
  getHealthCheckResultById,
  HealthCheckResultsIdResponseDTO
} from "@/api/healthcheckresult";

const { Option } = Select;
const { TextArea } = Input;

const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

interface EditModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  healthCheckResult: HealthCheckResultsResponseDTO | null;
  userOptions: { id: string; fullName: string; email: string }[];
  staffOptions: { id: string; fullName: string; email: string }[];
}

const EditModal: React.FC<EditModalProps> = ({
  visible,
  onClose,
  onSuccess,
  healthCheckResult,
  userOptions,
  staffOptions,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [healthCheckResultDetails, setHealthCheckResultDetails] = useState<any[]>([]);

  useEffect(() => {
    if (visible && healthCheckResult) {
      const fetchHealthCheckResultDetails = async () => {
        try {
          setLoading(true);
          const response = await getHealthCheckResultById(healthCheckResult.id);
          
          if (response.isSuccess && response.data) {
            const result: HealthCheckResultsIdResponseDTO = response.data;
            
            setFollowUpRequired(result.followUpRequired || false);
            setHealthCheckResultDetails(result.healthCheckResultDetails || []);
            
            // Set form values
            form.setFieldsValue({
              userId: result.userId,
              checkupDate: result.checkupDate ? moment(result.checkupDate) : moment(),
              followUpRequired: result.followUpRequired || false,
              followUpDate: result.followUpDate ? moment(result.followUpDate) : undefined,
              healthCheckResultDetails: result.healthCheckResultDetails?.map(detail => ({
                resultSummary: detail.resultSummary || '',
                diagnosis: detail.diagnosis || '',
                recommendations: detail.recommendations || ''
              })) || [{}]
            });
          } else {
            toast.error(response.message || "Không thể tải thông tin chi tiết");
          }
        } catch (error) {
          console.error("Error fetching health check result details:", error);
          toast.error("Không thể tải thông tin chi tiết");
        } finally {
          setLoading(false);
        }
      };

      fetchHealthCheckResultDetails();
    }
  }, [visible, healthCheckResult, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Đảm bảo có đủ thông tin cần thiết
      if (!healthCheckResult?.id) {
        toast.error("Thiếu ID kết quả khám");
        setLoading(false);
        return;
      }

      // Chuyển đổi giá trị từ form sang DTO
      const requestData: HealthCheckResultsUpdateWithIdRequestDTO = {
        followUpRequired: values.followUpRequired || false,
        followUpDate: values.followUpRequired && values.followUpDate
          ? values.followUpDate.format("YYYY-MM-DD")
          : undefined,
        healthCheckResultDetails: values.healthCheckResultDetails.map(
          (detail: any) => ({
            resultSummary: detail.resultSummary,
            diagnosis: detail.diagnosis,
            recommendations: detail.recommendations,
          })
        )
      };

      const response = await updateHealthCheckResult(healthCheckResult.id, requestData);

      if (response.isSuccess) {
        toast.success("Cập nhật kết quả khám thành công!");
        form.resetFields();
        onClose();
        onSuccess();
      } else {
        toast.error(response.message || "Không thể cập nhật kết quả khám");
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

  return (
    <Modal
      title="Chỉnh sửa kết quả khám"
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
          Cập nhật
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
        {/* Hidden fields để lưu trữ thông tin cần thiết */}
        <Form.Item name="userId" hidden={true}>
          <Input />
        </Form.Item>
        
        <Typography.Title level={5}>Thông tin cơ bản</Typography.Title>
        <Form.Item
          label="Bệnh nhân"
        >
          {healthCheckResult?.user ? (
            <Typography.Text strong>
              {healthCheckResult.user.fullName} ({healthCheckResult.user.email})
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">Không có thông tin bệnh nhân</Typography.Text>
          )}
        </Form.Item>

        <Form.Item
          label="Ngày khám"
        >
          <Typography.Text>
            {healthCheckResult?.checkupDate ? formatDate(healthCheckResult.checkupDate) : ''}
          </Typography.Text>
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
              disabledDate={(current) => current && current < moment().endOf('day')}
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

export default EditModal; 