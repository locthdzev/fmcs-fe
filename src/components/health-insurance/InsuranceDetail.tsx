import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spin, Typography, Tabs, message, Modal, Form } from "antd";
import {
  ExclamationCircleOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

import PageContainer from "@/components/shared/PageContainer";
import {
  getHealthInsuranceById,
  getHealthInsuranceHistory,
  verifyHealthInsurance,
  softDeleteHealthInsurances,
  HealthInsuranceResponseDTO,
  HistoryDTO,
} from "@/api/healthinsurance";
import { UserResponseDTO, getAllUsers } from "@/api/user";

// Import sub-components
import InsuranceHistoryTimeline from "./InsuranceHistoryTimeline";
import InsuranceDetailsView from "./InsuranceDetailsView";
import InsuranceNotFound from "./InsuranceNotFound";
import HealthInsuranceEditModal from "./HealthInsuranceEditModal";

const { Title, Text } = Typography;
const { confirm } = Modal;

interface InsuranceDetailProps {
  id: string;
}

export const InsuranceDetail: React.FC<InsuranceDetailProps> = ({ id }) => {
  console.log("InsuranceDetail component received ID:", id);
  const router = useRouter();

  const [insurance, setInsurance] = useState<HealthInsuranceResponseDTO | null>(
    null
  );
  const [histories, setHistories] = useState<HistoryDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);

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
    setEditModalVisible(true);
  };

  const handleEditSuccess = () => {
    fetchInsuranceDetail();
    fetchHistories();
    messageApi.success("Health insurance updated successfully");
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
      } else {
        messageApi.error(result.message || "Failed to delete health insurance");
      }
    } catch (error) {
      messageApi.error("Failed to delete health insurance");
      console.error("Error deleting health insurance:", error);
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

  return (
    <PageContainer
      title="Health Insurance Details"
      icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
      onBack={() => router.push("/health-insurance")}
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

      {insurance && (
        <HealthInsuranceEditModal
          visible={editModalVisible}
          insurance={insurance}
          onClose={() => setEditModalVisible(false)}
          onSuccess={handleEditSuccess}
          isAdmin={true}
        />
      )}
    </PageContainer>
  );
};
