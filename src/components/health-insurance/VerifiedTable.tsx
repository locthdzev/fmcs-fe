import React, { useState } from "react";
import { Table, Button, Space, Image, Tooltip, Dropdown, Menu, Modal, message } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import {
  HealthInsuranceResponseDTO,
  updateHealthInsuranceByAdmin,
  softDeleteHealthInsurances,
  getHealthInsuranceById,
} from "@/api/healthinsurance";
import HealthInsuranceEditModal from "./HealthInsuranceEditModal";

interface VerifiedTableProps {
  loading: boolean;
  insurances: HealthInsuranceResponseDTO[];
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
  columnVisibility: {
    owner: boolean;
    insuranceNumber: boolean;
    fullName: boolean;
    dob: boolean;
    gender: boolean;
    address: boolean;
    healthcareProvider: boolean;
    validPeriod: boolean;
    issueDate: boolean;
    image: boolean;
    createdAt: boolean;
    createdBy: boolean;
    updatedAt: boolean;
    updatedBy: boolean;
    status: boolean;
    verification: boolean;
  };
  refreshData: () => void;
}

const VerifiedTable: React.FC<VerifiedTableProps> = ({
  loading,
  insurances,
  selectedRowKeys,
  setSelectedRowKeys,
  columnVisibility,
  refreshData,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<HealthInsuranceResponseDTO | null>(null);

  const handleViewDetail = (id: string) => {
    router.push(`/health-insurance/${id}`);
  };

  const handleEditInsurance = async (id: string) => {
    try {
      const response = await getHealthInsuranceById(id);
      if (response.isSuccess && response.data) {
        setSelectedInsurance(response.data);
        setEditModalVisible(true);
      } else {
        messageApi.error("Failed to fetch insurance details");
      }
    } catch (error) {
      messageApi.error("Failed to fetch insurance details");
      console.error("Error fetching insurance details:", error);
    }
  };

  const handleEditSuccess = () => {
    refreshData();
    messageApi.success("Health insurance updated successfully");
  };

  const handleSoftDelete = (id: string) => {
    Modal.confirm({
      title: "Are you sure you want to soft delete this health insurance?",
      icon: <ExclamationCircleOutlined />,
      content: "This action can be reversed later.",
      onOk: async () => {
        try {
          const result = await softDeleteHealthInsurances([id]);
          if (result.isSuccess) {
            messageApi.success("Health insurance deleted successfully");
            refreshData();
          } else {
            messageApi.error(result.message || "Failed to delete health insurance");
          }
        } catch (error) {
          messageApi.error("Failed to delete health insurance");
          console.error("Error deleting health insurance:", error);
        }
      },
    });
  };

  const renderUserInfo = (user: any, record: HealthInsuranceResponseDTO) => {
    if (!user) return "";
    return (
      <a onClick={() => router.push(`/health-insurance/${record.id}`)}>
        {user.fullName} ({user.email})
      </a>
    );
  };

  const renderUserInfoSimple = (user: any) => {
    if (!user) return "";
    return `${user.userName || ""} (${user.email || ""})`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY");
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss");
  };

  const columns = [
    {
      title: "OWNER",
      dataIndex: ["user"],
      key: "owner",
      render: (user: any, record: HealthInsuranceResponseDTO) => renderUserInfo(user, record),
      hidden: !columnVisibility.owner,
    },
    {
      title: "INSURANCE NUMBER",
      dataIndex: "healthInsuranceNumber",
      key: "insuranceNumber",
      hidden: !columnVisibility.insuranceNumber,
    },
    {
      title: "FULL NAME",
      dataIndex: "fullName",
      key: "fullName",
      hidden: !columnVisibility.fullName,
    },
    {
      title: "DOB",
      dataIndex: "dateOfBirth",
      key: "dob",
      render: formatDate,
      hidden: !columnVisibility.dob,
    },
    {
      title: "GENDER",
      dataIndex: "gender",
      key: "gender",
      hidden: !columnVisibility.gender,
    },
    {
      title: "ADDRESS",
      dataIndex: "address",
      key: "address",
      hidden: !columnVisibility.address,
    },
    {
      title: "HEALTHCARE PROVIDER",
      key: "healthcareProvider",
      render: (record: HealthInsuranceResponseDTO) => 
        `${record.healthcareProviderName || ""} ${record.healthcareProviderCode ? `(${record.healthcareProviderCode})` : ""}`,
      hidden: !columnVisibility.healthcareProvider,
    },
    {
      title: "VALID PERIOD",
      key: "validPeriod",
      render: (record: HealthInsuranceResponseDTO) => 
        `${formatDate(record.validFrom)} - ${formatDate(record.validTo)}`,
      hidden: !columnVisibility.validPeriod,
    },
    {
      title: "ISSUE DATE",
      dataIndex: "issueDate",
      key: "issueDate",
      render: formatDate,
      hidden: !columnVisibility.issueDate,
    },
    {
      title: "IMAGE",
      dataIndex: "imageUrl",
      key: "image",
      render: (imageUrl: string) => 
        imageUrl ? (
          <Image
            src={imageUrl}
            alt="Insurance"
            width={50}
            height={50}
            style={{ objectFit: "cover" }}
            preview={{ mask: <EyeOutlined /> }}
          />
        ) : (
          "No image"
        ),
      hidden: !columnVisibility.image,
    },
    {
      title: "CREATED AT",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDateTime,
      hidden: !columnVisibility.createdAt,
    },
    {
      title: "CREATED BY",
      dataIndex: "createdBy",
      key: "createdBy",
      render: renderUserInfoSimple,
      hidden: !columnVisibility.createdBy,
    },
    {
      title: "UPDATED AT",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDateTime,
      hidden: !columnVisibility.updatedAt,
    },
    {
      title: "UPDATED BY",
      dataIndex: "updatedBy",
      key: "updatedBy",
      render: renderUserInfoSimple,
      hidden: !columnVisibility.updatedBy,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      hidden: !columnVisibility.status,
    },
    {
      title: "VERIFICATION",
      dataIndex: "verificationStatus",
      key: "verification",
      hidden: !columnVisibility.verification,
    },
    {
      title: "ACTIONS",
      key: "actions",
      render: (record: HealthInsuranceResponseDTO) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditInsurance(record.id)}
            />
          </Tooltip>
          <Tooltip title="Soft Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleSoftDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ].filter(column => !column.hidden);

  return (
    <>
      {contextHolder}
      <>
        <Table
          loading={loading}
          dataSource={insurances}
          columns={columns.filter((col) => !col.hidden)}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
          }}
          pagination={false}
          size="middle"
          scroll={{ x: "max-content" }}
        />
        {editModalVisible && selectedInsurance && (
          <HealthInsuranceEditModal
            visible={editModalVisible}
            insurance={selectedInsurance}
            onClose={() => setEditModalVisible(false)}
            onSuccess={handleEditSuccess}
            isAdmin={true}
          />
        )}
      </>
    </>
  );
};

export default VerifiedTable;
