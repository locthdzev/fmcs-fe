import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  DatePicker,
  Pagination,
  Popconfirm,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Badge,
  Tag,
  Tooltip,
  Empty,
  Form,
  Modal,
  Input as AntInput
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthCheckResults,
  HealthCheckResultsResponseDTO,
  editCancelledHealthCheckResult
} from "@/api/healthcheckresult";
import { 
  SearchOutlined, 
  EditOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { useRouter } from 'next/router';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = AntInput;

const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return '';
  return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
};

export const HealthCheckResultAdjustmentList: React.FC = () => {
  const router = useRouter();
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckResultsResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [checkupDateRange, setCheckupDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [sortBy, setSortBy] = useState("CancelledDate");
  const [ascending, setAscending] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentResult, setCurrentResult] = useState<HealthCheckResultsResponseDTO | null>(null);
  const [form] = Form.useForm();

  const fetchHealthCheckResults = useCallback(async () => {
    setLoading(true);
    try {
      const checkupStartDate = checkupDateRange[0] ? checkupDateRange[0].format('YYYY-MM-DD') : undefined;
      const checkupEndDate = checkupDateRange[1] ? checkupDateRange[1].format('YYYY-MM-DD') : undefined;

      const response = await getAllHealthCheckResults(
        currentPage,
        pageSize,
        userSearch || undefined,
        staffSearch || undefined,
        sortBy,
        ascending,
        "CancelledForAdjustment", // Match the actual backend value
        checkupStartDate,
        checkupEndDate
      );

      if (response.isSuccess) {
        setHealthCheckResults(response.data);
        setTotal(response.totalRecords);
      } else {
        toast.error(response.message || "Failed to load health check results cancelled for adjustment");
      }
    } catch (error) {
      toast.error("Failed to load health check results cancelled for adjustment");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    userSearch,
    staffSearch,
    sortBy,
    ascending,
    checkupDateRange
  ]);

  useEffect(() => {
    fetchHealthCheckResults();
  }, [fetchHealthCheckResults]);
  
  const handleEdit = (record: HealthCheckResultsResponseDTO) => {
    setCurrentResult(record);
    form.setFieldsValue({
      diagnosis: record.diagnosis || '',
      treatmentPlan: record.treatmentPlan || '',
      followUpRequired: record.followUpRequired || false,
      followUpDate: record.followUpDate ? moment(record.followUpDate) : null,
      notes: record.notes || ''
    });
    setIsModalVisible(true);
  };
  
  const handleSubmitEdit = async (values: any) => {
    if (!currentResult) return;
    
    try {
      const data = {
        ...values,
        followUpDate: values.followUpRequired && values.followUpDate ? 
          values.followUpDate.format('YYYY-MM-DD') : undefined
      };
      
      const response = await editCancelledHealthCheckResult(currentResult.id, data);
      
      if (response.isSuccess) {
        toast.success("Health check result updated successfully");
        setIsModalVisible(false);
        fetchHealthCheckResults();
      } else {
        toast.error(response.message || "Failed to update health check result");
      }
    } catch (error) {
      toast.error("Failed to update health check result");
    }
  };
  
  const columns = [
    {
      title: "Patient",
      dataIndex: "user",
      render: (user: any) => (
        <div>
          <Text strong>{user?.fullName}</Text>
          <div>
            <Text type="secondary" className="text-sm">{user?.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Checkup Date",
      dataIndex: "checkupDate",
      render: (checkupDate: string) => formatDate(checkupDate),
      sorter: true,
    },
    {
      title: "Medical Staff",
      dataIndex: "staff",
      render: (staff: any) => (
        <div>
          <Text>{staff?.fullName}</Text>
          <div>
            <Text type="secondary" className="text-sm">{staff?.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Cancelled Date",
      dataIndex: "cancelledDate",
      render: (cancelledDate: string) => formatDateTime(cancelledDate),
    },
    {
      title: "Cancellation Reason",
      dataIndex: "cancellationReason",
      render: (reason: string) => (
        <Tooltip title={reason}>
          <Paragraph ellipsis={{ rows: 2 }}>
            {reason || "No reason provided"}
          </Paragraph>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      render: (record: HealthCheckResultsResponseDTO) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/health-check-result/${record.id}`)}
            />
          </Tooltip>
          
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="text-blue-600"
            />
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
                Back
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                Health Check Results Cancelled for Adjustment
              </Title>
            </Space>
          </Col>
          <Col span={24}>
            <Space size="middle" wrap>
              <Input
                placeholder="Search by patient"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                allowClear
              />
              <Input
                placeholder="Search by medical staff"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                allowClear
              />
              <RangePicker
                placeholder={["From checkup date", "To checkup date"]}
                onChange={(dates) => {
                  setCheckupDateRange(dates as [moment.Moment | null, moment.Moment | null]);
                }}
                allowClear
              />
            </Space>
          </Col>
          <Col span={24}>
            <Space size="middle" wrap>
              <Select
                placeholder="Sort by"
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                style={{ width: 150 }}
              >
                <Option value="CancelledDate">Cancelled Date</Option>
                <Option value="CheckupDate">Checkup Date</Option>
                <Option value="CreatedAt">Created Date</Option>
              </Select>
              <Select
                placeholder="Order"
                value={ascending ? "asc" : "desc"}
                onChange={(value) => setAscending(value === "asc")}
                style={{ width: 120 }}
              >
                <Option value="asc">Ascending</Option>
                <Option value="desc">Descending</Option>
              </Select>
            </Space>
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
          locale={{
            emptyText: <Empty description="No health check results cancelled for adjustment found" />,
          }}
          className="border rounded-lg"
        />
      </Card>

      <Card className="mt-4 shadow-sm">
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">
              Total: {total} health check results cancelled for adjustment
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
              showSizeChanger
              onShowSizeChange={(current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              }}
              pageSizeOptions={['5', '10', '15', '20']}
            />
          </Col>
        </Row>
      </Card>
      
      <Modal
        title="Edit Health Check Result"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitEdit}
        >
          <Form.Item
            name="diagnosis"
            label="Diagnosis"
            rules={[{ required: true, message: 'Please enter the diagnosis' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          
          <Form.Item
            name="treatmentPlan"
            label="Treatment Plan"
            rules={[{ required: true, message: 'Please enter the treatment plan' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          
          <Form.Item
            name="followUpRequired"
            valuePropName="checked"
            label="Follow-up Required"
          >
            <Select>
              <Option value={true}>Yes</Option>
              <Option value={false}>No</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="followUpDate"
            label="Follow-up Date"
            dependencies={['followUpRequired']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('followUpRequired') && !value) {
                    return Promise.reject('Please select a follow-up date');
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker 
              disabled={Form.useWatch('followUpRequired', form) !== true}
              disabledDate={(current) => current && current < moment().endOf('day')}
            />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <TextArea rows={3} />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}; 