import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Pagination,
  Select,
  Row,
  Col,
  Tag,
  Timeline,
  Tooltip,
  Badge,
  Empty,
  Skeleton,
  Input,
  DatePicker,
} from "antd";
import { toast } from "react-toastify";
import {
  getAllHealthCheckResultHistories,
  exportAllHealthCheckResultHistoriesToExcel,
  HealthCheckResultHistoryResponseDTO,
} from "@/api/healthcheckresult";
import {
  ArrowLeftOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import moment from "moment";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export const HealthCheckResultHistory: React.FC = () => {
  const router = useRouter();
  const [histories, setHistories] = useState<HealthCheckResultHistoryResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("ActionDate");
  const [ascending, setAscending] = useState(false);
  
  // New search filters
  const [healthCheckResultCode, setHealthCheckResultCode] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();
  const [actionDateRange, setActionDateRange] = useState<[moment.Moment | null, moment.Moment | null] | null>(null);
  const [performedBySearch, setPerformedBySearch] = useState<string | undefined>();
  const [previousStatus, setPreviousStatus] = useState<string | undefined>();
  const [newStatus, setNewStatus] = useState<string | undefined>();
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [exportLoading, setExportLoading] = useState(false);

  const fetchHistories = useCallback(async () => {
    setLoading(true);
    try {
      const actionStartDate = actionDateRange && actionDateRange[0] 
        ? actionDateRange[0].format('YYYY-MM-DD') 
        : undefined;
      const actionEndDate = actionDateRange && actionDateRange[1] 
        ? actionDateRange[1].format('YYYY-MM-DD') 
        : undefined;
        
      const response = await getAllHealthCheckResultHistories(
        currentPage,
        pageSize,
        healthCheckResultCode,
        action,
        actionStartDate,
        actionEndDate,
        performedBySearch,
        previousStatus,
        newStatus,
        rejectionReason,
        sortBy,
        ascending
      );
      
      if (response.isSuccess) {
        setHistories(response.data);
        setTotal(response.totalRecords);
      } else {
        toast.error(response.message || "Không thể tải lịch sử kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể tải lịch sử kết quả khám");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage, 
    pageSize, 
    sortBy, 
    ascending, 
    healthCheckResultCode, 
    action,
    actionDateRange,
    performedBySearch,
    previousStatus,
    newStatus,
    rejectionReason
  ]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const actionStartDate = actionDateRange && actionDateRange[0] 
        ? actionDateRange[0].format('YYYY-MM-DD') 
        : undefined;
      const actionEndDate = actionDateRange && actionDateRange[1] 
        ? actionDateRange[1].format('YYYY-MM-DD') 
        : undefined;
        
      await exportAllHealthCheckResultHistoriesToExcel(
        currentPage,
        pageSize,
        healthCheckResultCode,
        action,
        actionStartDate,
        actionEndDate,
        performedBySearch,
        previousStatus,
        newStatus,
        rejectionReason,
        sortBy,
        ascending
      );
    } catch (error) {
      toast.error("Không thể xuất file Excel");
    } finally {
      setExportLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    return moment(date).format('DD/MM/YYYY');
  };

  const formatDateTime = (datetime: string | undefined) => {
    if (!datetime) return '';
    return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
  };

  const getActionColor = (action: string | undefined) => {
    if (!action) return 'default';
    if (action.includes('Created')) return 'green';
    if (action.includes('Updated') || action.includes('Approved')) return 'blue';
    if (action.includes('Cancelled') || action.includes('Rejected')) return 'red';
    return 'default';
  };

  const getActionIcon = (action: string | undefined) => {
    if (!action) return <HistoryOutlined />;
    if (action.includes('Created')) return <PlusOutlined />;
    if (action.includes('Updated')) return <EditOutlined />;
    if (action.includes('Approved')) return <CheckCircleOutlined />;
    if (action.includes('Cancelled') || action.includes('Rejected')) return <CloseCircleOutlined />;
    return <HistoryOutlined />;
  };

  const columns = [
    {
      title: "Mã kết quả khám",
      dataIndex: "healthCheckResultCode",
      width: '15%',
    },
    {
      title: "Thao tác",
      render: (record: HealthCheckResultHistoryResponseDTO) => (
        <Space>
          {getActionIcon(record.action)}
          <Text>{record.action}</Text>
        </Space>
      ),
      width: '20%',
    },
    {
      title: "Thời gian",
      dataIndex: "actionDate",
      render: (actionDate: string) => formatDateTime(actionDate),
      sorter: true,
      width: '20%',
    },
    {
      title: "Người thực hiện",
      render: (record: HealthCheckResultHistoryResponseDTO) => (
        <div>
          <Text>{record.performedBy?.fullName}</Text>
          <div>
            <Text type="secondary" className="text-sm">{record.performedBy?.email}</Text>
          </div>
        </div>
      ),
      width: '20%',
    },
    {
      title: "Chi tiết",
      render: (record: HealthCheckResultHistoryResponseDTO) => (
        <Space direction="vertical" size="small">
          {record.previousStatus && record.newStatus && (
            <div>
              <Text type="secondary">Trạng thái: </Text>
              <Tag color={getActionColor(record.previousStatus)}>{record.previousStatus}</Tag>
              <Text type="secondary"> → </Text>
              <Tag color={getActionColor(record.newStatus)}>{record.newStatus}</Tag>
            </div>
          )}
          {record.rejectionReason && (
            <div>
              <Text type="secondary">Lý do: {record.rejectionReason}</Text>
            </div>
          )}
          {record.changeDetails && (
            <div>
              <Text type="secondary">Chi tiết: {record.changeDetails}</Text>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: "Thao tác",
      render: (record: HealthCheckResultHistoryResponseDTO) => (
        <Space>
          <Button
            type="primary"
            onClick={() => router.push(`/health-check-result/${record.healthCheckResultId}`)}
          >
            Xem kết quả khám
          </Button>
        </Space>
      ),
      width: '15%',
    },
  ];

  return (
    <div className="p-6">
      <Card className="mb-4 shadow-sm">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space align="center">
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/health-check-result/management')}
              >
                Quay lại
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                Lịch sử kết quả khám
              </Title>
            </Space>
          </Col>
          
          {/* Search filters */}
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Input
                  placeholder="Tìm theo mã kết quả khám"
                  prefix={<SearchOutlined />}
                  value={healthCheckResultCode}
                  onChange={(e) => setHealthCheckResultCode(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={8}>
                <Input
                  placeholder="Tìm theo người thực hiện"
                  prefix={<SearchOutlined />}
                  value={performedBySearch}
                  onChange={(e) => setPerformedBySearch(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Loại thao tác"
                  value={action}
                  onChange={(value) => setAction(value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="Created">Tạo mới</Option>
                  <Option value="Updated">Cập nhật</Option>
                  <Option value="Approved">Phê duyệt</Option>
                  <Option value="Cancelled">Hủy bỏ</Option>
                </Select>
              </Col>
              <Col span={8}>
                <RangePicker 
                  style={{ width: '100%' }}
                  placeholder={['Từ ngày', 'Đến ngày']}
                  onChange={(dates) => setActionDateRange(dates as [moment.Moment | null, moment.Moment | null] | null)}
                />
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Trạng thái trước"
                  value={previousStatus}
                  onChange={(value) => setPreviousStatus(value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="WaitingForApproval">Chờ phê duyệt</Option>
                  <Option value="Approved">Đã phê duyệt</Option>
                  <Option value="Completed">Hoàn thành</Option>
                  <Option value="CancelledCompletely">Hủy hoàn toàn</Option>
                  <Option value="CancelledForAdjustment">Hủy để điều chỉnh</Option>
                </Select>
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Trạng thái sau"
                  value={newStatus}
                  onChange={(value) => setNewStatus(value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="WaitingForApproval">Chờ phê duyệt</Option>
                  <Option value="Approved">Đã phê duyệt</Option>
                  <Option value="Completed">Hoàn thành</Option>
                  <Option value="CancelledCompletely">Hủy hoàn toàn</Option>
                  <Option value="CancelledForAdjustment">Hủy để điều chỉnh</Option>
                </Select>
              </Col>
              <Col span={24}>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />} 
                    onClick={() => {
                      setCurrentPage(1);
                      fetchHistories();
                    }}
                  >
                    Tìm kiếm
                  </Button>
                  <Button 
                    icon={<FileExcelOutlined />} 
                    onClick={handleExport}
                    loading={exportLoading}
                  >
                    Xuất Excel
                  </Button>
                </Space>
              </Col>
            </Row>
          </Col>
          
          <Col span={24}>
            <Space size="middle" wrap>
              <Select
                placeholder="Sắp xếp theo"
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                style={{ width: 150 }}
              >
                <Option value="ActionDate">Thời gian thực hiện</Option>
              </Select>
              <Select
                placeholder="Thứ tự"
                value={ascending ? "asc" : "desc"}
                onChange={(value) => setAscending(value === "asc")}
                style={{ width: 120 }}
              >
                <Option value="asc">Tăng dần</Option>
                <Option value="desc">Giảm dần</Option>
              </Select>
            </Space>
          </Col>
          <Col span={24}>
            <Row justify="end" align="middle">
              <Col>
                <Space align="center">
                  <Text type="secondary">
                    Dòng mỗi trang:
                  </Text>
                  <Select
                    value={pageSize}
                    onChange={(value) => {
                      setPageSize(value);
                      setCurrentPage(1);
                    }}
                    className="min-w-[80px]"
                  >
                    <Option value={5}>5</Option>
                    <Option value={10}>10</Option>
                    <Option value={15}>15</Option>
                    <Option value={20}>20</Option>
                  </Select>
                </Space>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm">
        {loading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={histories}
            loading={loading}
            pagination={false}
            rowKey="id"
            locale={{
              emptyText: <Empty description="Không có lịch sử kết quả khám" />,
            }}
            className="border rounded-lg"
          />
        )}
      </Card>

      <Card className="mt-4 shadow-sm">
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">
              Tổng cộng {total} lịch sử
            </Text>
          </Col>
          <Col>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger={false}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}; 