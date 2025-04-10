import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Space,
  Spin,
  message,
  Row,
  Col,
  Select,
  Divider,
  Tag
} from "antd";
import { getDrugSupplierById, updateDrugSupplier, DrugSupplierResponse } from "@/api/drugsupplier";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { ShopOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface DrugSupplierEditProps {
  id: string;
}

export const DrugSupplierEdit: React.FC<DrugSupplierEditProps> = ({ id }) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [supplier, setSupplier] = useState<DrugSupplierResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (id) {
      fetchSupplierDetails();
    }
  }, [id]);

  const fetchSupplierDetails = async () => {
    setLoading(true);
    try {
      const response = await getDrugSupplierById(id);
      if (response && typeof response === 'object') {
        setSupplier(response);
        form.setFieldsValue({
          supplierName: response.supplierName,
          contactNumber: response.contactNumber,
          email: response.email,
          address: response.address,
          status: response.status,
        });
      } else {
        console.error("Invalid response structure:", response);
        messageApi.error("Failed to fetch supplier details: Invalid data format");
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

  const handleUpdate = async (values: any) => {
    if (!supplier) return;
    
    setSubmitLoading(true);
    
    try {
      await updateDrugSupplier(supplier.id, values);
      messageApi.success("Drug supplier updated successfully");
      
      // Redirect back to supplier details
      setTimeout(() => {
        router.push(`/drug-supplier/${id}`);
      }, 1500);
    } catch (error) {
      console.error("Error updating drug supplier:", error);
      messageApi.error("Failed to update drug supplier");
    } finally {
      setSubmitLoading(false);
    }
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
      <div className="flex items-center gap-2 mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(`/drug-supplier/${id}`)}
          style={{ marginRight: "8px" }}
        >
          Back to Details
        </Button>
        <ShopOutlined style={{ fontSize: "24px" }} />
        <h3 className="text-xl font-bold">Edit Drug Supplier</h3>
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
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdate}
              initialValues={supplier}
            >
              <Row gutter={16}>
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
                    rules={[{ required: true, message: "Please enter contact number" }]}
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
                      { type: 'email', message: "Please enter a valid email" }
                    ]}
                  >
                    <Input placeholder="Enter email address" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: "Please select a status" }]}
                  >
                    <Select
                      placeholder="Select status"
                      options={[
                        { value: "Active", label: "Active" },
                        { value: "Inactive", label: "Inactive" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    name="address"
                    label="Address"
                    rules={[{ required: true, message: "Please enter address" }]}
                  >
                    <TextArea rows={4} placeholder="Enter address" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <div className="flex justify-end gap-2">
                <Button 
                  onClick={() => router.push(`/drug-supplier/${id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitLoading}
                >
                  Save Changes
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DrugSupplierEdit; 