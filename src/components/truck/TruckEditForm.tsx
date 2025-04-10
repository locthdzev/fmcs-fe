import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Spin,
  Select,
  Card,
  Typography,
  Upload,
  Row,
  Col,
  Space,
  Tag
} from "antd";
import { useRouter } from "next/router";
import { ArrowLeftOutlined, InboxOutlined } from "@ant-design/icons";
import { updateTruck, getTruckById, TruckUpdateRequest } from "@/api/truck";
import dayjs from "dayjs";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { TrucksIcon } from "./Icons";

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Title } = Typography;

interface TruckEditFormProps {
  truckId: string;
}

export const TruckEditForm: React.FC<TruckEditFormProps> = ({ truckId }) => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchTruckData = async () => {
      if (!truckId) return;
      setInitialLoading(true);
      setOriginalCreatedAt(null);
      try {
        const truckData = await getTruckById(truckId);
        if (truckData) {
          form.setFieldsValue({
            licensePlate: truckData.licensePlate,
            driverName: truckData.driverName || "",
            driverContact: truckData.driverContact || "",
            description: truckData.description || "",
            status: truckData.status || "Active",
          });
          
          if (truckData.truckImage) {
            setCurrentImageUrl(truckData.truckImage);
          }
          setOriginalCreatedAt(truckData.createdAt);
        } else {
          throw new Error("Invalid data received");
        }
      } catch (error: any) {
        messageApi.error(`Failed to load truck details: ${error.message || 'Unknown error'}`, 5);
        console.error("Error loading truck details:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchTruckData();
  }, [truckId, form, messageApi]);

  const handleSubmit = async () => {
    if (!originalCreatedAt) {
      messageApi.error("Original data not fully loaded. Please wait and try again.", 5);
      return;
    }
    
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formDataToSend = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'imageFile') {
          formDataToSend.append(key, value as string);
        }
      });
      
      // Preserve the original createdAt date
      formDataToSend.append("createdAt", originalCreatedAt);

      // Append the image file if it exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formDataToSend.append("imageFile", fileList[0].originFileObj);
      }

      try {
        const response = await updateTruck(truckId, formDataToSend);
        
        if (response.isSuccess) {
          messageApi.success(response.message || "Truck updated successfully", 5);
          // Navigate back to the truck detail page
          setTimeout(() => {
            router.push(`/truck/${truckId}`);
          }, 2000);
        } else {
          if (response.code === 409) {
            messageApi.error(response.message || "License plate already exists", 5);
            form.setFields([{
              name: 'licensePlate',
              errors: ['License plate already exists']
            }]);
          } else {
            messageApi.error(response.message || "Failed to update truck", 5);
            console.error("Error updating truck:", response);
          }
        }
      } catch (error: any) {
        messageApi.error(error.message || "Failed to update truck", 5);
        console.error("Error updating truck:", error);
      }
    } catch (errorInfo) {
      console.error("Form validation failed:", errorInfo);
      messageApi.error("Failed to validate form. Please check your input and try again.", 5);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/truck/${truckId}`);
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        messageApi.error('You can only upload JPG/PNG file!');
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        messageApi.error('Image must be smaller than 2MB!');
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false; // Prevent auto upload
    },
    fileList,
    onRemove: () => {
      setFileList([]);
    },
    maxCount: 1,
  };

  return (
    <div style={{ padding: "20px" }}>
      {contextHolder}
      <Card className="shadow-sm">
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleCancel}
            style={{ marginRight: "15px" }}
          >
            Back
          </Button>
          
          <TrucksIcon />
          <h3 className="text-xl font-bold">Edit Truck</h3>
        </div>
        
        <Spin spinning={initialLoading || loading} tip={initialLoading ? "Loading truck data..." : "Updating truck..."}>
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleSubmit}
            style={{ maxWidth: "800px", margin: "0 auto" }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="licensePlate"
                  label="License Plate"
                  rules={[{ required: true, message: "Please enter license plate" }]}
                >
                  <Input placeholder="Enter license plate" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="driverName"
                  label="Driver Name"
                  rules={[{ required: true, message: "Please enter driver name" }]}
                >
                  <Input placeholder="Enter driver name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="driverContact"
                  label="Driver Contact"
                  rules={[
                    { required: true, message: "Please enter driver contact" },
                    { pattern: /^[\d\s-]+$/, message: "Please enter a valid contact number" }
                  ]}
                >
                  <Input placeholder="Enter driver contact" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="Status"
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {form.getFieldValue("status") === "Active" ? (
                      <Tag color="success">Active</Tag>
                    ) : (
                      <Tag color="error">Inactive</Tag>
                    )}
                  </div>
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="description"
                  label="Description"
                >
                  <TextArea rows={3} placeholder="Enter description" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Truck Image">
              {currentImageUrl && (
                <div style={{ marginBottom: "16px" }}>
                  <Typography.Text type="secondary">Current image:</Typography.Text>
                  <div>
                    <img
                      src={currentImageUrl}
                      alt="Current Truck"
                      style={{ maxWidth: "200px", maxHeight: "200px", marginTop: "8px" }}
                    />
                  </div>
                </div>
              )}
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload new image</p>
                <p className="ant-upload-hint">
                  Support for a single image upload. Please upload JPG/PNG file only.
                </p>
              </Dragger>
            </Form.Item>

            <Form.Item>
              <Space style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Update Truck
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}; 