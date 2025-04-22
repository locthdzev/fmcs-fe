import React from "react";
import {
  Table,
  Button,
  Space,
  Image,
  Tooltip,
  Modal,
  message,
  Tag,
  Card,
  Dropdown,
  Popconfirm,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  FileExclamationOutlined,
  WarningOutlined,
  StopOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import {
  HealthInsuranceResponseDTO,
  softDeleteHealthInsurances,
} from "@/api/healthinsurance";
import { getStatusTag, getVerificationTag } from "@/utils/statusTagUtils";

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

  const handleSoftDelete = async (id: string) => {
    try {
      const result = await softDeleteHealthInsurances([id]);
      if (result.isSuccess) {
        messageApi.success("Health insurance deleted successfully");
        refreshData();
      } else {
        messageApi.error(
          result.message || "Failed to delete health insurance"
        );
      }
    } catch (error) {
      messageApi.error("Failed to delete health insurance");
      console.error("Error deleting health insurance:", error);
    }
  };

  const renderUserInfo = (user: any, record: HealthInsuranceResponseDTO) => {
    if (!user) return "";
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <a
          onClick={() => router.push(`/user/${user.id}`)}
          style={{ color: "#1890ff" }}
        >
          {user.fullName}
        </a>
        <span style={{ fontSize: "12px", color: "#888" }}>{user.email}</span>
      </div>
    );
  };

  const renderUserInfoSimple = (user: any) => {
    if (!user) return "";
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span>{user.userName || ""}</span>
        <span style={{ fontSize: "12px", color: "#888" }}>
          {user.email || ""}
        </span>
      </div>
    );
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
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          OWNER
        </span>
      ),
      dataIndex: ["user"],
      key: "owner",
      fixed: "left" as const,
      width: 200,
      render: (user: any, record: HealthInsuranceResponseDTO) =>
        renderUserInfo(user, record),
      hidden: !columnVisibility.owner,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          INSURANCE NUMBER
        </span>
      ),
      dataIndex: "healthInsuranceNumber",
      key: "insuranceNumber",
      width: 220,
      render: (
        healthInsuranceNumber: string,
        record: HealthInsuranceResponseDTO
      ) => (
        <a
          onClick={() => router.push(`/health-insurance/${record.id}`)}
          style={{ color: "#1890ff" }}
        >
          {healthInsuranceNumber}
        </a>
      ),
      hidden: !columnVisibility.insuranceNumber,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          FULL NAME
        </span>
      ),
      dataIndex: "fullName",
      key: "fullName",
      hidden: !columnVisibility.fullName,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          DOB
        </span>
      ),
      dataIndex: "dateOfBirth",
      key: "dob",
      render: formatDate,
      width: 120,
      align: "center" as const,
      hidden: !columnVisibility.dob,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          GENDER
        </span>
      ),
      dataIndex: "gender",
      key: "gender",
      hidden: !columnVisibility.gender,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          ADDRESS
        </span>
      ),
      dataIndex: "address",
      key: "address",
      hidden: !columnVisibility.address,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          HEALTHCARE PROVIDER
        </span>
      ),
      key: "healthcareProvider",
      render: (record: HealthInsuranceResponseDTO) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span>{record.healthcareProviderName || ""}</span>
          {record.healthcareProviderCode && (
            <span style={{ fontSize: "12px", color: "#888" }}>
              Code: {record.healthcareProviderCode}
            </span>
          )}
        </div>
      ),
      hidden: !columnVisibility.healthcareProvider,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          VALID PERIOD
        </span>
      ),
      key: "validPeriod",
      width: 180,
      align: "center" as const,
      render: (record: HealthInsuranceResponseDTO) =>
        `${formatDate(record.validFrom)} - ${formatDate(record.validTo)}`,
      hidden: !columnVisibility.validPeriod,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          ISSUE DATE
        </span>
      ),
      dataIndex: "issueDate",
      key: "issueDate",
      width: 120,
      align: "center" as const,
      render: formatDate,
      hidden: !columnVisibility.issueDate,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          IMAGE
        </span>
      ),
      dataIndex: "imageUrl",
      key: "image",
      width: 100,
      align: "center" as const,
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
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          CREATED AT
        </span>
      ),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      align: "center" as const,
      render: formatDateTime,
      hidden: !columnVisibility.createdAt,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          CREATED BY
        </span>
      ),
      dataIndex: "createdBy",
      key: "createdBy",
      render: (user: any) => renderUserInfoSimple(user),
      hidden: !columnVisibility.createdBy,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          UPDATED AT
        </span>
      ),
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 160,
      align: "center" as const,
      render: formatDateTime,
      hidden: !columnVisibility.updatedAt,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          UPDATED BY
        </span>
      ),
      dataIndex: "updatedBy",
      key: "updatedBy",
      render: (user: any) => renderUserInfoSimple(user),
      hidden: !columnVisibility.updatedBy,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          STATUS
        </span>
      ),
      dataIndex: "status",
      key: "status",
      width: 150,
      align: "center" as const,
      render: (status: string) => getStatusTag(status),
      hidden: !columnVisibility.status,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          VERIFICATION
        </span>
      ),
      dataIndex: "verificationStatus",
      key: "verification",
      width: 150,
      align: "center" as const,
      render: (status: string) => getVerificationTag(status),
      hidden: !columnVisibility.verification,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          ACTIONS
        </span>
      ),
      key: "actions",
      fixed: "right" as const,
      width: 80,
      align: "center" as const,
      render: (record: HealthInsuranceResponseDTO) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Tooltip title="View Detail">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this record?"
            onConfirm={() => handleSoftDelete(record.id)}
            okText="Yes"
            cancelText="No"
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ].filter((column) => column.key === "actions" || !column.hidden);

  return (
    <>
      {contextHolder}
      <Card className="shadow-sm" bodyStyle={{ padding: "16px" }}>
        <div style={{ overflowX: "auto" }}>
          <Table
            loading={loading}
            dataSource={insurances}
            columns={columns}
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: (newSelectedRowKeys) =>
                setSelectedRowKeys(newSelectedRowKeys),
              columnWidth: 48,
            }}
            pagination={false}
            size="middle"
            scroll={{ x: "max-content" }}
            sticky
            bordered
          />
        </div>
      </Card>
    </>
  );
};

export default ExpiredTable;
