import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Spin,
} from "antd";
import { createDrugGroup, DrugGroupCreateRequest } from "@/api/druggroup";

interface CreateDrugGroupFormProps {
  onClose: () => void;
  onCreate: () => void;
}

export const CreateDrugGroupForm: React.FC<CreateDrugGroupFormProps> = ({
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

      const requestData: DrugGroupCreateRequest = {
        groupName: values.groupName,
        description: values.description || null,
        createdAt: new Date().toISOString(),
        status: "Active",
      };

      const response = await createDrugGroup(requestData);

      if (response.isSuccess) {
        messageApi.success(response.message || "Drug group created successfully", 5);
        onCreate();
        onClose();
      } else {
        if (response.code === 409) {
          messageApi.error(response.message || "Group name already exists", 5);
          form.setFields([{
            name: 'groupName',
            errors: ['Group name already exists']
          }]);
        } else {
          messageApi.error(response.message || "Failed to create drug group", 5);
          console.error("Error creating drug group:", response);
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
      <Spin spinning={loading} tip="Creating drug group...">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="groupName"
            label="Group Name"
            rules={[{ required: true, message: "Please enter group name" }]}
          >
            <Input placeholder="Enter group name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} placeholder="Enter description" />
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
