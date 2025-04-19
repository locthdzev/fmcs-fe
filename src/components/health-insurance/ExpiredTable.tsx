import React from "react";
import { Table, Button, Space, Image, Tooltip, Modal, message } from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import {
  HealthInsuranceResponseDTO,
  softDeleteHealthInsurances,
} from "@/api/healthinsurance";

interface ExpiredTableProps {
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

const ExpiredTable: React.FC<ExpiredTableProps> = ({
  loading,
  insurances,
  selectedRowKeys,
  setSelectedRowKeys,
  columnVisibility,
  refreshData,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const handleViewDetail = (id: string) => {
    router.push(`/health-insurance/${id}`);
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
      <a onClick={() => handleViewDetail(record.id)}>
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  return (
    <>
      {contextHolder}
      <Table
        rowKey="id"
        dataSource={insurances}
        columns={columns}
        rowSelection={rowSelection}
        loading={loading}
        pagination={false}
        scroll={{ x: "max-content" }}
      />
    </>
  );
};

export default ExpiredTable;
