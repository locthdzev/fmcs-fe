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
  Tag,
  Switch,
  InputNumber
} from "antd";
import { getCanteenItem, updateCanteenItem, CanteenItemResponse } from "@/api/canteenitems";
import { ArrowLeftOutlined, InboxOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { CanteenItemIcon } from "./Icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

interface CanteenItemEditProps {
  id: string;
}

export const CanteenItemEdit: React.FC<CanteenItemEditProps> = ({ id }) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [canteenItem, setCanteenItem] = useState<CanteenItemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCanteenItemDetails();
    }
  }, [id]);

  const fetchCanteenItemDetails = async () => {
    setLoading(true);
    try {
      const response = await getCanteenItem(id);
      if (response && typeof response === 'object') {
        setCanteenItem(response);
        form.setFieldsValue({
          itemName: response.itemName,
          description: response.description,
          unitPrice: response.unitPrice,
          available: response.available,
        });
        
        if (response.imageUrl) {
          setImageUrl(response.imageUrl);
        }
      } else {
        messageApi.error("Failed to fetch canteen item details: Invalid data format");
        setCanteenItem(null);
      }
    } catch (error) {
      console.error("Error fetching canteen item details:", error);
      messageApi.error("Failed to fetch canteen item details");
      setCanteenItem(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values: any) => {
    if (!canteenItem) return;
    
    setSubmitLoading(true);
    
    try {
      // Tạo đối tượng DTO thay vì FormData
      const updateData: any = {
        itemName: values.itemName,
        description: values.description || "",
        unitPrice: values.unitPrice,
        available: values.available,
        updatedAt: new Date().toISOString(),
        status: canteenItem.status || "Active"
      };
      
      let imageFile: File | undefined = undefined;
      
      // Kiểm tra và chuẩn bị file
      if (fileList.length > 0) {
        console.log("FileList details:", {
          file: fileList[0],
          hasOriginFileObj: !!fileList[0].originFileObj,
          fileType: fileList[0].type,
          fileSize: fileList[0].size, 
          fileKeys: Object.keys(fileList[0])
        });
        
        // Trường hợp 1: File mới upload (có originFileObj)
        if (fileList[0].originFileObj) {
          console.log("Using originFileObj");
          imageFile = fileList[0].originFileObj;
          
          // Gọi API update với file
          await updateCanteenItem(canteenItem.id, updateData, imageFile);
          messageApi.success("Canteen item updated successfully");
          
          // Redirect sau khi update
          setTimeout(() => {
            router.push(`/canteen-item/${id}`);
          }, 1500);
        }
        // Trường hợp 2: File không có originFileObj nhưng có url
        else if (fileList[0].url || fileList[0].thumbUrl) {
          console.log("Trying to fetch file from URL");
          try {
            const response = await fetch(fileList[0].url || fileList[0].thumbUrl || "");
            const blob = await response.blob();
            imageFile = new File([blob], fileList[0].name || "image.jpg", { type: blob.type });
            
            console.log("Created file from URL:", {
              name: imageFile.name,
              type: imageFile.type,
              size: imageFile.size
            });
            
            // Gọi API update với file
            await updateCanteenItem(canteenItem.id, updateData, imageFile);
            messageApi.success("Canteen item updated successfully");
            
            // Redirect sau khi update
            setTimeout(() => {
              router.push(`/canteen-item/${id}`);
            }, 1500);
          } catch (error) {
            console.error("Error fetching image:", error);
            messageApi.error("Failed to process image");
          }
        }
        // Trường hợp 3: Có file trong fileList nhưng không thể xử lý
        else {
          console.warn("File in fileList cannot be processed");
          messageApi.warning("Cannot process the selected image file");
          
          // Vẫn tiếp tục update các thông tin khác không bao gồm ảnh
          await updateCanteenItem(canteenItem.id, updateData);
          messageApi.success("Canteen item updated successfully (without new image)");
          
          // Redirect sau khi update
          setTimeout(() => {
            router.push(`/canteen-item/${id}`);
          }, 1500);
        }
      } 
      // Không có file mới
      else {
        console.log("No new image file to upload");
        
        // Gọi API update không có file
        await updateCanteenItem(canteenItem.id, updateData);
        messageApi.success("Canteen item updated successfully");
        
        // Redirect sau khi update
        setTimeout(() => {
          router.push(`/canteen-item/${id}`);
        }, 1500);
      }
      
    } catch (error) {
      console.error("Error updating canteen item:", error);
      messageApi.error("Failed to update canteen item");
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
      
      // Tạo một file mới từ file ban đầu để đảm bảo nó có thể được sử dụng
      const newFile = new File([file], file.name, { type: file.type });
      
      // Tạo đối tượng upload file
      const uploadFile = {
        uid: Date.now().toString(),
        name: newFile.name,
        size: newFile.size,
        type: newFile.type,
        originFileObj: newFile  // Thêm trường originFileObj
      } as UploadFile;
      
      console.log("File selected with details:", {
        name: uploadFile.name,
        type: uploadFile.type,
        size: uploadFile.size,
        hasOriginFileObj: !!uploadFile.originFileObj
      });
      
      // Thêm vào fileList
      setFileList([uploadFile]);
      
      return false; // Prevent auto upload
    },
    fileList,
    onRemove: () => {
      console.log("File removed from list");
      setFileList([]);
    },
    maxCount: 1,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Loading canteen item details..." />
      </div>
    );
  }

  if (!canteenItem) {
    return (
      <div className="p-4">
        {contextHolder}
        <div className="flex items-center gap-2 mb-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/canteen-items")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <CanteenItemIcon />
          <h3 className="text-xl font-bold">Canteen Item Not Found</h3>
        </div>
        <Card>
          <Text>The requested canteen item could not be found or loaded.</Text>
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
          onClick={() => router.push(`/canteen-item/${id}`)}
          style={{ marginRight: "8px" }}
        >
          Back to Details
        </Button>
        <CanteenItemIcon />
        <h3 className="text-xl font-bold">Edit Canteen Item</h3>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card 
            title={<Title level={5}>Item Information</Title>}
            extra={
              <Tag color={getStatusColor(canteenItem.status)}>
                {canteenItem.status ? canteenItem.status.toUpperCase() : ""}
              </Tag>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdate}
              initialValues={canteenItem}
            >
              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item
                    name="itemName"
                    label="Item Name"
                    rules={[{ required: true, message: "Please enter item name" }]}
                  >
                    <Input placeholder="Enter item name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="unitPrice"
                    label="Price"
                    rules={[
                      { required: true, message: "Please enter price" },
                      { type: 'number', min: 0, message: "Price must be a positive number" }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="Enter price"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value?.replace(/\$\s?|(,*)/g, '') || ''}
                      suffix="VND"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="available"
                    label="Availability"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Available" unCheckedChildren="Out of Stock" />
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
                  onClick={() => router.push(`/canteen-item/${id}`)}
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
          <Card title={<Title level={5}>Item Image</Title>}>
            {imageUrl && !fileList.length ? (
              <div className="mb-4">
                <Text className="block mb-2">Current Image:</Text>
                <div className="flex justify-center">
                  <img
                    src={imageUrl}
                    alt={canteenItem.itemName}
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
              <Dragger 
                {...uploadProps} 
                name="imageFile"
                accept="image/png,image/jpeg"
              >
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

export default CanteenItemEdit; 