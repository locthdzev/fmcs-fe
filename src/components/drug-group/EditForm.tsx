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
  updateDrugGroup,
  getDrugGroupById,
  DrugGroupUpdateRequest,
  DrugGroupResponse,
} from "@/api/druggroup";

const { Option } = Select;

interface EditDrugGroupFormProps {
  drugGroupId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditDrugGroupForm: React.FC<EditDrugGroupFormProps> = ({
  drugGroupId,
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
      if (!drugGroupId) return;
      setInitialLoading(true);
      setOriginalCreatedAt(null);
      try {
        const groupData = await getDrugGroupById(drugGroupId);
        let drugGroupData: DrugGroupResponse | null = null;
        
        if (groupData && typeof groupData === 'object' && groupData.groupName) {
          drugGroupData = groupData as DrugGroupResponse;
        } else {
          throw new Error("Invalid data received");
        }

        if (drugGroupData) {
          form.setFieldsValue({
            groupName: drugGroupData.groupName,
            description: drugGroupData.description || "",
            status: drugGroupData.status || "Active",
          });
          setOriginalCreatedAt(drugGroupData.createdAt);
          setOriginalStatus(drugGroupData.status || "Active");
        }
      } catch (error: any) {
        messageApi.error(`Failed to load drug group details: ${error.message || 'Unknown error'}`, 5);
        console.error("Error loading drug group details:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [drugGroupId, form, messageApi]);

  const handleSubmit = async () => {
    if (!originalCreatedAt || !originalStatus) {
      messageApi.error("Original data not fully loaded. Please wait and try again.", 5);
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      const requestData: DrugGroupUpdateRequest = {
        groupName: values.groupName,
        description: values.description || "",
        createdAt: originalCreatedAt,
        updatedAt: new Date().toISOString(),
        status: originalStatus,
      };

      const response = await updateDrugGroup(drugGroupId, requestData);

      if (response.isSuccess) {
        messageApi.success(response.message || "Drug group updated successfully", 5);
        onUpdate();
        onClose();
      } else {
        if (response.code === 409) {
          messageApi.error(response.message || "Group name already exists", 5);
          form.setFields([{
            name: 'groupName',
            errors: ['Group name already exists']
          }]);
        } else {
          messageApi.error(response.message || "Failed to update drug group", 5);
          console.error("Error updating drug group:", response);
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
      <Spin spinning={initialLoading || loading} tip={initialLoading ? "Loading group data..." : "Updating group..."}>
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
