import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Spin,
  Upload,
  Switch,
  InputNumber
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { createCanteenItem } from "@/api/canteenitems";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";

const { TextArea } = Input;
const { Dragger } = Upload;

interface CreateCanteenItemFormProps {
  onClose: () => void;
  onCreate: () => void;
}

export const CreateCanteenItemForm: React.FC<CreateCanteenItemFormProps> = ({
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

      const itemData = {
        itemName: values.itemName,
        description: values.description || "",
        unitPrice: values.unitPrice,
        available: values.available || false,
        createdAt: new Date().toISOString(),
        status: "Active"
      };

      let imageFile: File | undefined = undefined;
      
      if (fileList.length > 0 && fileList[0].originFileObj) {
        console.log("Using image file:", {
          name: fileList[0].name,
          type: fileList[0].type,
          size: fileList[0].size
        });
        imageFile = fileList[0].originFileObj;
      }

      try {
        await createCanteenItem(itemData, imageFile);
        messageApi.success("Canteen item created successfully");
        onCreate();
        onClose();
      } catch (error: any) {
        messageApi.error(error.message || "Failed to create canteen item");
        console.error("Error creating canteen item:", error);
      }
    } catch (errorInfo) {
      console.error("Form validation failed:", errorInfo);
      messageApi.error("Failed to validate form. Please check your input and try again.");
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
      
      console.log("File selected for upload:", {
        name: uploadFile.name,
        type: uploadFile.type,
        size: uploadFile.size,
        hasOriginFileObj: !!uploadFile.originFileObj
      });
      
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

  return (
    <>
      {contextHolder}
      <Spin spinning={loading} tip="Creating canteen item...">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="itemName"
            label="Item Name"
            rules={[{ required: true, message: "Please enter item name" }]}
          >
            <Input placeholder="Enter item name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

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

          <Form.Item
            name="available"
            label="Availability"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="Available" unCheckedChildren="Out of Stock" />
          </Form.Item>

          <Form.Item label="Item Image">
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
