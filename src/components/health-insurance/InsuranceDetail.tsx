import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Space,
  Spin,
  Typography,
  Image,
  Tag,
  Tabs,
  message,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Upload,
  Row,
  Col,
  Avatar,
  Timeline,
  Empty,
  Radio,
  Steps,
  Result,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  SaveOutlined,
  UserOutlined,
  UploadOutlined,
  FileImageOutlined,
  FormOutlined,
  PlusOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import type { UploadFile, RcFile } from "antd/es/upload/interface";
import dayjs from "dayjs";

import PageContainer from "@/components/shared/PageContainer";
import {
  getHealthInsuranceById,
  getHealthInsuranceHistory,
  updateHealthInsuranceByAdmin,
  verifyHealthInsurance,
  softDeleteHealthInsurances,
  HealthInsuranceResponseDTO,
  HealthInsuranceUpdateRequestDTO,
  HistoryDTO,
} from "@/api/healthinsurance";
import { UserResponseDTO, getAllUsers } from "@/api/user";

// Import sub-components
import InsuranceHistoryTimeline from "./InsuranceHistoryTimeline";
import InsuranceDetailsView from "./InsuranceDetailsView";
import InsuranceEditForm from "./InsuranceEditForm";
import InsuranceNotFound from "./InsuranceNotFound";

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface InsuranceDetailProps {
  id: string;
}

export const InsuranceDetail: React.FC<InsuranceDetailProps> = ({ id }) => {
  console.log("InsuranceDetail component received ID:", id);
  const router = useRouter();
  const { edit } = router.query;
  const isEditMode = edit === "true";

  const [form] = Form.useForm();
  const [insurance, setInsurance] = useState<HealthInsuranceResponseDTO | null>(
    null
  );
  const [histories, setHistories] = useState<HistoryDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [hasInsurance, setHasInsurance] = useState<boolean>(true);

  useEffect(() => {
    if (id && typeof id === "string" && id !== "undefined") {
      console.log("ID changed, fetching insurance detail for ID:", id);
      fetchInsuranceDetail();
      fetchUsers();
      fetchHistories();
    } else {
      console.error("Invalid ID in useEffect:", id);
      messageApi.error("Invalid insurance ID");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (insurance && isEditMode) {
      setHasInsurance(insurance.status !== "NotApplicable");
      form.setFieldsValue({
        hasInsurance: insurance.status !== "NotApplicable",
        userId: insurance.user?.id,
        healthInsuranceNumber: insurance.healthInsuranceNumber,
        fullName: insurance.fullName,
        dateOfBirth: insurance.dateOfBirth
          ? dayjs(insurance.dateOfBirth)
          : undefined,
        gender: insurance.gender,
        address: insurance.address,
        healthcareProviderName: insurance.healthcareProviderName,
        healthcareProviderCode: insurance.healthcareProviderCode,
        validFrom: insurance.validFrom ? dayjs(insurance.validFrom) : undefined,
        validTo: insurance.validTo ? dayjs(insurance.validTo) : undefined,
        issueDate: insurance.issueDate ? dayjs(insurance.issueDate) : undefined,
      });

      if (insurance.imageUrl) {
        setFileList([
          {
            uid: "-1",
            name: "Insurance Card",
            status: "done",
            url: insurance.imageUrl,
          },
        ]);
      }
    }
  }, [insurance, isEditMode, form]);

  const fetchInsuranceDetail = async () => {
    setLoading(true);
    try {
      console.log("Fetching insurance details with ID:", id);
      if (!id || typeof id !== "string" || id === "undefined") {
        console.error("Invalid insurance ID:", id);
        messageApi.error("Invalid insurance ID");
        setLoading(false);
        return;
      }

      const result = await getHealthInsuranceById(id);
      console.log("API response:", result);

      if (result.isSuccess) {
        setInsurance(result.data);
      } else {
        console.error(
          "Failed to fetch insurance details:",
          result.message,
          result.responseFailed
        );
        messageApi.error(result.message || "Failed to fetch insurance details");
      }
    } catch (error) {
      console.error("Error fetching insurance details:", error);
      messageApi.error("Failed to fetch insurance details");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.isSuccess) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchHistories = async () => {
    if (!id) return;

    setHistoryLoading(true);
    try {
      const result = await getHealthInsuranceHistory(id);
      if (result.isSuccess) {
        setHistories(result.data);
      } else {
        messageApi.error(result.message || "Failed to fetch insurance history");
      }
    } catch (error) {
      messageApi.error("Failed to fetch insurance history");
      console.error("Error fetching insurance history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEditInsurance = () => {
    router.push(`/health-insurance/${id}?edit=true`);
  };

  const handleCancelEdit = () => {
    router.push(`/health-insurance/${id}`);
  };

  const handleVerifyInsurance = async (status: string) => {
    try {
      const result = await verifyHealthInsurance(id, status);
      if (result.isSuccess) {
        messageApi.success(`Insurance ${status.toLowerCase()} successfully`);
        fetchInsuranceDetail();
      } else {
        messageApi.error(
          result.message || `Failed to ${status.toLowerCase()} insurance`
        );
      }
    } catch (error) {
      messageApi.error(`Failed to ${status.toLowerCase()} insurance`);
      console.error(`Error ${status.toLowerCase()}ing insurance:`, error);
    }
  };

  const handleSoftDelete = async () => {
    try {
      const result = await softDeleteHealthInsurances([id]);
      if (result.isSuccess) {
        messageApi.success("Health insurance deleted successfully");
        router.push("/health-insurance/management");
      } else {
        messageApi.error(result.message || "Failed to delete health insurance");
      }
    } catch (error) {
      messageApi.error("Failed to delete health insurance");
      console.error("Error deleting health insurance:", error);
    }
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);

    try {
      const imageFile =
        fileList.length > 0 && fileList[0].originFileObj
          ? (fileList[0].originFileObj as File)
          : undefined;

      const result = await updateHealthInsuranceByAdmin(id, values, imageFile);

      if (result.isSuccess) {
        messageApi.success("Health insurance updated successfully");
        router.push(`/health-insurance/${id}`);
      } else {
        messageApi.error(result.message || "Failed to update health insurance");
      }
    } catch (error) {
      messageApi.error("Failed to update health insurance");
      console.error("Error updating health insurance:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!id || typeof id !== "string" || id === "undefined") {
    return (
      <InsuranceNotFound
        title="Invalid Insurance ID"
        message="The insurance ID is invalid or missing."
      />
    );
  }

  if (!insurance) {
    return (
      <InsuranceNotFound
        title="Insurance not found"
        message="The insurance record you are looking for does not exist or has been deleted."
      />
    );
  }

  if (isEditMode) {
    return (
      <InsuranceEditForm
        form={form}
        insurance={insurance}
        users={users}
        fileList={fileList}
        setFileList={setFileList}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        hasInsurance={hasInsurance}
        setHasInsurance={setHasInsurance}
        onCancel={handleCancelEdit}
        onSubmit={handleSubmit}
        saving={saving}
      />
    );
  }

  return (
    <PageContainer
      title="Health Insurance Details"
      onBack={() => router.back()}
      rightContent={
        <InsuranceDetailsView.HeaderActions
          insurance={insurance}
          onEdit={handleEditInsurance}
          onVerify={handleVerifyInsurance}
          onDelete={handleSoftDelete}
        />
      }
    >
      {contextHolder}

      <InsuranceDetailsView insurance={insurance} router={router} />

      <InsuranceHistoryTimeline
        histories={histories}
        loading={historyLoading}
      />
    </PageContainer>
  );
};
