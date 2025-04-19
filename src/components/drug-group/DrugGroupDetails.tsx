import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Card,
  Typography,
  Tag,
  Button,
  Spin,
  message,
  Row,
  Col,
  Divider,
  Form,
  Input,
  Select,
} from "antd";
import dayjs from "dayjs";
import {
  getDrugGroupById,
  DrugGroupResponse,
  DrugGroupExportConfig,
  updateDrugGroup,
  DrugGroupUpdateRequest,
} from "@/api/druggroup";
import {
  ArrowLeftOutlined,
  FormOutlined,
  FileExcelOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { DrugGroupIcon } from "./Icons";
import ExportConfigModal, {
  DrugGroupExportConfigWithUI,
} from "./ExportConfigModal";
import { DrugGroupAdvancedFilters } from "./DrugGroupFilterModal";

const { Text } = Typography;
const { Option } = Select;

interface DrugGroupDetailsProps {
  id: string;
  initialData?: DrugGroupResponse | null;
}

export const DrugGroupDetails: React.FC<DrugGroupDetailsProps> = ({
  id,
  initialData,
}) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [drugGroup, setDrugGroup] = useState<DrugGroupResponse | null>(
    initialData || null
  );
  const [loading, setLoading] = useState(!initialData);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportConfig, setExportConfig] = useState<DrugGroupExportConfigWithUI>(
    {
      exportAllPages: false,
      includeGroupName: true,
      includeDescription: true,
      includeCreatedAt: true,
      includeUpdatedAt: true,
      includeStatus: true,
    }
  );

  useEffect(() => {
    console.log("DrugGroupDetails component mounted with id:", id);
    console.log("Initial data provided:", initialData);

    if (!initialData) {
      if (id) {
        fetchData();
      } else if (router.query.id && typeof router.query.id === "string") {
        // Fallback for older component usage without explicit id prop
        fetchData(router.query.id);
      }
    }
    
    // Check if edit mode is requested via URL query parameter
    if (router.query.edit === 'true') {
      setIsEditing(true);
    }
  }, [id, router.query.id, router.query.edit, initialData]);

  const fetchData = async (dataId?: string) => {
    const idToUse = dataId || id;
    if (!idToUse) return;

    setLoading(true);
    try {
      console.log("Fetching drug group with ID:", idToUse);
      const response = await getDrugGroupById(idToUse);
      console.log("API Response:", response);

      // Kiểm tra cấu trúc dữ liệu trả về từ API
      let groupData;
      if (response && response.data) {
        groupData = response.data;
      } else if (response && typeof response === "object") {
        groupData = response;
      } else {
        console.error("Unexpected API response structure:", response);
        messageApi.error("Unexpected API response structure");
        setDrugGroup(null);
        return;
      }

      console.log("Processed Drug Group Data:", groupData);
      setDrugGroup(groupData);
      
      // Initialize form with data
      form.setFieldsValue({
        groupName: groupData.groupName,
        description: groupData.description || "",
        status: groupData.status || "Active",
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      messageApi.error("Failed to fetch drug group data");
      setDrugGroup(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportConfigChange = (
    values: Partial<DrugGroupExportConfigWithUI>
  ) => {
    setExportConfig((prev) => ({ ...prev, ...values }));
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
  };
  
  const toggleEdit = () => {
    if (!isEditing && drugGroup) {
      // Set form values when entering edit mode
      form.setFieldsValue({
        groupName: drugGroup.groupName,
        description: drugGroup.description || "",
        status: drugGroup.status || "Active",
      });
    }
    setIsEditing(!isEditing);
  };
  
  const handleSave = async () => {
    if (!drugGroup) return;
    
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      const requestData: DrugGroupUpdateRequest = {
        groupName: values.groupName,
        description: values.description || "",
        createdAt: drugGroup.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: values.status || drugGroup.status || "Active",
      };
      
      const currentId = id || (router.query.id as string);
      const response = await updateDrugGroup(currentId, requestData);
      
      if (response.isSuccess) {
        messageApi.success(response.message || "Drug group updated successfully");
        // Refresh data after update
        fetchData(currentId);
        setIsEditing(false);
      } else {
        if (response.code === 409) {
          messageApi.error(response.message || "Group name already exists");
          form.setFields([
            {
              name: "groupName",
              errors: ["Group name already exists"],
            },
          ]);
        } else {
          messageApi.error(response.message || "Failed to update drug group");
          console.error("Error updating drug group:", response);
        }
      }
    } catch (errorInfo) {
      console.error("Form validation failed:", errorInfo);
      messageApi.error("Failed to validate form. Please check your input and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Loading drug group details..." />
      </div>
    );
  }

  if (!drugGroup) {
    return (
      <div className="p-4">
        {contextHolder}
        <div className="flex items-center gap-2 mb-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/drug-group")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <DrugGroupIcon />
          <h3 className="text-xl font-bold">Drug Group Not Found</h3>
        </div>
        <Card>
          <Text>The requested drug group could not be found or loaded.</Text>
        </Card>
      </div>
    );
  }

  // Display the raw data in development mode
  if (drugGroup) {
    console.log("Rendering with drug group:", drugGroup);
  }

  return (
    <div>
      {contextHolder}

      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/drug-group")}
          >
            Back
          </Button>
          <DrugGroupIcon />
          <span className="text-xl font-bold">Drug Group Details</span>
        </div>
        <div className="space-x-2">
          {isEditing ? (
            <>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={submitting}
              >
                Save
              </Button>
              <Button 
                icon={<CloseOutlined />}
                onClick={toggleEdit}
                disabled={submitting}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              icon={<FormOutlined />}
              onClick={toggleEdit}
            >
              Edit Drug Group
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        <Card className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold m-0">Group Information</h4>
            {!isEditing && (
              <Tag color={drugGroup.status === "Active" ? "success" : "error"}>
                {drugGroup.status?.toUpperCase()}
              </Tag>
            )}
          </div>

          {isEditing ? (
            <Form form={form} layout="vertical">
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="groupName"
                    label="Group Name"
                    rules={[{ required: true, message: "Please enter group name" }]}
                  >
                    <Input placeholder="Enter group name" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="status"
                    label="Status"
                  >
                    <Select>
                      <Option value="Active">Active</Option>
                      <Option value="Inactive">Inactive</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Description"
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="Enter description"
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider style={{ margin: "24px 0" }} />
              
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <div className="border rounded p-4">
                    <div className="text-gray-500 text-sm mb-1">Created At</div>
                    <div className="font-medium">
                      {formatDate(drugGroup.createdAt)}
                    </div>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div className="border rounded p-4">
                    <div className="text-gray-500 text-sm mb-1">Updated At</div>
                    <div className="font-medium">
                      {formatDate(drugGroup.updatedAt)}
                    </div>
                  </div>
                </Col>
              </Row>
            </Form>
          ) : (
            <>
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <div className="border rounded p-4">
                    <div className="text-gray-500 text-sm mb-1">Group Name</div>
                    <div className="font-medium">{drugGroup.groupName}</div>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div className="border rounded p-4">
                    <div className="text-gray-500 text-sm mb-1">Description</div>
                    <div className="font-medium">
                      {drugGroup.description || "-"}
                    </div>
                  </div>
                </Col>

                <Col xs={24}>
                  <div className="border rounded p-4">
                    <div className="text-gray-500 text-sm mb-1">Address</div>
                    <div className="font-medium">{"-"}</div>
                  </div>
                </Col>
              </Row>

              <Divider style={{ margin: "24px 0" }} />

              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <div className="border rounded p-4">
                    <div className="text-gray-500 text-sm mb-1">Created At</div>
                    <div className="font-medium">
                      {formatDate(drugGroup.createdAt)}
                    </div>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div className="border rounded p-4">
                    <div className="text-gray-500 text-sm mb-1">Updated At</div>
                    <div className="font-medium">
                      {formatDate(drugGroup.updatedAt)}
                    </div>
                  </div>
                </Col>
              </Row>
            </>
          )}
        </Card>
      </div>

      <ExportConfigModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        config={exportConfig}
        onChange={handleExportConfigChange}
        filters={{
          filterValue: drugGroup.groupName || "",
          statusFilter: drugGroup.status ? [drugGroup.status] : [],
          advancedFilters: {
            createdDateRange: [null, null] as [
              dayjs.Dayjs | null,
              dayjs.Dayjs | null
            ],
            updatedDateRange: [null, null] as [
              dayjs.Dayjs | null,
              dayjs.Dayjs | null
            ],
            ascending: true,
          },
          currentPage: 1,
          pageSize: 10,
        }}
        drugGroups={drugGroup ? [drugGroup] : []}
        statusOptions={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
      />
    </div>
  );
};

export default DrugGroupDetails;
