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
  Popconfirm,
  Tooltip,
  Card,
  Typography,
  Badge,
  Divider,
  Select,
  message,
  InputNumber,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  restoreHealthInsurance,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  UndoOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
  IdcardOutlined,
  ArrowLeftOutlined,
  AppstoreOutlined,
  FilterOutlined,
  TagOutlined,
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

export function SoftDeletedList() {
  const router = useRouter();
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [insuranceNumberOptions, setInsuranceNumberOptions] = useState<string[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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

      // Extract unique insurance numbers for the dropdown
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
      messageApi.error("Unable to load soft-deleted insurances.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, messageApi]);

  // Fetch all insurance numbers for dropdown
  const fetchAllInsuranceNumbers = useCallback(async () => {
    try {
      const result = await getAllHealthInsurances(
        1,
        1000,
        "",
        "UpdatedAt",
        false,
        "SoftDeleted"
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

  const handleRestore = async (id: string) => {
    try {
      setRestoringId(id);
      const response = await restoreHealthInsurance(id);
      if (response.isSuccess) {
        messageApi.success("Insurance restored successfully!");
        fetchInsurances();
      } else {
        messageApi.error(response.message);
      }
    } catch (error) {
      messageApi.error("Unable to restore insurance.");
    } finally {
      setRestoringId(null);
    }
  };

  // Xử lý restore hàng loạt
  const handleBulkRestore = async () => {
    try {
      setLoading(true);
      let successCount = 0;
      let failCount = 0;
      
      // Xử lý lần lượt từng item được chọn
      for (const id of selectedRowKeys as string[]) {
        try {
          const response = await restoreHealthInsurance(id);
          if (response.isSuccess) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }
      
      if (successCount > 0) {
        messageApi.success(`Successfully restored ${successCount} insurance(s)!`);
      }
      
      if (failCount > 0) {
        messageApi.error(`Failed to restore ${failCount} insurance(s).`);
      }
      
      // Xóa danh sách chọn và làm mới dữ liệu
      setSelectedRowKeys([]);
      fetchInsurances();
    } catch (error) {
      messageApi.error("Unable to restore selected insurances.");
    } finally {
      setLoading(false);
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
        <div className="flex flex-col">
          <Typography.Text strong>{record.user.fullName}</Typography.Text>
          <Typography.Text type="secondary" className="text-sm">{record.user.email}</Typography.Text>
        </div>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          INSURANCE NUMBER
        </span>
      ),
      dataIndex: "healthInsuranceNumber",
      render: (text: string) => (
        <Text strong className="text-gray-600">{text}</Text>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          VALID PERIOD
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Space direction="vertical" size="small">
          <Typography.Text>From: {formatDate(record.validFrom)}</Typography.Text>
          <Typography.Text>To: {formatDate(record.validTo)}</Typography.Text>
        </Space>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Tag color="default">
          Soft Deleted
        </Tag>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          DELETED AT
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Tooltip title={moment(record.updatedAt).fromNow()}>
          <Space direction="vertical" size="small">
            <Typography.Text>{formatDate(record.updatedAt)}</Typography.Text>
            <Typography.Text type="secondary" className="text-sm">{moment(record.updatedAt).format('HH:mm:ss')}</Typography.Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          DELETED BY
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) =>
        record.updatedBy ? (
          <div className="flex flex-col">
            <Typography.Text strong>{record.updatedBy.userName}</Typography.Text>
            <Typography.Text type="secondary" className="text-sm">{record.updatedBy.email}</Typography.Text>
          </div>
        ) : (
          <Tag color="default">System</Tag>
        ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Popconfirm
          title="Restore Insurance"
          description="Are you sure you want to restore this insurance?"
          onConfirm={() => handleRestore(record.id)}
          okText="Yes"
          cancelText="No"
          icon={<ExclamationCircleOutlined style={{ color: '#52c41a' }} />}
        >
          <Button
            type="primary"
            icon={<UndoOutlined />}
            loading={restoringId === record.id}
            className="bg-green-500 hover:bg-green-600"
          >
            Restore
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {contextHolder}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <HealthInsuranceIcon />
          <h3 className="text-xl font-bold">Soft Deleted Insurance List</h3>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
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
            {/* Insurance Number Search */}
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

            {/* Reset Button */}
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
        </div>
      </Card>

      {/* Selection Actions và Rows per page */}
      <div className="flex justify-between items-center mb-4">
        <div>
          {selectedRowKeys.length > 0 && (
            <Space>
              <Text>{selectedRowKeys.length} items selected</Text>
              <Popconfirm
                title="Restore Selected Insurances"
                description="Are you sure you want to restore these insurances?"
                onConfirm={handleBulkRestore}
                okText="Yes"
                cancelText="No"
                icon={<ExclamationCircleOutlined style={{ color: '#52c41a' }} />}
              >
                <Button 
                  type="primary"
                  icon={<UndoOutlined />}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Restore Selected
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>
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

      {/* Data Table */}
      <Card className="shadow-sm">
        <Table
          bordered
          columns={columns}
          dataSource={insurances}
          loading={loading}
          pagination={false}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          className="border rounded-lg"
        />

        {/* Bottom Pagination */}
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
      </Card>
    </div>
  );
} 