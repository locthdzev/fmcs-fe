import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Spin,
  Select,
  Upload,
  Space,
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

      // Log debugging information
      console.log("File list:", fileList);
      console.log("File list length:", fileList.length);
      if (fileList.length > 0) {
        console.log("File object:", fileList[0]);
        console.log("originFileObj exists:", !!fileList[0].originFileObj);
      }

      // Create FormData for the request
      const formDataToSend = new FormData();

      // Add all form values except imageFile (handled separately)
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== "imageFile") {
          formDataToSend.append(key, value as string);
        }
      });

      // Add standard fields
      formDataToSend.append("createdAt", new Date().toISOString());
      formDataToSend.append("status", "Active");

      // Important: Always append truckImage field with empty string
      formDataToSend.append("truckImage", "");

      // Append the image file if it exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formDataToSend.append("imageFile", fileList[0].originFileObj);
        console.log("Uploading file:", fileList[0].name);
        console.log("File type:", fileList[0].type);
        console.log("File size:", fileList[0].size, "bytes");
      } else {
        console.log(
          "No file selected for upload or originFileObj is undefined"
        );
        console.log("fileList details:", JSON.stringify(fileList, null, 2));
      }

      // Log the FormData content
      let formDataContent = "";
      for (const [key, value] of formDataToSend.entries()) {
        formDataContent += `${key}: ${
          value instanceof File
            ? `File (${value.name}, ${value.size} bytes)`
            : value
        }\n`;
      }
      console.log("FormData contents:\n", formDataContent);
      console.log(
        "FormData contains imageFile:",
        formDataToSend.has("imageFile")
      );

      // Create the truck with the FormData
      try {
        const response = await createTruck(formDataToSend);
        messageApi.success("Truck created successfully", 5);
        form.resetFields();
        setFileList([]);
        if (typeof onCreate === "function") {
          onCreate();
        }
        if (typeof onClose === "function") {
          onClose();
        }
      } catch (error: any) {
        messageApi.error(error.message || "Failed to create truck", 5);
        console.error("Error creating truck:", error);
      }
    } catch (errorInfo) {
      console.error("Form validation failed:", errorInfo);
      messageApi.error(
        "Failed to validate form. Please check your input and try again.",
        5
      );
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
      const isJpgOrPng =
        file.type === "image/jpeg" || file.type === "image/png";
      if (!isJpgOrPng) {
        messageApi.error("You can only upload JPG/PNG file!");
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        messageApi.error("Image must be smaller than 10MB!");
        return Upload.LIST_IGNORE;
      }

      // Create a new file list with the new file
      const newFile = {
        ...file,
        uid: file.uid,
        name: file.name,
        status: "done",
        url: URL.createObjectURL(file),
        originFileObj: file,
      } as UploadFile;

      setFileList([newFile]);
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
              {
                pattern: /^[\d\s-]+$/,
                message: "Please enter a valid contact number",
              },
            ]}
          >
            <Input placeholder="Enter driver contact" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Form.Item label="Truck Image">
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for a single image upload. Please upload JPG/PNG file
                only.
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-2 mt-4">
              <Button key="reset" htmlType="button" onClick={handleReset}>
                Reset
              </Button>
              <Button
                key="cancel"
                htmlType="button"
                onClick={() => {
                  if (typeof onClose === "function") {
                    onClose();
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                key="submit"
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Create
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Spin>
    </>
  );
};
