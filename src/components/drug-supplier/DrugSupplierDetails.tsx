import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Row,
  Col,
  Divider,
  Form,
  Input,
  Modal,
} from "antd";
import dayjs from "dayjs";
import { 
  getDrugSupplierById, 
  DrugSupplierResponse,
  updateDrugSupplier,
  DrugSupplierUpdateRequest
} from "../../api/drugsupplier";
import {
  ArrowLeftOutlined,
  ShopOutlined,
  FormOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface DrugSupplierDetailProps {
  id: string;
}

export const DrugSupplierDetail: React.FC<DrugSupplierDetailProps> = ({
  id,
}) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [supplier, setSupplier] = useState<DrugSupplierResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSupplierDetails();
    }
  }, [id]);

  useEffect(() => {
    // Check if the edit query parameter is present and enable edit mode
    if (router.query.edit === 'true') {
      setIsEditMode(true);
    }
  }, [router.query]);

  const fetchSupplierDetails = async () => {
    setLoading(true);
    try {
      const response = await getDrugSupplierById(id);
      if (response && typeof response === "object") {
        setSupplier(response);
        // Set form initial values for when edit mode is activated
        form.setFieldsValue({
          supplierName: response.supplierName,
          contactNumber: response.contactNumber,
          email: response.email,
          address: response.address,
        });
      } else {
        console.error("Invalid response structure:", response);
        messageApi.error(
          "Failed to fetch supplier details: Invalid data format"
        );
        setSupplier(null);
      }
    } catch (error) {
      console.error("Error fetching supplier details:", error);
      messageApi.error("Failed to fetch supplier details");
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return dayjs(date).format("DD/MM/YYYY HH:mm:ss");
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "error";
      default:
        return "default";
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    if (supplier) {
      form.setFieldsValue({
        supplierName: supplier.supplierName,
        contactNumber: supplier.contactNumber,
        email: supplier.email,
        address: supplier.address,
      });
    }
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!supplier) return;
    
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      
      const updateData: DrugSupplierUpdateRequest = {
        supplierName: values.supplierName,
        contactNumber: values.contactNumber,
        email: values.email,
        address: values.address,
        status: supplier.status,
        createdAt: supplier.createdAt,
      };
      
      const response = await updateDrugSupplier(id, updateData);
      
      if (response.isSuccess) {
        messageApi.success("Drug supplier updated successfully");
        setIsEditMode(false);
        // Refresh data
        fetchSupplierDetails();
      } else {
        if (response.code === 409) {
          messageApi.error("Supplier name already exists");
          form.setFields([{
            name: 'supplierName',
            errors: ['Supplier name already exists']
          }]);
        } else {
          messageApi.error(response.message || "Failed to update drug supplier");
        }
      }
    } catch (error) {
      console.error("Form validation failed:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderActionButtons = () => {
    if (!supplier) return null;
    
    if (isEditMode) {
      return (
        <Space>
          <Button 
            icon={<CloseOutlined />} 
            onClick={handleCancelEdit}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSave}
            loading={submitLoading}
          >
            Save
          </Button>
        </Space>
      );
    }
    
    return (
      <Button
        type="primary"
        icon={<FormOutlined />}
        onClick={handleEdit}
      >
        Edit Drug Supplier
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Loading supplier details..." />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-4">
        {contextHolder}
        <div className="flex items-center gap-2 mb-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/drug-supplier")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <ShopOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Supplier Not Found</h3>
        </div>
        <Card>
          <Text>The requested drug supplier could not be found or loaded.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      {contextHolder}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/drug-supplier")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <ShopOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Drug Supplier Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title={<Title level={5}>Supplier Information</Title>}
            extra={
              <Tag color={getStatusColor(supplier.status)}>
                {supplier.status ? supplier.status.toUpperCase() : ""}
              </Tag>
            }
          >
            {isEditMode ? (
              <Form form={form} layout="vertical">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="supplierName"
                      label="Supplier Name"
                      rules={[{ required: true, message: "Please enter supplier name" }]}
                    >
                      <Input placeholder="Enter supplier name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="contactNumber"
                      label="Contact Number"
                      rules={[
                        { required: true, message: "Please enter contact number" },
                        { pattern: /^[\d\s-]+$/, message: "Please enter a valid contact number" }
                      ]}
                    >
                      <Input placeholder="Enter contact number" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: "Please enter email" },
                        { type: "email", message: "Please enter a valid email" }
                      ]}
                    >
                      <Input placeholder="Enter email" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="address"
                      label="Address"
                      rules={[{ required: true, message: "Please enter address" }]}
                    >
                      <TextArea rows={3} placeholder="Enter address" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            ) : (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div className="border rounded-md p-3">
                    <Text strong className="block text-sm text-gray-500">
                      Supplier Name
                    </Text>
                    <Text className="block">{supplier.supplierName || "-"}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="border rounded-md p-3">
                    <Text strong className="block text-sm text-gray-500">
                      Contact Number
                    </Text>
                    <Text className="block">{supplier.contactNumber || "-"}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="border rounded-md p-3">
                    <Text strong className="block text-sm text-gray-500">
                      Email
                    </Text>
                    <Text className="block">{supplier.email || "-"}</Text>
                  </div>
                </Col>
                <Col xs={24}>
                  <div className="border rounded-md p-3">
                    <Text strong className="block text-sm text-gray-500">
                      Address
                    </Text>
                    <Text className="block">{supplier.address || "-"}</Text>
                  </div>
                </Col>

                <Col xs={24}>
                  <Divider style={{ margin: "8px 0" }} />
                </Col>

                <Col xs={24} sm={12}>
                  <div className="border rounded-md p-3">
                    <Text strong className="block text-sm text-gray-500">
                      Created At
                    </Text>
                    <Text className="block">
                      {formatDate(supplier.createdAt)}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="border rounded-md p-3">
                    <Text strong className="block text-sm text-gray-500">
                      Updated At
                    </Text>
                    <Text className="block">
                      {formatDate(supplier.updatedAt)}
                    </Text>
                  </div>
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DrugSupplierDetail;
