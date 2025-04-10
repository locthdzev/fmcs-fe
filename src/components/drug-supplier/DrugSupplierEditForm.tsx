import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Spin,
  Select,
} from "antd";
import {
  updateDrugSupplier,
  getDrugSupplierById,
  DrugSupplierUpdateRequest,
  DrugSupplierResponse,
} from "@/api/drugsupplier";
import dayjs from 'dayjs';

const { Option } = Select;

interface EditDrugSupplierFormProps {
  drugSupplierId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditDrugSupplierForm: React.FC<EditDrugSupplierFormProps> = ({
  drugSupplierId,
  onClose,
  onUpdate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchData = async () => {
      if (!drugSupplierId) return;
      setInitialLoading(true);
      setOriginalCreatedAt(null);
      try {
        const response = await getDrugSupplierById(drugSupplierId);
        let drugSupplierData: DrugSupplierResponse | null = null;
        if (response && response.isSuccess && response.data) {
          drugSupplierData = response.data as DrugSupplierResponse;
        } else if (response && typeof response === 'object' && response.supplierName) {
          drugSupplierData = response as DrugSupplierResponse;
        } else {
          throw new Error(response?.message || "Invalid data received");
        }

        if (drugSupplierData) {
          form.setFieldsValue({
            supplierName: drugSupplierData.supplierName,
            contactNumber: drugSupplierData.contactNumber,
            email: drugSupplierData.email,
            address: drugSupplierData.address,
            status: drugSupplierData.status || "Active",
          });
          setOriginalCreatedAt(drugSupplierData.createdAt);
          setOriginalStatus(drugSupplierData.status || "Active");
        }
      } catch (error: any) {
        messageApi.error(`Failed to load drug supplier details: ${error.message || 'Unknown error'}`, 5);
        console.error("Error loading drug supplier details:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [drugSupplierId, form, messageApi]);

  const handleSubmit = async () => {
    if (!originalCreatedAt || !originalStatus) {
      messageApi.error("Original data not fully loaded. Please wait and try again.", 5);
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      const requestData: DrugSupplierUpdateRequest = {
        supplierName: values.supplierName,
        contactNumber: values.contactNumber || null,
        email: values.email || null,
        address: values.address || null,
        status: originalStatus,
        createdAt: originalCreatedAt,
      };

      const response = await updateDrugSupplier(drugSupplierId, requestData);

      if (response.isSuccess) {
        messageApi.success(response.message || "Drug supplier updated successfully", 5);
        onUpdate();
        onClose();
      } else {
        if (response.code === 409) {
          messageApi.error(response.message || "Supplier name already exists", 5);
          form.setFields([{
            name: 'supplierName',
            errors: ['Supplier name already exists']
          }]);
        } else {
          messageApi.error(response.message || "Failed to update drug supplier", 5);
          console.error("Error updating drug supplier:", response);
        }
      }
    } catch (errorInfo) {
      console.error("Form validation failed:", errorInfo);
      messageApi.error("Failed to validate form. Please check your input and try again.", 5);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Spin spinning={initialLoading || loading} tip={initialLoading ? "Loading supplier data..." : "Updating supplier..."}>
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
          
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select placeholder="Select status" disabled>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-2 mt-4">
              <Button key="cancel" htmlType="button" onClick={onClose}>
                Cancel
              </Button>
              <Button key="submit" type="primary" htmlType="submit" loading={loading}>
                Update
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Spin>
    </>
  );
};
