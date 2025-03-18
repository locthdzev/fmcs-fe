import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Pagination,
  Input,
  Select,
  Row,
  Col,
  Tag,
  Popconfirm,
  Tooltip,
  Badge,
  Empty,
} from "antd";
import { toast } from "react-toastify";
import {
  getSoftDeletedHealthCheckResults,
  restoreSoftDeletedHealthCheckResults,
  HealthCheckResultsResponseDTO,
} from "@/api/healthcheckresult";
import {
  SearchOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import moment from "moment";

const { Title, Text } = Typography;
const { Option } = Select;

export const SoftDeletedHealthCheckResults: React.FC = () => {
  const router = useRouter();
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckResultsResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [sortBy, setSortBy] = useState("CheckupDate");
  const [ascending, setAscending] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchSoftDeletedHealthCheckResults = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSoftDeletedHealthCheckResults(
        currentPage,
        pageSize,
        userSearch || undefined,
        staffSearch || undefined,
        sortBy,
        ascending
      );
      
      if (response.isSuccess) {
        setHealthCheckResults(response.data);
        setTotal(response.totalRecords);
      } else {
        toast.error(response.message || "Không thể tải danh sách kết quả khám đã xóa");
      }
    } catch (error) {
      toast.error("Không thể tải danh sách kết quả khám đã xóa");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, userSearch, staffSearch, sortBy, ascending]);

  useEffect(() => {
    fetchSoftDeletedHealthCheckResults();
  }, [fetchSoftDeletedHealthCheckResults]);

  const handleRestore = async (ids: string[]) => {
    try {
      const response = await restoreSoftDeletedHealthCheckResults(ids);
      if (response.isSuccess) {
        toast.success("Khôi phục kết quả khám thành công!");
        setSelectedRowKeys([]);
        fetchSoftDeletedHealthCheckResults();
      } else {
        toast.error(response.message || "Không thể khôi phục kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể khôi phục kết quả khám");
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    return moment(date).format('DD/MM/YYYY');
  };

  const columns = [
    {
      title: "Bệnh nhân",
      render: (record: HealthCheckResultsResponseDTO) => (
        <div>
          <Text strong>{record.user.fullName}</Text>
          <div>
            <Text type="secondary" className="text-sm">{record.user.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Ngày khám",
      render: (record: HealthCheckResultsResponseDTO) => formatDate(record.checkupDate),
      sorter: true,
    },
    {
      title: "Bác sĩ / Y tá",
      render: (record: HealthCheckResultsResponseDTO) => (
        <div>
          <Text>{record.staff.fullName}</Text>
          <div>
            <Text type="secondary" className="text-sm">{record.staff.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Thao tác",
      render: (record: HealthCheckResultsResponseDTO) => (
        <Space>
          <Tooltip title="Khôi phục">
            <Button
              type="primary"
              icon={<UndoOutlined />}
              onClick={() => handleRestore([record.id])}
            >
              Khôi phục
            </Button>
          </Tooltip>
        </Space>
      ),
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
                Kết quả khám đã xóa tạm thời
              </Title>
            </Space>
          </Col>
          <Col span={24}>
            <Space size="middle" wrap>
              <Input
                placeholder="Tìm theo bệnh nhân"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                allowClear
              />
              <Input
                placeholder="Tìm theo bác sĩ/y tá"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="Sắp xếp theo"
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                style={{ width: 150 }}
              >
                <Option value="CheckupDate">Ngày khám</Option>
                <Option value="CreatedAt">Ngày tạo</Option>
                <Option value="UpdatedAt">Ngày cập nhật</Option>
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
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  {selectedRowKeys.length > 0 && (
                    <Popconfirm
                      title="Bạn có chắc chắn muốn khôi phục các kết quả khám đã chọn?"
                      onConfirm={() => handleRestore(selectedRowKeys as string[])}
                      okText="Xác nhận"
                      cancelText="Hủy"
                    >
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                      >
                        Khôi phục đã chọn ({selectedRowKeys.length})
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </Col>
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
        <Table
          columns={columns}
          dataSource={healthCheckResults}
          loading={loading}
          pagination={false}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          locale={{
            emptyText: <Empty description="Không có kết quả khám đã xóa" />,
          }}
          className="border rounded-lg"
        />
      </Card>

      <Card className="mt-4 shadow-sm">
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">
              Tổng cộng {total} kết quả khám đã xóa
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