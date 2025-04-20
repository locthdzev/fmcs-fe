import React, { useState } from "react";
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
  softDeleteHealthInsurances,
  getHealthInsuranceById,
} from "@/api/healthinsurance";
import HealthInsuranceEditModal from "./HealthInsuranceEditModal";

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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<HealthInsuranceResponseDTO | null>(null);

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
  );
};

export default InitialTable;
