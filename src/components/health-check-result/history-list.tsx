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
  Collapse,
  Modal,
  Checkbox,
  Form,
} from "antd";
import { toast } from "react-toastify";
import {
  getAllHealthCheckResultHistories,
  exportAllHealthCheckResultHistoriesToExcelWithConfig,
  getHealthCheckResultHistoriesByResultId,
  HealthCheckResultHistoryResponseDTO,
  HealthCheckResultHistoryExportConfigDTO,
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
  CaretRightOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import moment from "moment";
import axios from "axios";
import { message } from "antd";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

interface HealthCheckResultGroup {
  code: string;
  healthCheckResultId: string;
  histories: HealthCheckResultHistoryResponseDTO[];
  loading: boolean;
}

export const HealthCheckResultHistory: React.FC = () => {
  const router = useRouter();
  const [resultGroups, setResultGroups] = useState<HealthCheckResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("ActionDate");
  const [ascending, setAscending] = useState(false);
  
  // Search filters
  const [healthCheckResultCode, setHealthCheckResultCode] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();
  const [actionDateRange, setActionDateRange] = useState<[moment.Moment | null, moment.Moment | null] | null>(null);
  const [performedBySearch, setPerformedBySearch] = useState<string | undefined>();
  const [previousStatus, setPreviousStatus] = useState<string | undefined>();
  const [newStatus, setNewStatus] = useState<string | undefined>();
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfigModal, setShowExportConfigModal] = useState(false);
  const [uniqueHealthCheckCodes, setUniqueHealthCheckCodes] = useState<string[]>([]);
  const [uniquePerformers, setUniquePerformers] = useState<{id: string; fullName: string; email: string}[]>([]);

  // New API Function to get distinct HealthCheckResult codes with pagination
  const getDistinctHealthCheckResultCodes = async (
    page: number,
    pageSize: number,
    filters: {
      healthCheckResultCode?: string;
      action?: string;
      actionStartDate?: string;
      actionEndDate?: string;
      performedBySearch?: string;
      previousStatus?: string;
      newStatus?: string;
      rejectionReason?: string;
      sortBy?: string;
      ascending?: boolean;
    }
  ) => {
    try {
      // First, get all histories with the provided filters
      const response = await getAllHealthCheckResultHistories(
        1, // Start with page 1
        1000, // Get a large number of records to extract unique codes
        filters.healthCheckResultCode,
        filters.action,
        filters.actionStartDate,
        filters.actionEndDate,
        filters.performedBySearch,
        filters.previousStatus,
        filters.newStatus,
        filters.rejectionReason,
        filters.sortBy,
        filters.ascending
      );

      if (response.isSuccess) {
        // Extract unique health check result codes
        const histories = response.data as HealthCheckResultHistoryResponseDTO[];
        const uniqueCodesMap = new Map<string, {code: string, id: string}>();
        
        histories.forEach((history) => {
          if (!uniqueCodesMap.has(history.healthCheckResultCode)) {
            uniqueCodesMap.set(history.healthCheckResultCode, {
              code: history.healthCheckResultCode,
              id: history.healthCheckResultId
            });
          }
        });
        
        const uniqueCodes = Array.from(uniqueCodesMap.values());

        // Sort the unique codes if needed
        if (filters.sortBy?.toLowerCase() === "healthcheckresultcode") {
          uniqueCodes.sort((a, b) => {
            if (filters.ascending) {
              return a.code.localeCompare(b.code);
            } else {
              return b.code.localeCompare(a.code);
            }
          });
        }

        // Calculate total and paginated results
        const total = uniqueCodes.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, total);
        const paginatedCodes = uniqueCodes.slice(startIndex, endIndex);

        return {
          codes: paginatedCodes,
          total: total,
          isSuccess: true
        };
      }
      return { codes: [], total: 0, isSuccess: false };
    } catch (error) {
      console.error("Error fetching distinct codes:", error);
      return { codes: [], total: 0, isSuccess: false };
    }
  };

  // Lấy danh sách các mã kết quả khám duy nhất với phân trang
  const fetchDistinctHealthCheckResults = useCallback(async () => {
    setLoading(true);
    try {
      const actionStartDate = actionDateRange && actionDateRange[0] 
        ? actionDateRange[0].format('YYYY-MM-DD') 
        : undefined;
      const actionEndDate = actionDateRange && actionDateRange[1] 
        ? actionDateRange[1].format('YYYY-MM-DD') 
        : undefined;
        
      // Get distinct codes first
      const distinctCodesResult = await getDistinctHealthCheckResultCodes(
        currentPage,
        pageSize,
        {
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
        }
      );
      
      if (distinctCodesResult.isSuccess) {
        // Create result groups from distinct codes
        const groups: HealthCheckResultGroup[] = distinctCodesResult.codes.map(item => ({
          code: item.code,
          healthCheckResultId: item.id,
          histories: [],
          loading: true
        }));
        
        setResultGroups(groups);
        setTotal(distinctCodesResult.total);
        
        // Lấy lịch sử chi tiết cho mỗi nhóm
        for (const group of groups) {
          fetchHistoriesForResult(group.healthCheckResultId);
        }
      } else {
        toast.error("Không thể tải danh sách mã kết quả khám");
        setLoading(false);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách mã kết quả khám");
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

  // Lấy tất cả lịch sử cho một mã kết quả khám cụ thể
  const fetchHistoriesForResult = async (healthCheckResultId: string) => {
    try {
      const response = await getHealthCheckResultHistoriesByResultId(healthCheckResultId);
      
      if (response.isSuccess) {
        setResultGroups(prevGroups => 
          prevGroups.map(group => 
            group.healthCheckResultId === healthCheckResultId 
              ? { ...group, histories: response.data, loading: false } 
              : group
          )
        );
      } else {
        toast.error(response.message || `Không thể tải lịch sử cho mã kết quả khám`);
      }
    } catch (error) {
      toast.error(`Không thể tải lịch sử cho mã kết quả khám`);
    } finally {
      // Kiểm tra xem tất cả các nhóm đã tải xong chưa
      setResultGroups(prevGroups => {
        const allLoaded = prevGroups.every(group => !group.loading);
        if (allLoaded) {
          setLoading(false);
        }
        return prevGroups;
      });
    }
  };

  // Fetch unique codes and performers for select inputs
  const fetchUniqueCodesAndPerformers = useCallback(async () => {
    try {
      const result = await getAllHealthCheckResultHistories(
        1,
        9999, // Large enough to get all records
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        "ActionDate",
        false
      );
      
      if (result.isSuccess && result.data) {
        // Extract unique health check result codes
        const uniqueCodes = Array.from(new Set(
          result.data.map((history: HealthCheckResultHistoryResponseDTO) => history.healthCheckResultCode)
        ));
        setUniqueHealthCheckCodes(uniqueCodes.filter(Boolean) as string[]);
        
        // Extract unique performers
        const performersMap = new Map();
        result.data.forEach((history: HealthCheckResultHistoryResponseDTO) => {
          if (history.performedBy && !performersMap.has(history.performedBy.id)) {
            performersMap.set(history.performedBy.id, history.performedBy);
          }
        });
        
        const uniquePerformersList = Array.from(performersMap.values());
        setUniquePerformers(uniquePerformersList);
      }
    } catch (error) {
      console.error("Error fetching unique values:", error);
    }
  }, []);

  useEffect(() => {
    fetchDistinctHealthCheckResults();
    fetchUniqueCodesAndPerformers();
  }, [fetchDistinctHealthCheckResults, fetchUniqueCodesAndPerformers]);

  const [exportConfig, setExportConfig] = useState<HealthCheckResultHistoryExportConfigDTO & {
    filterHealthCheckResultCode?: string;
    filterPerformedBy?: string;
    filterAction?: string;
    filterActionDateRange?: [moment.Moment | null, moment.Moment | null] | null;
    filterPreviousStatus?: string;
    filterNewStatus?: string;
    sortOption?: string;
    sortDirection?: string;
  }>({
    exportAllPages: true,
    includeAction: true,
    includeActionDate: true,
    includePerformedBy: true,
    includePreviousStatus: true,
    includeNewStatus: true,
    includeRejectionReason: true,
    includeChangeDetails: true,
    groupByHealthCheckResultCode: true,
    filterHealthCheckResultCode: healthCheckResultCode,
    filterPerformedBy: performedBySearch,
    filterAction: action,
    filterActionDateRange: actionDateRange,
    filterPreviousStatus: previousStatus,
    filterNewStatus: newStatus,
    sortOption: sortBy,
    sortDirection: ascending ? "asc" : "desc"
  });
  const [form] = Form.useForm();

  // Thêm hàm mới để cập nhật giá trị ban đầu của form
  const setFormInitialValues = () => {
    form.setFieldsValue({
      exportAllPages: true,
      includeAction: exportConfig.includeAction,
      includeActionDate: exportConfig.includeActionDate,
      includePerformedBy: exportConfig.includePerformedBy,
      includePreviousStatus: exportConfig.includePreviousStatus,
      includeNewStatus: exportConfig.includeNewStatus,
      includeRejectionReason: exportConfig.includeRejectionReason,
      includeChangeDetails: exportConfig.includeChangeDetails,
      filterHealthCheckResultCode: healthCheckResultCode,
      filterPerformedBy: performedBySearch,
      filterAction: action,
      filterActionDateRange: actionDateRange,
      filterPreviousStatus: previousStatus,
      filterNewStatus: newStatus,
      sortOption: sortBy,
      sortDirection: ascending ? "asc" : "desc"
    });
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const actionStartDate = actionDateRange && actionDateRange[0] 
        ? actionDateRange[0].format('YYYY-MM-DD') 
        : undefined;
      const actionEndDate = actionDateRange && actionDateRange[1] 
        ? actionDateRange[1].format('YYYY-MM-DD') 
        : undefined;
        
      // Đảm bảo đã tải danh sách mã kết quả khám và người thực hiện duy nhất
      if (uniqueHealthCheckCodes.length === 0 || uniquePerformers.length === 0) {
        await fetchUniqueCodesAndPerformers();
      }
      
      // Cập nhật giá trị ban đầu cho form
      setFormInitialValues();
      
      setShowExportConfigModal(true);
      setExportLoading(false);
    } catch (error) {
      toast.error("Không thể xuất file Excel");
      setExportLoading(false);
    }
  };

  const handleExportWithConfig = async () => {
    setExportLoading(true);
    try {
      const values = form.getFieldsValue();
      
      // Build export configuration
      const config = {
        exportAllPages: values.exportAllPages || false,
        includeAction: values.includeAction !== false, // Default to true
        includeActionDate: values.includeActionDate !== false, // Default to true
        includePerformedBy: values.includePerformedBy !== false, // Default to true
        includePreviousStatus: values.includePreviousStatus !== false, // Default to true
        includeNewStatus: values.includeNewStatus !== false, // Default to true
        includeRejectionReason: values.includeRejectionReason !== false, // Default to true
        includeChangeDetails: values.includeChangeDetails !== false, // Default to true
        groupByHealthCheckResultCode: true,
      };
      
      // Xử lý dữ liệu ngày tháng
      const actionDateRange = values.filterActionDateRange;
      const actionStartDate = actionDateRange && actionDateRange[0] 
        ? actionDateRange[0].format('YYYY-MM-DD') 
        : undefined;
      const actionEndDate = actionDateRange && actionDateRange[1] 
        ? actionDateRange[1].format('YYYY-MM-DD') 
        : undefined;
      
      // Xác định thứ tự sắp xếp
      const sortDirection = values.sortDirection === "asc";
      
      // Gọi API với các thông số mới
      await exportAllHealthCheckResultHistoriesToExcelWithConfig(
        config,
        currentPage,
        pageSize,
        values.exportAllPages ? undefined : values.filterHealthCheckResultCode,
        values.exportAllPages ? undefined : values.filterAction,
        values.exportAllPages ? undefined : actionStartDate,
        values.exportAllPages ? undefined : actionEndDate,
        values.exportAllPages ? undefined : values.filterPerformedBy,
        values.exportAllPages ? undefined : values.filterPreviousStatus,
        values.exportAllPages ? undefined : values.filterNewStatus,
        values.exportAllPages ? undefined : rejectionReason,
        values.sortOption || "ActionDate",
        sortDirection
      );
      
      closeConfigModal();
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.message || "Không thể xuất file Excel");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportConfigChange = (changedValues: any) => {
    setExportConfig(prev => ({ ...prev, ...changedValues }));
  };

  const closeConfigModal = () => {
    setShowExportConfigModal(false);
    setExportLoading(false);
  };

  const isExportAllPages = () => {
    return form.getFieldValue('exportAllPages');
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
                      fetchDistinctHealthCheckResults();
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
                <Option value="healthCheckResultCode">Mã kết quả khám</Option>
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
                    Nhóm mỗi trang:
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

      {loading ? (
      <Card className="shadow-sm">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      ) : (
        resultGroups.length > 0 ? (
          resultGroups.map((group, index) => (
            <Card key={group.code} className="shadow-sm mb-4">
              <div className="border-b pb-3 mb-4">
                <div className="flex justify-between items-center">
                  <Title level={5} className="m-0">
                    Mã kết quả khám: {group.code}
                  </Title>
                  <Button 
                    type="primary" 
                    onClick={() => router.push(`/health-check-result/${group.healthCheckResultId}`)}
                  >
                    Xem kết quả khám
                  </Button>
                </div>
              </div>
              
              {group.loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : (
                <Collapse 
                  defaultActiveKey={["1"]}
                  expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                >
                  <Panel header="Lịch sử thao tác" key="1">
                    <Timeline
                      mode="left"
                      items={group.histories.map(history => ({
                        color: getActionColor(history.action),
                        dot: getActionIcon(history.action),
                        children: (
                          <Card size="small" className="mb-2 hover:shadow-md transition-shadow">
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <div className="font-medium">{history.action}</div>
                                <div className="text-sm text-gray-500">
                                  {formatDateTime(history.actionDate)}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-1">
                                <div className="flex">
                                  <div className="w-[180px] text-gray-500">Người thực hiện:</div>
                                  <div>{history.performedBy?.fullName} ({history.performedBy?.email})</div>
                                </div>
                                
                                {history.previousStatus && history.newStatus && (
                                  <div className="flex">
                                    <div className="w-[180px] text-gray-500">Trạng thái:</div>
                                    <div className="flex-1">
                                      <Tag color={getActionColor(history.previousStatus)}>{history.previousStatus}</Tag>
                                      <Text type="secondary"> → </Text>
                                      <Tag color={getActionColor(history.newStatus)}>{history.newStatus}</Tag>
                                    </div>
                                  </div>
                                )}
                                
                                {history.rejectionReason && (
                                  <div className="flex">
                                    <div className="w-[180px] text-gray-500">Lý do:</div>
                                    <div className="flex-1">{history.rejectionReason}</div>
                                  </div>
                                )}
                                
                                {history.changeDetails && (
                                  <div className="flex">
                                    <div className="w-[180px] text-gray-500">Chi tiết:</div>
                                    <div className="flex-1">{history.changeDetails}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        )
                      }))}
                    />
                  </Panel>
                </Collapse>
        )}
      </Card>
          ))
        ) : (
          <Card className="shadow-sm">
            <Empty description="Không có lịch sử kết quả khám" />
          </Card>
        )
      )}

      <Card className="mt-4 shadow-sm">
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">
              Tổng cộng {total} nhóm kết quả khám
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

      <Modal
        title="Cấu hình xuất file Excel"
        open={showExportConfigModal}
        onCancel={closeConfigModal}
        width={800}
        footer={[
          <Button key="cancel" onClick={closeConfigModal}>
            Hủy
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={exportLoading}
            onClick={handleExportWithConfig}
          >
            Xuất file
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={exportConfig}
          onValuesChange={handleExportConfigChange}
        >
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Typography.Title level={5}>Tùy chọn cơ bản</Typography.Title>
            </Col>
            
            <Col span={24}>
              <Form.Item 
                name="exportAllPages" 
                valuePropName="checked"
                style={{ marginBottom: "12px" }}
              >
                <Checkbox>Xuất tất cả dữ liệu (bỏ qua phân trang)</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={24} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Typography.Title level={5}>Bộ lọc dữ liệu</Typography.Title>
            </Col>
            
            <Col span={12} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item 
                label="Lọc theo mã kết quả khám"
                name="filterHealthCheckResultCode"
              >
                <Select
                  placeholder="Chọn mã kết quả khám"
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string).toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {uniqueHealthCheckCodes.map(code => (
                    <Option key={code} value={code}>{code}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item 
                label="Lọc theo người thực hiện"
                name="filterPerformedBy"
              >
                <Select
                  placeholder="Chọn người thực hiện"
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.title as string).toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  optionLabelProp="title"
                >
                  {uniquePerformers.map(performer => (
                    <Option 
                      key={performer.id} 
                      value={performer.id}
                      title={`${performer.fullName} (${performer.email})`}
                    >
                      <div>
                        <div>{performer.fullName}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{performer.email}</div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item 
                label="Loại thao tác"
                name="filterAction"
              >
                <Select
                  placeholder="Chọn loại thao tác"
                  style={{ width: '100%' }}
                  allowClear
                  defaultValue={action}
                >
                  <Option value="Created">Tạo mới</Option>
                  <Option value="Updated">Cập nhật</Option>
                  <Option value="Approved">Phê duyệt</Option>
                  <Option value="Cancelled">Hủy bỏ</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item 
                label="Thời gian thực hiện"
                name="filterActionDateRange"
              >
                <RangePicker 
                  style={{ width: '100%' }}
                  placeholder={['Từ ngày', 'Đến ngày']}
                  defaultValue={actionDateRange as any}
                />
              </Form.Item>
            </Col>
            
            <Col span={12} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item 
                label="Trạng thái trước"
                name="filterPreviousStatus"
              >
                <Select
                  placeholder="Chọn trạng thái trước"
                  style={{ width: '100%' }}
                  allowClear
                  defaultValue={previousStatus}
                >
                  <Option value="WaitingForApproval">Chờ phê duyệt</Option>
                  <Option value="Approved">Đã phê duyệt</Option>
                  <Option value="Completed">Hoàn thành</Option>
                  <Option value="CancelledCompletely">Hủy hoàn toàn</Option>
                  <Option value="CancelledForAdjustment">Hủy để điều chỉnh</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item 
                label="Trạng thái sau"
                name="filterNewStatus"
              >
                <Select
                  placeholder="Chọn trạng thái sau"
                  style={{ width: '100%' }}
                  allowClear
                  defaultValue={newStatus}
                >
                  <Option value="WaitingForApproval">Chờ phê duyệt</Option>
                  <Option value="Approved">Đã phê duyệt</Option>
                  <Option value="Completed">Hoàn thành</Option>
                  <Option value="CancelledCompletely">Hủy hoàn toàn</Option>
                  <Option value="CancelledForAdjustment">Hủy để điều chỉnh</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Typography.Title level={5}>Tùy chọn sắp xếp</Typography.Title>
            </Col>
            
            <Col span={12}>
              <Form.Item 
                label="Sắp xếp theo"
                name="sortOption"
              >
                <Select
                  style={{ width: '100%' }}
                  defaultValue={sortBy}
                >
                  <Option value="ActionDate">Thời gian thực hiện</Option>
                  <Option value="healthCheckResultCode">Mã kết quả khám</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item 
                label="Thứ tự sắp xếp"
                name="sortDirection"
              >
                <Select
                  style={{ width: '100%' }}
                  defaultValue={ascending ? "asc" : "desc"}
                >
                  <Option value="asc">Tăng dần</Option>
                  <Option value="desc">Giảm dần</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Typography.Title level={5}>Chọn các cột hiển thị</Typography.Title>
            </Col>
          
            <Col span={8}>
              <Form.Item 
                name="includeAction" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Thao tác</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeActionDate" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Thời gian thao tác</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includePerformedBy" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Người thực hiện</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includePreviousStatus" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Trạng thái trước</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeNewStatus" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Trạng thái sau</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeRejectionReason" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Lý do từ chối</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeChangeDetails" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Chi tiết thay đổi</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}; 