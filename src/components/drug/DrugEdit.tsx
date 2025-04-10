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
  Upload,
  Divider,
  Tag
} from "antd";
import { getDrugById, updateDrug, DrugResponse } from "@/api/drug";
import { getDrugGroups } from "@/api/druggroup";
import { ArrowLeftOutlined, InboxOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { DrugIcon } from "./Icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

interface DrugEditProps {
  id: string;
}

export const DrugEdit: React.FC<DrugEditProps> = ({ id }) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [drug, setDrug] = useState<DrugResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [drugGroups, setDrugGroups] = useState<any[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDrugDetails();
      fetchDrugGroups();
    }
  }, [id]);

  const fetchDrugGroups = async () => {
    try {
      const data = await getDrugGroups();
      setDrugGroups(data);
    } catch (error) {
      messageApi.error("Failed to load drug groups");
    }
  };

  const fetchDrugDetails = async () => {
    setLoading(true);
    try {
      const response = await getDrugById(id);
      if (response && typeof response === 'object') {
        setDrug(response);
        form.setFieldsValue({
          drugCode: response.drugCode,
          name: response.name,
          unit: response.unit,
          price: response.price,
          drugGroupId: response.drugGroup?.id,
          manufacturer: response.manufacturer,
          description: response.description,
        });
        
        if (response.imageUrl) {
          setImageUrl(response.imageUrl);
        }
      } else {
        messageApi.error("Failed to fetch drug details: Invalid data format");
        setDrug(null);
      }
    } catch (error) {
      console.error("Error fetching drug details:", error);
      messageApi.error("Failed to fetch drug details");
      setDrug(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values: any) => {
    if (!drug) return;
    
    setSubmitLoading(true);
    
    try {
      const formData = new FormData();
      
      // Append form values
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'imageFile') {
          formData.append(key, value as string);
        }
      });
      
      // Keep the original status
      formData.append("status", drug.status || "");
      
      // Append image if a new one was uploaded
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("imageFile", fileList[0].originFileObj);
      }
      
      await updateDrug(drug.id, formData);
      messageApi.success("Drug updated successfully");
      
      // Redirect back to drug details
      setTimeout(() => {
        router.push(`/drug/${id}`);
      }, 1500);
    } catch (error) {
      console.error("Error updating drug:", error);
      messageApi.error("Failed to update drug");
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Loading drug details..." />
      </div>
    );
  }

  if (!drug) {
    return (
      <div className="p-4">
        {contextHolder}
        <div className="flex items-center gap-2 mb-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/drug")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <DrugIcon />
          <h3 className="text-xl font-bold">Drug Not Found</h3>
        </div>
        <Card>
          <Text>The requested drug could not be found or loaded.</Text>
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
          onClick={() => router.push(`/drug/${id}`)}
          style={{ marginRight: "8px" }}
        >
          Back to Details
        </Button>
        <DrugIcon />
        <h3 className="text-xl font-bold">Edit Drug</h3>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card 
            title={<Title level={5}>Drug Information</Title>}
            extra={
              <Tag color={getStatusColor(drug.status)}>
                {drug.status ? drug.status.toUpperCase() : ""}
              </Tag>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdate}
              initialValues={drug}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="drugCode"
                    label="Drug Code"
                    rules={[{ required: true, message: "Please enter drug code" }]}
                  >
                    <Input placeholder="Enter drug code" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="name"
                    label="Name"
                    rules={[{ required: true, message: "Please enter drug name" }]}
                  >
                    <Input placeholder="Enter drug name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="unit"
                    label="Unit"
                    rules={[{ required: true, message: "Please enter unit" }]}
                  >
                    <Input placeholder="Enter unit (e.g., pill, bottle)" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="price"
                    label="Price"
                    rules={[{ required: true, message: "Please enter price" }]}
                  >
                    <Input
                      type="number"
                      placeholder="Enter price"
                      suffix="VND"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="drugGroupId"
                    label="Drug Group"
                    rules={[{ required: true, message: "Please select a drug group" }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select Drug Group"
                      optionFilterProp="label"
                      filterSort={(optionA, optionB) =>
                        (optionA?.label ?? "")
                          .toLowerCase()
                          .localeCompare((optionB?.label ?? "").toLowerCase())
                      }
                      options={drugGroups
                        .filter(group => group.status === "Active")
                        .map(group => ({
                          value: group.id,
                          label: group.groupName,
                        }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="manufacturer"
                    label="Manufacturer"
                    rules={[{ required: true, message: "Please enter manufacturer" }]}
                  >
                    <Input placeholder="Enter manufacturer" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Description"
                  >
                    <TextArea rows={4} placeholder="Enter description" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <div className="flex justify-end gap-2">
                <Button 
                  onClick={() => router.push(`/drug/${id}`)}
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
        <Col xs={24} md={8}>
          <Card title={<Title level={5}>Drug Image</Title>}>
            {imageUrl && !fileList.length ? (
              <div className="mb-4">
                <Text className="block mb-2">Current Image:</Text>
                <div className="flex justify-center">
                  <img
                    src={imageUrl}
                    alt={drug.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      objectFit: "contain",
                    }}
                  />
                </div>
                <div className="mt-4 text-center">
                  <Text type="secondary">Upload a new image below to replace this one</Text>
                </div>
              </div>
            ) : null}

            <Form.Item label={fileList.length ? "New Image" : "Upload Image"}>
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                  Support for a single image upload. Please upload JPG/PNG file only.
                </p>
              </Dragger>
            </Form.Item>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DrugEdit; 