import React, { useEffect, useState } from "react";
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
import { createDrug } from "@/api/drug";
import { getDrugGroups } from "@/api/druggroup";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";

const { TextArea } = Input;
const { Dragger } = Upload;

interface DrugGroup {
  id: string;
  groupName: string;
  status: string;
}

interface CreateDrugFormProps {
  onClose: () => void;
  onCreate: () => void;
}

export const CreateDrugForm: React.FC<CreateDrugFormProps> = ({
  onClose,
  onCreate,
}) => {
  const [form] = Form.useForm();
  const [drugGroups, setDrugGroups] = useState<DrugGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    const fetchDrugGroups = async () => {
      try {
        const response = await getDrugGroups();
        // Check if the response is an object with data property
        if (response && typeof response === 'object') {
          // Check if response has a data property that is an array
          if (response.data && Array.isArray(response.data)) {
            setDrugGroups(response.data);
          } 
          // Check if response itself is an array
          else if (Array.isArray(response)) {
            setDrugGroups(response);
          }
          // Check if items property exists and is an array (common pagination structure)
          else if (response.items && Array.isArray(response.items)) {
            setDrugGroups(response.items);
          }
          else {
            console.error("Unexpected response format:", response);
            messageApi.error("Failed to load drug groups: Unexpected data format", 5);
            setDrugGroups([]);
          }
        } else {
          console.error("Invalid response:", response);
          messageApi.error("Failed to load drug groups: Invalid response", 5);
          setDrugGroups([]);
        }
      } catch (error) {
        console.error("Error fetching drug groups:", error);
        messageApi.error("Failed to load drug groups", 5);
        setDrugGroups([]);
      }
    };
    fetchDrugGroups();
  }, [messageApi]);

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
      
      // Thêm ImageUrl vào FormData - trường không thể thiếu khi gửi lên server
      formDataToSend.append("ImageUrl", "");

      // Kiểm tra và thêm file nếu có
      if (fileList.length > 0) {
        console.log("FileList details:", {
          file: fileList[0],
          hasOriginFileObj: !!fileList[0].originFileObj,
          fileType: fileList[0].type,
          fileSize: fileList[0].size,
          fileKeys: Object.keys(fileList[0])
        });
        
        // Kiểm tra xem file có originFileObj không
        if (fileList[0].originFileObj) {
          console.log("Adding file from originFileObj");
          formDataToSend.append("imageFile", fileList[0].originFileObj);
        } else {
          console.warn("File selected but no originFileObj found");
          messageApi.warning("Could not process the selected file");
        }
      } else {
        console.log("No image file to upload");
      }

      // Debug formData
      console.log("FormData entries to be sent:");
      for (let pair of formDataToSend.entries()) {
        const value = pair[1];
        console.log(`${pair[0]}: ${value instanceof File ? 
          `File (${(value as File).name}, ${(value as File).type}, ${(value as File).size} bytes)` : 
          value}`);
      }

      try {
        await createDrug(formDataToSend);
        messageApi.success("Drug created successfully", 5);
        onCreate();
        onClose();
      } catch (error: any) {
        messageApi.error(error.message || "Failed to create drug", 5);
        console.error("Error creating drug:", error);
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

  const drugGroupOptions = drugGroups
    .filter((group) => group.status === "Active")
    .map((group) => ({
      value: group.id,
      label: group.groupName,
    }));

  return (
    <>
      {contextHolder}
      <Spin spinning={loading} tip="Creating drug...">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="drugGroupId"
            label="Drug Group"
            rules={[{ required: true, message: "Please select a drug group" }]}
          >
            <Select
              showSearch
              placeholder="Search to Select Drug Group"
              optionFilterProp="label"
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? "")
                  .toLowerCase()
                  .localeCompare((optionB?.label ?? "").toLowerCase())
              }
              options={drugGroupOptions}
            />
          </Form.Item>

          <Form.Item
            name="drugCode"
            label="Drug Code"
            rules={[{ required: true, message: "Please enter drug code" }]}
          >
            <Input placeholder="Enter drug code" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter drug name" }]}
          >
            <Input placeholder="Enter drug name" />
          </Form.Item>

          <Form.Item
            name="unit"
            label="Unit"
            rules={[{ required: true, message: "Please enter unit" }]}
          >
            <Input placeholder="Enter unit (e.g., pill, bottle)" />
          </Form.Item>

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

          <Form.Item
            name="manufacturer"
            label="Manufacturer"
            rules={[{ required: true, message: "Please enter manufacturer" }]}
          >
            <Input placeholder="Enter manufacturer" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Form.Item label="Drug Image">
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
