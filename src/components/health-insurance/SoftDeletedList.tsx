import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Input,
  Pagination,
  Space,
  Row,
  Col,
  Tag,
  Button,
  Modal,
  Tooltip,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  restoreHealthInsurance,
} from "@/api/healthinsurance";
import { SearchOutlined, UndoOutlined, DeleteOutlined } from "@ant-design/icons";

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
};

export function SoftDeletedList() {
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHealthInsurances(
        currentPage,
        pageSize,
        searchText,
        "UpdatedAt",
        false,
        "SoftDeleted"
      );
      setInsurances(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load soft-deleted insurances.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText]);

  useEffect(() => {
    fetchInsurances();
    const connection = setupHealthInsuranceRealTime(() => {
      fetchInsurances();
    });
    return () => {
      connection.stop();
    };
  }, [fetchInsurances]);

  const handleRestore = async (id: string) => {
    try {
      setRestoringId(id);
      const response = await restoreHealthInsurance(id);
      if (response.isSuccess) {
        toast.success("Insurance restored successfully!");
        fetchInsurances();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to restore insurance.");
    } finally {
      setRestoringId(null);
    }
  };

  const columns = [
    {
      title: "Policyholder",
      render: (record: HealthInsuranceResponseDTO) => (
        <div>
          <div>{record.user.fullName}</div>
          <div className="text-gray-500">{record.user.email}</div>
        </div>
      ),
    },
    {
      title: "Insurance Number",
      dataIndex: "healthInsuranceNumber",
    },
    {
      title: "Valid Period",
      render: (record: HealthInsuranceResponseDTO) => (
        <Space direction="vertical" size={0}>
          <div>From: {formatDate(record.validFrom)}</div>
          <div>To: {formatDate(record.validTo)}</div>
        </Space>
      ),
    },
    {
      title: "Status",
      render: (record: HealthInsuranceResponseDTO) => (
        <Tag icon={<DeleteOutlined />} color="default">
          Soft Deleted
        </Tag>
      ),
    },
    {
      title: "Deleted At",
      render: (record: HealthInsuranceResponseDTO) => (
        <Tooltip title={moment(record.updatedAt).fromNow()}>
          <span>{formatDateTime(record.updatedAt)}</span>
        </Tooltip>
      ),
    },
    {
      title: "Deleted By",
      render: (record: HealthInsuranceResponseDTO) =>
        record.updatedBy ? (
          <div>
            <div>{record.updatedBy.userName}</div>
            <div className="text-gray-500">{record.updatedBy.email}</div>
          </div>
        ) : (
          "System"
        ),
    },
    {
      title: "Actions",
      render: (record: HealthInsuranceResponseDTO) => (
        <Button
          type="primary"
          icon={<UndoOutlined />}
          loading={restoringId === record.id}
          onClick={() => {
            Modal.confirm({
              title: "Restore Insurance",
              content: "Are you sure you want to restore this insurance?",
              okText: "Yes",
              cancelText: "No",
              onOk: () => handleRestore(record.id),
            });
          }}
        >
          Restore
        </Button>
      ),
    },
  ];

  const topContent = (
    <Row gutter={[16, 16]} align="middle" justify="space-between">
      <Col>
        <Space>
          <Input
            placeholder="Search by insurance number"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </Space>
      </Col>
      <Col>
        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
          Total {total} soft-deleted insurances
        </span>
      </Col>
    </Row>
  );

  const bottomContent = (
    <Row justify="end" style={{ marginTop: 16 }}>
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={total}
        onChange={(page, size) => {
          setCurrentPage(page);
          setPageSize(size);
        }}
        showSizeChanger
        showTotal={(total) => `Total ${total} items`}
      />
    </Row>
  );

  return (
    <div>
      {topContent}
      <Table
        columns={columns}
        dataSource={insurances}
        loading={loading}
        pagination={false}
        rowKey="id"
        style={{ marginTop: 16 }}
      />
      {bottomContent}
    </div>
  );
} 