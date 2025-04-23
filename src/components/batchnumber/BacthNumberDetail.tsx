import React, { useState, useEffect } from "react";import {
  Card,
  Typography,
  Tag,
  Timeline,
  Button,
  Space,
  Form,
  Input,
  DatePicker,
  message,
  Spin,
  Popconfirm,
  Row,
  Col,
  Switch,
  Modal,
} from "antd";
import dayjs from "dayjs";
import {
  getBatchNumberById,
  BatchNumberResponseDTO,
  updateBatchNumber,
  updateBatchNumberStatus,
  getPrescriptionsByBatchNumberId,
  PrescriptionDTO
} from "@/api/batchnumber";
import {
  getInventoryRecordsByBatchId,
} from "@/api/inventoryrecord";
import {
  getGroupedInventoryHistories,
  InventoryHistoryResponseDTO,
} from "@/api/inventoryhistory";
import {
  FormOutlined,
  ArrowLeftOutlined,
  TagOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UndoOutlined,
  PlusOutlined,
  FormOutlined as AntFormOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { PencilSquareIcon as HeroPencilIcon, ClockIcon as HeroClockIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { Chip } from "@heroui/react";
import { exportToExcel } from "@/api/export";
import { BatchNumberIcon } from "./Icons";

const { Title, Text } = Typography;

interface BatchNumberDetailProps {
  id: string;
}

export const BatchNumberDetail: React.FC<BatchNumberDetailProps> = ({
  id,
}) => {
  const router = useRouter();
  const [batchNumber, setBatchNumber] = useState<BatchNumberResponseDTO | null>(null);
  const [inventoryHistories, setInventoryHistories] = useState<InventoryHistoryResponseDTO[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    // Only fetch data when id is valid
    if (id) {
      fetchBatchNumber();
      fetchInventoryHistories();
      fetchPrescriptions();
    }
  }, [id]);

  const fetchBatchNumber = async () => {
    try {
      setLoading(true);
      // Check id before calling API
      if (!id) {
        console.warn("Batch number ID is missing, cannot fetch data");
        return;
      }

      const data = await getBatchNumberById(id);
      console.log("Batch number data from API:", data);
      if (data) {
        setBatchNumber(data);
      } else {
        messageApi.error({
          content: "Failed to fetch batch number",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error fetching batch number:", error);
      messageApi.error({
        content: "Failed to fetch batch number",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryHistories = async () => {
    try {
      setLoading(true);
      // Check id before calling API
      if (!id) {
        console.warn("Batch number ID is missing, cannot fetch histories");
        return;
      }

      // Get inventory records for this batch number
      console.log("Fetching inventory records for batch ID:", id);
      const records = await getInventoryRecordsByBatchId(id);
      console.log("Inventory records result:", records);
      
      if (records && records.length > 0) {
        // Use the batch code to get grouped inventory histories
        const batchCode = batchNumber?.batchCode;
        console.log("Using batch code for history search:", batchCode);
        
        if (!batchCode) {
          console.warn("Batch code is undefined, can't fetch histories");
          setLoading(false);
          return;
        }
        
        const response = await getGroupedInventoryHistories(
          1, 
          100, 
          undefined, 
          undefined, 
          undefined, 
          undefined, 
          "ChangeDate", 
          false, 
          batchCode
        );
        
        console.log("Grouped inventory histories response:", response);
        
        if (response.success && response.data && response.data.items) {
          // Extract all histories from all groups
          const allHistories: InventoryHistoryResponseDTO[] = [];
          response.data.items.forEach((group: any) => {
            if (group.histories && group.histories.length > 0) {
              allHistories.push(...group.histories);
            }
          });
          
          // Sort histories by date (newest first)
          allHistories.sort((a, b) => 
            new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime()
          );
          
          console.log("Processed history items:", allHistories.length);
          setInventoryHistories(allHistories);
        } else {
          console.warn("No inventory history items found in response", response);
        }
      } else {
        console.warn("No inventory records found for batch ID:", id);
      }
    } catch (error) {
      console.error("Error fetching inventory histories:", error);
      messageApi.error({
        content: "Failed to fetch inventory histories",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      // Check id before calling API
      if (!id) {
        console.warn("Batch number ID is missing, cannot fetch prescriptions");
        return;
      }

      console.log("Fetching prescriptions for batch ID:", id);
      const response = await getPrescriptionsByBatchNumberId(id);
      console.log("Prescriptions response:", response);
      
      if (response.isSuccess && response.data) {
        setPrescriptions(response.data);
      } else {
        console.warn("No prescription data returned or request failed:", response);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      messageApi.error({
        content: "Failed to fetch prescriptions",
        duration: 5,
      });
    }
  };

  const handleToggleStatus = async (checked: boolean) => {
    if (!batchNumber) return;
    
    if (!batchNumber.manufacturingDate || !batchNumber.expiryDate) {
      messageApi.error({
        content: "Please update Manufacturing Date and Expiry Date first.",
        duration: 5,
      });
      return;
    }

    try {
      setLoadingAction(true);
      const response = await updateBatchNumberStatus(
        id,
        checked ? "Active" : "Inactive"
      );
      if (response.isSuccess) {
        messageApi.success({
          content: response.message || "Status updated successfully!",
          duration: 5,
        });
        fetchBatchNumber();
        fetchInventoryHistories();
      } else {
        messageApi.error({
          content: response.message || "Unable to update status",
          duration: 5,
        });
      }
    } catch (error) {
      messageApi.error({
        content: "Unable to update status",
        duration: 5,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      setLoadingAction(true);

      const updateData = {
        manufacturingDate: values.manufacturingDate.format("YYYY-MM-DD"),
        expiryDate: values.expiryDate.format("YYYY-MM-DD"),
      };

      const response = await updateBatchNumber(id, updateData);
      if (response.isSuccess) {
        messageApi.success({
          content: "Batch number updated successfully",
          duration: 5,
        });
        setEditModalVisible(false);
        form.resetFields();
        fetchBatchNumber();
        fetchInventoryHistories();
      } else {
        messageApi.error({
          content: response.message || "Failed to update batch number",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error updating batch number:", error);
      messageApi.error({
        content: "Failed to update batch number",
        duration: 5,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(
      `/batchnumber-management/batchnumbers/export/${id}`,
      `batch_number_${batchNumber?.batchCode}.xlsx`
    );
    messageApi.success({
      content: "Downloading Excel file...",
      duration: 5,
    });
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "Not set";
    return dayjs(date).format("DD/MM/YYYY");
  };

  const formatDateTime = (datetime: string | undefined) => {
    if (!datetime) return "";
    return dayjs(datetime).format("DD/MM/YYYY HH:mm:ss");
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Priority":
        return "primary";
      case "Active":
        return "success";
      case "NearExpiry":
        return "warning";
      case "Inactive":
        return "danger";
      case "Expired":
        return "secondary";
      default:
        return "default";
    }
  };

  const getActionColor = (action: string): string => {
    if (!action) return "blue";

    switch (action.toLowerCase()) {
      case "stockin":
      case "increase":
        return "green";
      case "stockout":
      case "decrease":
        return "red";
      case "adjustment":
        return "blue";
      case "transfer":
        return "orange";
      case "return":
        return "purple";
      default:
        return "blue";
    }
  };

  const getActionIcon = (action: string) => {
    if (!action) return null;

    switch (action.toLowerCase()) {
      case "stockin":
      case "increase":
        return <PlusOutlined />;
      case "stockout":
      case "decrease":
        return <CloseCircleOutlined />;
      case "adjustment":
        return <FormOutlined />;
      case "transfer":
        return <ExportOutlined />;
      case "return":
        return <UndoOutlined />;
      default:
        return <HistoryOutlined />;
    }
  };

  const canEditBatchNumber = (status: string | undefined) => {
    return status !== "Expired";
  };

  const renderActionButtons = () => {
    if (!batchNumber) return null;

    return (
      <Space>
        <Button
          type="primary"
          icon={<FormOutlined />}
          disabled={!canEditBatchNumber(batchNumber.status)}
          onClick={() => {
            form.setFieldsValue({
              manufacturingDate: batchNumber.manufacturingDate 
                ? dayjs(batchNumber.manufacturingDate) 
                : null,
              expiryDate: batchNumber.expiryDate 
                ? dayjs(batchNumber.expiryDate) 
                : null,
            });
            setEditModalVisible(true);
          }}
        >
          Edit
        </Button>
      </Space>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" />
      </div>
    );
  }

  if (!batchNumber) {
    return (
      <div className="flex justify-center items-center p-4">
        {contextHolder}
        <Title level={2}>Batch Number Not Found</Title>
      </div>
    );
  }

  return (
    <div className="p-4">
      {contextHolder}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/batch-number")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <BatchNumberIcon style={{ fontSize: "24px", width: "24px", height: "24px" }} />
          <h3 className="text-xl font-bold">Batch Number Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card
          title={<span style={{ fontWeight: "bold" }}>Basic Information</span>}
        >
          <div className="space-y-4">
            <div>
              <Text strong>Batch Code:</Text>
              <Text className="ml-2">{batchNumber.batchCode}</Text>
            </div>
            <div>
              <Text strong>Drug Name:</Text>
              <Text className="ml-2">
                {batchNumber.drug?.name} ({batchNumber.drug?.drugCode})
              </Text>
            </div>
            <div>
              <Text strong>Supplier:</Text>
              <Text className="ml-2">
                {batchNumber.supplier?.supplierName}
              </Text>
            </div>
            <div>
              <Text strong>Status:</Text>
              <span className="ml-2">
                <Chip
                  className="capitalize"
                  color={getStatusColor(batchNumber.status)}
                  size="sm"
                  variant="flat"
                >
                  {batchNumber.status === "NearExpiry" ? "Near Expiry" : batchNumber.status}
                </Chip>
              </span>
            </div>
            <div>
              <Text strong>Active:</Text>
              <span className="ml-2">
                <Switch
                  checked={
                    batchNumber.status === "Priority" ||
                    batchNumber.status === "Active" ||
                    batchNumber.status === "NearExpiry"
                  }
                  disabled={
                    !batchNumber.manufacturingDate ||
                    !batchNumber.expiryDate ||
                    batchNumber.status === "Expired"
                  }
                  loading={loadingAction}
                  onChange={handleToggleStatus}
                />
              </span>
            </div>
          </div>
        </Card>

        <Card
          title={<span style={{ fontWeight: "bold" }}>Batch Details</span>}
        >
          <div className="space-y-4">
            <div>
              <Text strong>Manufacturing Date:</Text>
              <Text className="ml-2">
                {formatDate(batchNumber.manufacturingDate)}
              </Text>
            </div>
            <div>
              <Text strong>Expiry Date:</Text>
              <Text className="ml-2">{formatDate(batchNumber.expiryDate)}</Text>
            </div>
            <div>
              <Text strong>Quantity Received:</Text>
              <Text className="ml-2">{batchNumber.quantityReceived}</Text>
            </div>
            <div>
              <Text strong>Created At:</Text>
              <Text className="ml-2">{formatDateTime(batchNumber.createdAt)}</Text>
            </div>
            <div>
              <Text strong>Created By:</Text>
              <Text className="ml-2">{batchNumber.createdBy?.userName || 'Unknown'}</Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Prescriptions Card */}
      <Card
        title={<span style={{ fontWeight: "bold" }}>Prescriptions Using This Batch</span>}
        className="mb-8"
      >
        {prescriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prescription Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Used
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prescriptions.map((prescription) => (
                  <tr key={prescription.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {prescription.prescriptionCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prescription.patientName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prescription.staffName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prescription.totalQuantityUsed || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prescription.createdAt ? formatDateTime(prescription.createdAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Chip
                        className="capitalize"
                        color={prescription.status === "Completed" ? "success" : prescription.status === "Pending" ? "warning" : "default"}
                        size="sm"
                        variant="flat"
                      >
                        {prescription.status || 'Unknown'}
                      </Chip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button
                        type="link"
                        onClick={() => router.push(`/prescription/${prescription.id}`)}
                        style={{ padding: 0, margin: 0 }}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4">
            <p>No prescriptions have used this batch yet.</p>
          </div>
        )}
      </Card>
      
      {/* Edit Modal */}
      <Modal
        title="Edit Batch Number"
        open={editModalVisible}
        onOk={handleUpdate}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={loadingAction}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="manufacturingDate"
            label="Manufacturing Date"
            rules={[
              { required: true, message: "Please select manufacturing date" },
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="expiryDate"
            label="Expiry Date"
            rules={[{ required: true, message: "Please select expiry date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BatchNumberDetail;

