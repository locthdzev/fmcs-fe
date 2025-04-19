import React from "react";
import { Table, Button, Space, Tooltip, Modal, message } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import {
  HealthInsuranceResponseDTO,
  updateHealthInsuranceByAdmin,
  softDeleteHealthInsurances,
} from "@/api/healthinsurance";

interface InitialTableProps {
  loading: boolean;
  insurances: HealthInsuranceResponseDTO[];
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
  columnVisibility: {
    owner: boolean;
    createdAt: boolean;
    createdBy: boolean;
    status: boolean;
    deadline: boolean;
  };
  refreshData: () => void;
}

const InitialTable: React.FC<InitialTableProps> = ({
  loading,
  insurances,
  selectedRowKeys,
  setSelectedRowKeys,
  columnVisibility,
  refreshData,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const handleEditInsurance = (id: string) => {
    // Navigate to edit page or open edit modal
    router.push(`/health-insurance/${id}/edit`);
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

  const renderUserInfo = (user: any) => {
    if (!user) return "";
    return `${user.fullName} (${user.email})`;
  };

  const renderUserInfoSimple = (user: any) => {
    if (!user) return "";
    return `${user.userName || ""} (${user.email || ""})`;
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
      render: renderUserInfo,
      hidden: !columnVisibility.owner,
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
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      hidden: !columnVisibility.status,
    },
    {
      title: "DEADLINE",
      dataIndex: "deadline",
      key: "deadline",
      render: formatDateTime,
      hidden: !columnVisibility.deadline,
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

export default InitialTable;
