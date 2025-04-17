import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Card,
  Typography,
  Button,
  Spin,
  message,
  Form,
  Input,
  Select,
  Row,
  Col,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CloseOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { DrugGroupIcon } from "./Icons";
import {
  updateDrugGroup,
  getDrugGroupById,
  DrugGroupUpdateRequest,
  DrugGroupResponse,
} from "@/api/druggroup";

const { Text } = Typography;
const { Option } = Select;

interface EditDrugGroupPageProps {
  id?: string;
}

export const EditDrugGroup: React.FC<EditDrugGroupPageProps> = ({
  id: propId,
}) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [drugGroup, setDrugGroup] = useState<DrugGroupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | null>(
    null
  );
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);

  // Get ID from props or router
  const id = propId || (router.query.id as string);

  useEffect(() => {
    console.log("EditDrugGroup component mounted with id:", id);

    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      console.log("Fetching drug group with ID:", id);
      const response = await getDrugGroupById(id);

      // Kiểm tra cấu trúc dữ liệu trả về từ API
      let drugGroupData: DrugGroupResponse | null = null;

      if (response && response.data) {
        drugGroupData = response.data;
      } else if (
        response &&
        typeof response === "object" &&
        response.groupName
      ) {
        drugGroupData = response as DrugGroupResponse;
      } else {
        throw new Error("Invalid data structure received from API");
      }

      // Ensure drugGroupData is not null before proceeding
      if (!drugGroupData) {
        throw new Error("No valid drug group data found");
      }

      console.log("Processed Drug Group Data:", drugGroupData);
      setDrugGroup(drugGroupData);

      // Thiết lập giá trị cho form
      form.setFieldsValue({
        groupName: drugGroupData.groupName,
        description: drugGroupData.description || "",
        status: drugGroupData.status || "Active",
      });

      // Lưu lại các giá trị cần thiết
      setOriginalCreatedAt(drugGroupData.createdAt);
      setOriginalStatus(drugGroupData.status || "Active");
    } catch (error) {
      console.error("Error fetching data:", error);
      messageApi.error("Failed to fetch drug group data");
      setDrugGroup(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!id || !originalCreatedAt || !originalStatus) {
      messageApi.error(
        "Original data not fully loaded. Please wait and try again.",
        5
      );
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const requestData: DrugGroupUpdateRequest = {
        groupName: values.groupName,
        description: values.description || "",
        createdAt: originalCreatedAt,
        updatedAt: new Date().toISOString(),
        status: originalStatus,
      };

      const response = await updateDrugGroup(id, requestData);

      if (response.isSuccess) {
        messageApi.success(
          response.message || "Drug group updated successfully",
          5
        );
        // Navigate back to the details page after successful update
        setTimeout(() => {
          router.push(`/drug-group/${id}`);
        }, 1000);
      } else {
        if (response.code === 409) {
          messageApi.error(response.message || "Group name already exists", 5);
          form.setFields([
            {
              name: "groupName",
              errors: ["Group name already exists"],
            },
          ]);
        } else {
          messageApi.error(
            response.message || "Failed to update drug group",
            5
          );
          console.error("Error updating drug group:", response);
        }
      }
    } catch (errorInfo) {
      console.error("Form validation failed:", errorInfo);
      messageApi.error(
        "Failed to validate form. Please check your input and try again.",
        5
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/drug-group/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Loading drug group data..." />
      </div>
    );
  }

  if (!drugGroup) {
    return (
      <div className="p-4">
        {contextHolder}
        <div className="flex items-center gap-2 mb-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/drug-group")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <DrugGroupIcon />
          <h3 className="text-xl font-bold">Drug Group Not Found</h3>
        </div>
        <Card>
          <Text>The requested drug group could not be found or loaded.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {contextHolder}

      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(`/drug-group/${id}`)}
          >
            Back
          </Button>
          <DrugGroupIcon />
          <span className="text-xl font-bold">Edit Drug Group</span>
        </div>
      </div>

      <div className="p-6">
        <Card className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold m-0">Edit Group Information</h4>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              groupName: drugGroup.groupName,
              description: drugGroup.description || "",
              status: drugGroup.status || "Active",
            }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="groupName"
                  label="Group Name"
                  rules={[
                    { required: true, message: "Please enter group name" },
                  ]}
                >
                  <Input placeholder="Enter group name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="Status"
                  rules={[{ required: true, message: "Please select status" }]}
                >
                  <Select disabled>
                    <Option value="Active">Active</Option>
                    <Option value="Inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={4} placeholder="Enter description" />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: "24px 0" }} />

            <div className="flex justify-end gap-3 mt-4">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
              >
                Save Changes
              </Button>
            </div>
          </Form>
        </Card>

        {/* Display additional information such as created/updated dates */}
        <Card>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <div className="border rounded p-4">
                <div className="text-gray-500 text-sm mb-1">Created At</div>
                <div className="font-medium">
                  {drugGroup.createdAt
                    ? new Date(drugGroup.createdAt).toLocaleString()
                    : "-"}
                </div>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div className="border rounded p-4">
                <div className="text-gray-500 text-sm mb-1">Updated At</div>
                <div className="font-medium">
                  {drugGroup.updatedAt
                    ? new Date(drugGroup.updatedAt).toLocaleString()
                    : "-"}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default EditDrugGroup;
