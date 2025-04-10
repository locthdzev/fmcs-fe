import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Spin,
  Select,
  Upload,
  Space
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { createTruck } from "@/api/truck";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";

const { TextArea } = Input;
const { Dragger } = Upload;

interface CreateTruckFormProps {
  onClose: () => void;
  onCreate: () => void;
}

export const CreateTruckForm: React.FC<CreateTruckFormProps> = ({
  onClose,
  onCreate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formDataToSend = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'imageFile') {
          formDataToSend.append(key, value as string);
        }
      });

      formDataToSend.append("status", "Active");
      formDataToSend.append("createdAt", new Date().toISOString());

      // Append the image file if it exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formDataToSend.append("imageFile", fileList[0].originFileObj);
      }

      try {
        const response = await createTruck(formDataToSend);
        messageApi.success("Truck created successfully", 5);
        onCreate();
        onClose();
      } catch (error: any) {
        messageApi.error(error.message || "Failed to create truck", 5);
        console.error("Error creating truck:", error);
      }
    } catch (errorInfo) {
      console.error("Form validation failed:", errorInfo);
      messageApi.error("Failed to validate form. Please check your input and try again.", 5);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setFileList([]);
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
    <>
      {contextHolder}
      <Spin spinning={loading} tip="Creating truck...">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="licensePlate"
            label="License Plate"
            rules={[{ required: true, message: "Please enter license plate" }]}
          >
            <Input placeholder="Enter license plate" />
          </Form.Item>

          <Form.Item
            name="driverName"
            label="Driver Name"
            rules={[{ required: true, message: "Please enter driver name" }]}
          >
            <Input placeholder="Enter driver name" />
          </Form.Item>

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

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Form.Item label="Truck Image">
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

          <Form.Item>
            <div className="flex justify-end gap-2 mt-4">
              <Button key="reset" htmlType="button" onClick={handleReset}>
                Reset
              </Button>
              <Button key="submit" type="primary" htmlType="submit" loading={loading}>
                Create
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Spin>
    </>
  );
};
