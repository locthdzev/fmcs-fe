import React from "react";
import { Table, Button, Space, Tooltip, Modal, message } from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import {
  HealthInsuranceResponseDTO,
  softDeleteHealthInsurances,
} from "@/api/healthinsurance";

interface NoInsuranceTableProps {
  loading: boolean;
  insurances: HealthInsuranceResponseDTO[];
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
  columnVisibility: {
    owner: boolean;
    createdAt: boolean;
    createdBy: boolean;
    status: boolean;
    updatedAt: boolean;
    updatedBy: boolean;
  };
  refreshData: () => void;
}

const NoInsuranceTable: React.FC<NoInsuranceTableProps> = ({
  loading,
  insurances,
  selectedRowKeys,
  setSelectedRowKeys,
  columnVisibility,
  refreshData,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const handleSoftDelete = (id: string) => {
    Modal.confirm({
      title: "Are you sure you want to soft delete this record?",
      icon: <ExclamationCircleOutlined />,
      content: "This action can be reversed later.",
      onOk: async () => {
        try {
          const result = await softDeleteHealthInsurances([id]);
          if (result.isSuccess) {
            messageApi.success("Record deleted successfully");
            refreshData();
          } else {
            messageApi.error(result.message || "Failed to delete record");
          }
        } catch (error) {
          messageApi.error("Failed to delete record");
          console.error("Error deleting record:", error);
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

export default NoInsuranceTable;
