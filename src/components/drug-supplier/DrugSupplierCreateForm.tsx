import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Spin,
  Space,
} from "antd";
import { createDrugSupplier, DrugSupplierCreateRequest } from "@/api/drugsupplier";

interface CreateDrugSupplierFormProps {
  onClose: () => void;
  onCreate: () => void;
}

export const CreateDrugSupplierForm: React.FC<CreateDrugSupplierFormProps> = ({
  onClose,
  onCreate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const requestData: DrugSupplierCreateRequest = {
        supplierName: values.supplierName,
        contactNumber: values.contactNumber || null,
        email: values.email || null,
        address: values.address || null,
        createdAt: new Date().toISOString(),
      };

      const response = await createDrugSupplier(requestData);

      if (response.isSuccess) {
        messageApi.success(response.message || "Drug supplier created successfully", 5);
        onCreate();
        onClose();
      } else {
        if (response.code === 409) {
          messageApi.error(response.message || "Supplier name already exists", 5);
          form.setFields([{
            name: 'supplierName',
            errors: ['Supplier name already exists']
          }]);
        } else {
          messageApi.error(response.message || "Failed to create drug supplier", 5);
          console.error("Error creating drug supplier:", response);
        }
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
  };

  return (
    <>
      {contextHolder}
      <Spin spinning={loading} tip="Creating drug supplier...">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="supplierName"
            label="Supplier Name"
            rules={[{ required: true, message: "Please enter supplier name" }]}
          >
            <Input placeholder="Enter supplier name" />
          </Form.Item>

          <Form.Item
            name="contactNumber"
            label="Contact Number"
            rules={[
              { required: true, message: "Please enter contact number" },
              // Basic pattern for digits, spaces, hyphens - adjust as needed
              { pattern: /^[\d\s-]+$/, message: "Please enter a valid contact number" }
            ]}
          >
            <Input placeholder="Enter contact number" />
          </Form.Item>

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

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: "Please enter address" }]}
          >
            <Input.TextArea rows={3} placeholder="Enter address" />
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
