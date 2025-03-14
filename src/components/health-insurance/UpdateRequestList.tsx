import React, { useState, useEffect, useCallback } from "react";
import { Button, Table, Input, Select, Pagination } from "antd";
import { toast } from "react-toastify";
import {
  getUpdateRequests,
  UpdateRequestDTO,
  setupHealthInsuranceRealTime,
} from "@/api/healthinsurance";
import ReviewRequestModal from "./ReviewRequestModal";

const { Option } = Select;

export function UpdateRequestList() {
  const [requests, setRequests] = useState<UpdateRequestDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<UpdateRequestDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUpdateRequests(
        currentPage,
        pageSize,
        searchText,
        "RequestedAt",
        false,
        statusFilter
      );
      setRequests(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load update requests.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter]);

  useEffect(() => {
    fetchRequests();
    const connection = setupHealthInsuranceRealTime(() => {
      fetchRequests();
    });
    return () => {
      connection.stop();
    };
  }, [fetchRequests]);

  const columns = [
    { title: "Insurance ID", dataIndex: "healthInsuranceId" },
    {
      title: "Requested By",
      render: (record: UpdateRequestDTO) => record.requestedBy.userName,
    },
    { title: "Requested At", dataIndex: "requestedAt" },
    { title: "Status", dataIndex: "status" },
    {
      title: "Actions",
      render: (record: UpdateRequestDTO) => (
        <Button
          onClick={() => {
            setSelectedRequest(record);
            setIsReviewModalVisible(true);
          }}
          disabled={record.status !== "Pending"}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by insurance ID or requester"
          onSearch={(value) => setSearchText(value)}
          style={{ width: 300, marginRight: 16 }}
        />
        <Select
          placeholder="Filter by status"
          onChange={(value) => setStatusFilter(value)}
          style={{ width: 150 }}
          allowClear
        >
          <Option value="Pending">Pending</Option>
          <Option value="Approved">Approved</Option>
          <Option value="Rejected">Rejected</Option>
        </Select>
      </div>
      <Table
        columns={columns}
        dataSource={requests}
        loading={loading}
        pagination={false}
        rowKey="id"
      />
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={total}
        onChange={(page, size) => {
          setCurrentPage(page);
          setPageSize(size);
        }}
        style={{ marginTop: 16, textAlign: "right" }}
      />
      <ReviewRequestModal
        visible={isReviewModalVisible}
        request={selectedRequest}
        onClose={() => setIsReviewModalVisible(false)}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
