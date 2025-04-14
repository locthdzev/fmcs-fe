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
  Popconfirm,
  Card,
  Typography,
  Badge,
  Divider,
  Select,
  Form,
  InputNumber,
  message
} from "antd";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  resendUpdateRequest,
  softDeleteHealthInsurances,
  exportHealthInsurances,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  RedoOutlined,
  WarningOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  UndoOutlined,
  AppstoreOutlined,
  FileExcelOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { HealthInsuranceIcon } from "@/dashboard/sidebar/icons/HealthInsuranceIcon";

const { Title, Text } = Typography;
const { Option } = Select;

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
};

export function ExpiredUpdateList() {
  const router = useRouter();
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [insuranceNumberOptions, setInsuranceNumberOptions] = useState<
    string[]
  >([]);
  const [searchForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHealthInsurances(
        currentPage,
        pageSize,
        searchText,
        "Deadline",
        true,
        "Expired"
      );
      setInsurances(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      messageApi.error("Unable to load expired insurances.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, messageApi]);

  const fetchAllInsuranceNumbers = useCallback(async () => {
    try {
      const result = await getAllHealthInsurances(
        1,
        1000,
        "",
        "Deadline",
        true,
        "Expired"
      );

      if (result.data && result.data.length > 0) {
        const uniqueNumbers = Array.from(
          new Set(
            result.data
              .filter(
                (insurance: HealthInsuranceResponseDTO) =>
                  insurance.healthInsuranceNumber
              )
              .map(
                (insurance: HealthInsuranceResponseDTO) =>
                  insurance.healthInsuranceNumber
              )
          )
        );
        setInsuranceNumberOptions(uniqueNumbers as string[]);
      }
    } catch (error) {
      console.error("Unable to load all insurance numbers", error);
    }
  }, []);

  useEffect(() => {
    fetchInsurances();
    fetchAllInsuranceNumbers();

    const connection = setupHealthInsuranceRealTime(() => {
      fetchInsurances();
    });
    return () => {
      connection.stop();
    };
  }, [fetchInsurances, fetchAllInsuranceNumbers]);

  const handleResendRequest = async (id: string) => {
    try {
      setResendingId(id);
      const response = await resendUpdateRequest(id);
      if (response.isSuccess) {
        messageApi.success("Update request resent successfully!");
        fetchInsurances();
      } else {
        messageApi.error(response.message);
      }
    } catch (error) {
      messageApi.error("Unable to resend update request.");
    } finally {
      setResendingId(null);
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const response = await softDeleteHealthInsurances([id]);
      if (response.isSuccess) {
        messageApi.success("Insurance soft deleted successfully!");
        fetchInsurances();
      } else {
        messageApi.error(response.message || "Failed to soft delete insurance");
      }
    } catch (error) {
      messageApi.error("Unable to soft delete insurance.");
    }
  };

  const handleReset = () => {
    setSearchText("");
    setCurrentPage(1);
  };

  const handleBack = () => {
    router.back();
  };

  const columns = [
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          POLICYHOLDER
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserOutlined className="text-blue-500" />
          </div>
          <div>
            <Text strong className="block">
              {record.user.fullName}
            </Text>
            <Text type="secondary" className="text-sm">
              {record.user.email}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>          INSURANCE NUMBER
        </span>
      ),
      dataIndex: "healthInsuranceNumber",
      render: (text: string) => (
        <Text strong className="text-blue-600">
          {text}
        </Text>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          VALID PERIOD
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <div className="space-y-1">
          <div className="flex items-center">
            <Badge status="success" />
            <Text className="ml-2">From: {formatDate(record.validFrom)}</Text>
          </div>
          <div className="flex items-center">
            <Badge status="error" />
            <Text className="ml-2">To: {formatDate(record.validTo)}</Text>
          </div>
        </div>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Tag  color="error" className="px-3 py-1">
          {record.status}
        </Tag>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          DEADLINE
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Tooltip title={moment(record.deadline).fromNow()}>
          <div className="flex items-center space-x-2">
            <Text type="danger">{formatDateTime(record.deadline)}</Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Space>
          <Button
            type="primary"
            icon={<RedoOutlined />}
            loading={resendingId === record.id}
            onClick={() => {
              Modal.confirm({
                title: "Resend Update Request",
                content:
                  "Are you sure you want to resend the update request to this user?",
                okText: "Yes",
                cancelText: "No",
                icon: <ExclamationCircleOutlined className="text-blue-500" />,
                onOk: () => handleResendRequest(record.id),
              });
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Resend Request
          </Button>
          <Popconfirm
            title="Delete Insurance"
            description="Are you sure you want to delete this insurance?"
            onConfirm={() => handleSoftDelete(record.id)}
            okText="Yes"
            cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="hover:bg-red-50"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const topContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <HealthInsuranceIcon/>
          <h3 className="text-xl font-bold">Expired Insurance List</h3>
        </div>
      </div>

      <Card
        className="shadow mb-4"
        bodyStyle={{ padding: "16px" }}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "16px",
            }}
          >
            <AppstoreOutlined />
            <span>Toolbar</span>
          </div>
        }
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select
              showSearch
              allowClear
              style={{ width: 200 }}
              placeholder="Insurance Number"
              optionFilterProp="children"
              onChange={(value) => setSearchText(value || "")}
              value={searchText || undefined}
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {insuranceNumberOptions.map((number) => (
                <Option key={number} value={number}>
                  {number}
                </Option>
              ))}
            </Select>

            <Tooltip title="Reset All Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={!searchText}
              >
                Reset
              </Button>
            </Tooltip>
          </div>

          <div>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={exportHealthInsurances}
              disabled={loading}
            >
              Export to Excel
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <div></div>
        <div>
          <Text type="secondary">
            Rows per page:
            <Select
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setCurrentPage(1);
              }}
              style={{ marginLeft: 8, width: 70 }}
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={15}>15</Option>
              <Option value={20}>20</Option>
            </Select>
          </Text>
        </div>
      </div>
    </>
  );

  // Update the bottom pagination component to match the style in index.tsx
  const bottomContent: React.ReactNode = (
    <Card className="mt-4 shadow-sm">
      <Row justify="center" align="middle">
        <Space size="large" align="center">
          <Text type="secondary">Total {total} items</Text>
          <Space align="center" size="large">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={(page) => {
                setCurrentPage(page);
              }}
              showSizeChanger={false}
              showTotal={() => ""}
            />
            <Space align="center">
              <Text type="secondary">Go to page:</Text>
              <InputNumber
                min={1}
                max={Math.ceil(total / pageSize)}
                value={currentPage}
                onChange={(value) => {
                  if (
                    value &&
                    Number(value) > 0 &&
                    Number(value) <= Math.ceil(total / pageSize)
                  ) {
                    setCurrentPage(Number(value));
                  }
                }}
                style={{ width: "60px" }}
              />
            </Space>
          </Space>
        </Space>
      </Row>
    </Card>
  );

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {contextHolder}
      {topContent}
      <Card className="shadow-sm">
        <Table
          bordered
          loading={loading}
          columns={columns}
          dataSource={insurances}
          rowKey={(record) => record.id}
          pagination={false}
          className="border rounded-lg overflow-x-auto"
        />
        {bottomContent}
      </Card>
    </div>
  );
}
