import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Collapse,
  Descriptions,
  Tag,
  Typography,
  Spin,
  Empty,
  Divider,
  List,
  Tabs,
  Badge,
  Alert,
  Table,
  Pagination,
  Row,
  Col,
  Statistic,
  Avatar,
  Space,
} from "antd";
import {
  getCurrentUserHealthCheckResults,
  getHealthCheckResultById,
  HealthCheckResultsResponseDTO,
  HealthCheckResultsIdResponseDTO,
} from "@/api/healthcheckresult";
import dayjs from "dayjs";
import {
  CaretRightOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  AlertOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import PageContainer from "@/components/shared/PageContainer";
import PaginationFooter from "@/components/shared/PaginationFooter";
import { useRouter } from "next/router";
import { getCurrentUserPrescriptions } from "@/api/prescription";
import { getCurrentUserTreatmentPlans } from "@/api/treatment-plan";
import { PrescriptionResponseDTO } from "@/api/prescription";
import { TreatmentPlanResponseDTO } from "@/api/treatment-plan";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const statusColors: Record<string, string> = {
  "Waiting for Approval": "orange",
  FollowUpRequired: "red",
  NoFollowUpRequired: "green",
  Completed: "blue",
  CancelledCompletely: "gray",
  CancelledForAdjustment: "purple",
  SoftDeleted: "black",
};

const formatStatus = (status: string) => {
  // Format the status from camelCase to readable format
  if (status === "FollowUpRequired") return "Follow-up Required";
  if (status === "NoFollowUpRequired") return "No Follow-up Required";
  if (status === "CancelledCompletely") return "Cancelled Completely";
  if (status === "CancelledForAdjustment") return "Cancelled for Adjustment";
  if (status === "SoftDeleted") return "Soft Deleted";
  return status;
};

const getStatusIcon = (status: string) => {
  if (status === "FollowUpRequired") return <WarningOutlined style={{ color: "#f5222d" }} />;
  if (status === "NoFollowUpRequired") return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
  if (status === "Completed") return <CheckCircleOutlined style={{ color: "#1890ff" }} />;
  if (status === "CancelledCompletely" || status === "CancelledForAdjustment") return <ClockCircleOutlined style={{ color: "#faad14" }} />;
  return <FileTextOutlined />;
};

const MyHealthCheckResults: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HealthCheckResultsResponseDTO[]>([]);
  const [detailsMap, setDetailsMap] = useState<
    Record<string, HealthCheckResultsIdResponseDTO>
  >({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>(
    {}
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // State to keep track of expanded panels
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponseDTO[]>(
    []
  );
  const [treatmentPlans, setTreatmentPlans] = useState<
    TreatmentPlanResponseDTO[]
  >([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [loadingTreatmentPlans, setLoadingTreatmentPlans] = useState(false);
  const [prescriptionPage, setPrescriptionPage] = useState(1);
  const [prescriptionPageSize, setPrescriptionPageSize] = useState(10);
  const [prescriptionTotal, setPrescriptionTotal] = useState(0);
  const [treatmentPlanPage, setTreatmentPlanPage] = useState(1);
  const [treatmentPlanPageSize, setTreatmentPlanPageSize] = useState(10);
  const [treatmentPlanTotal, setTreatmentPlanTotal] = useState(0);
  const [activeTab, setActiveTab] = useState("health-check-results");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCurrentUserHealthCheckResults(page, pageSize);
      if (response.success) {
        // Updated to match PagedResultDTO structure
        const pagedResult = response.data;
        const resultData = pagedResult.data || [];
        setData(resultData);
        setTotal(pagedResult.totalRecords || 0);

        // Auto expand the first/newest item
        if (resultData.length > 0 && expandedKeys.length === 0) {
          setExpandedKeys([resultData[0].id]);
          await fetchResultDetails(resultData[0].id);
        }
      } else {
        setError(response.message || "Failed to load health check results");
      }
    } catch (error) {
      console.error("Error fetching health check results:", error);
      setError("An error occurred while fetching your health check results");
    } finally {
      setLoading(false);
    }
  };

  const fetchResultDetails = async (resultId: string) => {
    // Skip if we already have the details
    if (detailsMap[resultId]) return;

    setLoadingDetails((prev) => ({ ...prev, [resultId]: true }));
    try {
      const response = await getHealthCheckResultById(resultId);
      if (response.success) {
        setDetailsMap((prev) => ({
          ...prev,
          [resultId]: response.data,
        }));
      }
    } catch (error) {
      console.error(`Error fetching details for result ${resultId}:`, error);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [resultId]: false }));
    }
  };

  const fetchPrescriptions = useCallback(async () => {
    setLoadingPrescriptions(true);
    setError(null);
    try {
      // Lấy tất cả prescriptions, sau đó lọc ở client-side
      const response = await getCurrentUserPrescriptions(
        1,
        1000,
        "PrescriptionDate",
        false
      );
      if (response.success) {
        const pagedResult = response.data;
        // Lọc các prescriptions để loại bỏ những đơn thuốc đã bị hủy hoặc xóa mềm
        const filteredPrescriptions =
          pagedResult.data?.filter(
            (prescription: PrescriptionResponseDTO) =>
              prescription.status !== "Cancelled" &&
              prescription.status !== "SoftDeleted"
          ) || [];

        // Tính toán phân trang dựa trên dữ liệu đã lọc
        const startIndex = (prescriptionPage - 1) * prescriptionPageSize;
        const endIndex = startIndex + prescriptionPageSize;
        const paginatedPrescriptions = filteredPrescriptions.slice(
          startIndex,
          endIndex
        );

        setPrescriptions(paginatedPrescriptions);
        // Cập nhật tổng số bản ghi dựa trên số lượng sau khi lọc
        setPrescriptionTotal(filteredPrescriptions.length);
      } else {
        setError(response.message || "Failed to load prescriptions");
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      setError("An error occurred while fetching your prescriptions");
    } finally {
      setLoadingPrescriptions(false);
    }
  }, [prescriptionPage, prescriptionPageSize]);

  const fetchTreatmentPlans = useCallback(async () => {
    setLoadingTreatmentPlans(true);
    setError(null);
    try {
      // Lấy tất cả treatment plans, sau đó lọc ở client-side
      const response = await getCurrentUserTreatmentPlans(
        1,
        1000,
        "StartDate",
        false
      );
      if (response.success) {
        const pagedResult = response.data;
        // Lọc các treatment plans để chỉ hiển thị "Completed" hoặc "InProgress"
        const validStatuses = ["Completed", "InProgress"];
        const filteredTreatmentPlans =
          pagedResult.data?.filter((plan: TreatmentPlanResponseDTO) =>
            validStatuses.includes(plan.status || "")
          ) || [];

        // Tính toán phân trang dựa trên dữ liệu đã lọc
        const startIndex = (treatmentPlanPage - 1) * treatmentPlanPageSize;
        const endIndex = startIndex + treatmentPlanPageSize;
        const paginatedTreatmentPlans = filteredTreatmentPlans.slice(
          startIndex,
          endIndex
        );

        setTreatmentPlans(paginatedTreatmentPlans);
        // Cập nhật tổng số bản ghi dựa trên số lượng sau khi lọc
        setTreatmentPlanTotal(filteredTreatmentPlans.length);
      } else {
        setError(response.message || "Failed to load treatment plans");
      }
    } catch (error) {
      console.error("Error fetching treatment plans:", error);
      setError("An error occurred while fetching your treatment plans");
    } finally {
      setLoadingTreatmentPlans(false);
    }
  }, [treatmentPlanPage, treatmentPlanPageSize]);

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  useEffect(() => {
    if (activeTab === "prescriptions") {
      fetchPrescriptions();
    }
  }, [activeTab, prescriptionPage, prescriptionPageSize, fetchPrescriptions]);

  useEffect(() => {
    if (activeTab === "treatment-plans") {
      fetchTreatmentPlans();
    }
  }, [activeTab, treatmentPlanPage, treatmentPlanPageSize, fetchTreatmentPlans]);

  const handleCollapseChange = async (keys: string | string[]) => {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    setExpandedKeys(keyArray);

    // Fetch details for newly expanded panels
    for (const key of keyArray) {
      if (!detailsMap[key]) {
        await fetchResultDetails(key);
      }
    }
  };

  const handlePageChange = (newPage: number, newPageSize?: number) => {
    setPage(newPage);
    if (newPageSize) {
      setPageSize(newPageSize);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderHealthCheckResultDetails = (resultId: string) => {
    const details = detailsMap[resultId];

    if (loadingDetails[resultId]) {
      return (
        <div className="text-center py-4">
          <Spin size="default" />
          <div className="mt-2">Loading details...</div>
        </div>
      );
    }

    if (!details) {
      return <Empty description="Details not available" />;
    }

    return (
      <div className="px-4 pb-4">
        <Card
          className="mb-4 shadow-sm rounded-lg"
          title={
            <Space>
              <CalendarOutlined className="text-blue-500" />
              <span className="font-medium">Health Check Information</span>
              {details.followUpRequired && (
                <Badge
                  count="Follow-up Required"
                  style={{ backgroundColor: "#f50" }}
                />
              )}
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={24} md={12}>
              <Statistic
                title="Checkup Date"
                value={dayjs(details.checkupDate).format("DD/MM/YYYY")}
                valueStyle={{ fontSize: '14px' }}
                prefix={<CalendarOutlined className="text-blue-500 mr-2" />}
              />
            </Col>
            <Col span={24} md={12}>
              <Statistic
                title="Healthcare Provider"
                value={details.staff?.fullName || "Unknown"}
                valueStyle={{ fontSize: '14px' }}
                prefix={<UserOutlined className="text-blue-500 mr-2" />}
                formatter={(value) => (
                  <span className="text-sm">
                    {value}{" "}
                    <Text type="secondary" className="text-xs">
                      {details.staff?.email && `(${details.staff.email})`}
                    </Text>
                  </span>
                )}
              />
            </Col>
            {details.followUpRequired && details.followUpDate && (
              <Col span={24}>
                <Alert
                  message="Follow-up Required"
                  description={
                    <span>
                      Please schedule a follow-up appointment by{" "}
                      <Text strong className="text-red-500">
                        {dayjs(details.followUpDate).format("DD/MM/YYYY")}
                      </Text>
                    </span>
                  }
                  type="warning"
                  showIcon
                />
              </Col>
            )}
          </Row>
        </Card>

        <Card
          title={
            <Space>
              <FileTextOutlined className="text-blue-500" />
              <span className="font-medium">Health Check Details</span>
            </Space>
          }
          className="shadow-sm rounded-lg"
        >
          {details.healthCheckResultDetails.length > 0 ? (
            <div className="details-timeline">
              {details.healthCheckResultDetails.map((detail, index) => (
                <div key={detail.id} className="details-timeline-item mb-4">
                  <div className="details-timeline-item-line"></div>
                  <div className="details-timeline-item-dot">
                    <AlertOutlined className="text-blue-500" />
                  </div>
                  <div className="details-timeline-item-content">
                    <Card
                      className="mb-4 bg-blue-50 border-blue-200 rounded-lg"
                      bordered={true}
                    >
                      <Descriptions
                        column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}
                        labelStyle={{ backgroundColor: "#e6f7ff", width: "33%" }}
                        bordered
                        title={`Detail ${index + 1}`}
                        size="small"
                      >
                        <Descriptions.Item
                          label={<span className="font-semibold">Symptom</span>}
                          labelStyle={{ backgroundColor: "#e6f7ff", width: "33%" }}
                        >
                          <div className="p-2">{detail.resultSummary}</div>
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={<span className="font-semibold">Diagnosis</span>}
                          labelStyle={{ backgroundColor: "#e6f7ff", width: "33%" }}
                        >
                          <div className="p-2">{detail.diagnosis}</div>
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={<span className="font-semibold">Recommendations</span>}
                          labelStyle={{ backgroundColor: "#e6f7ff", width: "33%" }}
                        >
                          <div className="p-2">{detail.recommendations}</div>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No detailed information available" />
          )}
        </Card>
      </div>
    );
  };

  return (
    <PageContainer
      title="My Health Records"
      icon={<MedicineBoxOutlined className="text-blue-500" style={{ fontSize: "28px" }} />}
      onBack={handleBack}
    >
      <div className="bg-gray-50">
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        <Card className="mt-4 shadow-md rounded-lg">
          <Tabs
            defaultActiveKey="health-check-results"
            onChange={(key) => setActiveTab(key)}
            tabBarGutter={12}
            type="card"
            size="middle"
            className="custom-tabs"
          >
            <TabPane
              tab={
                <span className="px-1 flex items-center">
                  <FileTextOutlined className="mr-1" />
                  Health Check Results
                </span>
              }
              key="health-check-results"
            >
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Spin size="large" />
                </div>
              ) : data.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No health check results found"
                />
              ) : (
                <>
                  <div className="mb-6 space-y-4">
                    {data.map((result) => (
                      <Card 
                        key={result.id}
                        className={`rounded-lg border-l-4 ${
                          expandedKeys.includes(result.id)
                            ? "border-l-blue-500 shadow-md"
                            : "border-l-gray-300 shadow-sm"
                        } hover:shadow-md transition-shadow duration-300`}
                      >
                        <div 
                          className="cursor-pointer py-2"
                          onClick={() => {
                            const newKeys = expandedKeys.includes(result.id)
                              ? expandedKeys.filter(k => k !== result.id)
                              : [...expandedKeys, result.id];
                            handleCollapseChange(newKeys);
                          }}
                        >
                          <Row align="middle" justify="space-between" gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                              <Space>
                                {getStatusIcon(result.status)}
                                <Text strong className="text-lg">
                                  {result.healthCheckResultCode}
                                </Text>
                                {result.followUpRequired && (
                                  <Badge
                                    count="Follow-up"
                                    style={{
                                      backgroundColor: "#f50",
                                      marginRight: 8,
                                    }}
                                  />
                                )}
                              </Space>
                            </Col>
                            <Col xs={24} md={12} className="text-right">
                              <Space>
                                <Tag
                                  color={statusColors[result.status] || "default"}
                                  className="rounded-full px-3"
                                >
                                  {formatStatus(result.status)}
                                </Tag>
                                <Text type="secondary" className="text-sm">
                                  <CalendarOutlined className="mr-1" />
                                  {dayjs(result.checkupDate).format("DD/MM/YYYY")}
                                </Text>
                                <CaretRightOutlined
                                  rotate={expandedKeys.includes(result.id) ? 90 : 0}
                                  className="text-blue-500"
                                />
                              </Space>
                            </Col>
                          </Row>
                        </div>
                        
                        {expandedKeys.includes(result.id) && (
                          <div className="mt-4">
                            {renderHealthCheckResultDetails(result.id)}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  <PaginationFooter
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    onChange={handlePageChange}
                    showSizeChanger={true}
                    showGoToPage={true}
                    showTotal={true}
                  />
                </>
              )}
            </TabPane>

            <TabPane
              tab={
                <span className="px-1 flex items-center">
                  <MedicineBoxOutlined className="mr-1" />
                  Prescriptions
                </span>
              }
              key="prescriptions"
            >
              <Card className="shadow-sm rounded-lg bg-white">
                {loadingPrescriptions ? (
                  <div className="flex justify-center items-center py-8">
                    <Spin size="large" />
                  </div>
                ) : prescriptions.length === 0 ? (
                  <Empty description="No prescriptions found" />
                ) : (
                  <>
                    <List
                      itemLayout="vertical"
                      dataSource={prescriptions}
                      renderItem={(item) => (
                        <List.Item>
                          <Card 
                            className="mb-4 shadow-sm rounded-lg border-l-4 border-l-green-500 hover:shadow-md transition-shadow duration-300"
                          >
                            <Row justify="space-between" align="middle" className="mb-4">
                              <Col>
                                <Space align="center">
                                  <Avatar icon={<MedicineBoxOutlined />} className="bg-green-500" />
                                  <Title level={5} className="m-0">
                                    {item.prescriptionCode}
                                  </Title>
                                </Space>
                              </Col>
                              <Col>
                                <Tag
                                  color={
                                    item.status === "Dispensed" ? "green" : "blue"
                                  }
                                  className="rounded-full px-3"
                                >
                                  {item.status}
                                </Tag>
                              </Col>
                            </Row>
                            
                            <Row gutter={[16, 16]} className="mb-4">
                              <Col xs={24} md={8}>
                                <Statistic
                                  title="Prescription Date"
                                  value={dayjs(item.prescriptionDate).format("DD/MM/YYYY")}
                                  valueStyle={{ fontSize: '14px' }}
                                  prefix={<CalendarOutlined className="text-green-500 mr-2" />}
                                />
                              </Col>
                              <Col xs={24} md={8}>
                                <Statistic
                                  title="Health Check"
                                  value={item.healthCheckResult?.healthCheckResultCode || "N/A"}
                                  valueStyle={{ fontSize: '14px' }}
                                  prefix={<FileTextOutlined className="text-green-500 mr-2" />}
                                />
                              </Col>
                              <Col xs={24} md={8}>
                                <Statistic
                                  title="Prescribed By"
                                  value={item.staff?.fullName || "Unknown"}
                                  valueStyle={{ fontSize: '14px' }}
                                  prefix={<UserOutlined className="text-green-500 mr-2" />}
                                  formatter={(value) => (
                                    <span className="text-sm">
                                      {value}{" "}
                                      <Text type="secondary" className="text-xs">
                                        {item.staff?.email && `(${item.staff.email})`}
                                      </Text>
                                    </span>
                                  )}
                                />
                              </Col>
                            </Row>

                            <Divider orientation="left">
                              <Space>
                                <MedicineBoxOutlined className="text-green-500" />
                                Medicines
                              </Space>
                            </Divider>
                            
                            <Table
                              dataSource={item.prescriptionDetails || []}
                              rowKey="id"
                              pagination={false}
                              size="small"
                              className="custom-table"
                              columns={[
                                {
                                  title: "Medicine",
                                  dataIndex: ["drug", "name"],
                                  key: "drugName",
                                  render: (_, record) =>
                                    record.drug?.name || "N/A",
                                },
                                {
                                  title: "Dosage",
                                  dataIndex: "dosage",
                                  key: "dosage",
                                },
                                {
                                  title: "Quantity",
                                  dataIndex: "quantity",
                                  key: "quantity",
                                },
                                {
                                  title: "Instructions",
                                  dataIndex: "instructions",
                                  key: "instructions",
                                },
                              ]}
                            />
                          </Card>
                        </List.Item>
                      )}
                    />

                    <PaginationFooter
                      current={prescriptionPage}
                      pageSize={prescriptionPageSize}
                      total={prescriptionTotal}
                      onChange={setPrescriptionPage}
                      showSizeChanger={true}
                      showGoToPage={true}
                      showTotal={true}
                    />
                  </>
                )}
              </Card>
            </TabPane>

            <TabPane
              tab={
                <span className="px-1 flex items-center">
                  <AlertOutlined className="mr-1" />
                  Treatment Plans
                </span>
              }
              key="treatment-plans"
            >
              <Card className="shadow-sm rounded-lg bg-white">
                {loadingTreatmentPlans ? (
                  <div className="flex justify-center items-center py-8">
                    <Spin size="large" />
                  </div>
                ) : treatmentPlans.length === 0 ? (
                  <Empty description="No treatment plans found" />
                ) : (
                  <>
                    <List
                      itemLayout="vertical"
                      dataSource={treatmentPlans}
                      renderItem={(item) => {
                        // Calculate days remaining
                        const endDate = dayjs(item.endDate);
                        const now = dayjs();
                        const daysRemaining = endDate.diff(now, "day");

                        return (
                          <List.Item>
                            <Card 
                              className="mb-4 shadow-sm rounded-lg border-l-4 border-l-amber-500 hover:shadow-md transition-shadow duration-300"
                            >
                              <Row justify="space-between" align="middle" className="mb-4">
                                <Col>
                                  <Space align="center">
                                    <Avatar icon={<AlertOutlined />} className="bg-amber-500" />
                                    <Title level={5} className="m-0">
                                      {item.treatmentPlanCode}
                                    </Title>
                                  </Space>
                                </Col>
                                <Col>
                                  <Tag
                                    color={
                                      item.status === "Completed"
                                        ? "green"
                                        : item.status === "InProgress"
                                        ? "blue"
                                        : item.status === "Cancelled"
                                        ? "red"
                                        : "default"
                                    }
                                    className="rounded-full px-3"
                                  >
                                    {item.status}
                                  </Tag>
                                </Col>
                              </Row>
                              
                              <Row gutter={[24, 16]}>
                                <Col xs={24} md={12} lg={6}>
                                  <Card className="bg-gray-50 h-full">
                                    <Statistic
                                      title="Medicine"
                                      value={item.drug?.name || "N/A"}
                                      valueStyle={{ fontSize: '14px' }}
                                      prefix={<MedicineBoxOutlined className="text-amber-500 mr-2" />}
                                    />
                                  </Card>
                                </Col>
                                <Col xs={24} md={12} lg={6}>
                                  <Card className="bg-gray-50 h-full">
                                    <Statistic
                                      title="Duration"
                                      value={`${dayjs(item.startDate).format("DD/MM/YYYY")} - ${dayjs(item.endDate).format("DD/MM/YYYY")}`}
                                      valueStyle={{ fontSize: '14px' }}
                                      prefix={<CalendarOutlined className="text-amber-500 mr-2" />}
                                    />
                                  </Card>
                                </Col>
                                <Col xs={24} md={12} lg={6}>
                                  <Card className="bg-gray-50 h-full">
                                    <Statistic
                                      title="Days Remaining"
                                      value={daysRemaining >= 0 ? `${daysRemaining} days` : "Completed"}
                                      valueStyle={{ 
                                        color: daysRemaining >= 0 ? '#1890ff' : '#52c41a',
                                        fontSize: '14px'
                                      }}
                                      prefix={<ClockCircleOutlined className="text-amber-500 mr-2" />}
                                    />
                                  </Card>
                                </Col>
                                <Col xs={24} md={12} lg={6}>
                                  <Card className="bg-gray-50 h-full">
                                    <Statistic
                                      title="Created By"
                                      value={item.createdBy?.fullName || "Unknown"}
                                      valueStyle={{ fontSize: '14px' }}
                                      prefix={<UserOutlined className="text-amber-500 mr-2" />}
                                      formatter={(value) => (
                                        <span className="text-sm">
                                          {value}{" "}
                                          <Text type="secondary" className="text-xs">
                                            {item.createdBy?.email && `(${item.createdBy.email})`}
                                          </Text>
                                        </span>
                                      )}
                                    />
                                  </Card>
                                </Col>
                              </Row>
                              
                              <Card className="mt-4 bg-amber-50 border-amber-200">
                                <Row gutter={[16, 16]}>
                                  <Col xs={24} md={12}>
                                    <Title level={5} className="flex items-center">
                                      <FileTextOutlined className="mr-2 text-amber-500" />
                                      Description
                                    </Title>
                                    <div className="bg-white p-3 rounded">
                                      <Paragraph>{item.treatmentDescription}</Paragraph>
                                    </div>
                                  </Col>
                                  <Col xs={24} md={12}>
                                    <Title level={5} className="flex items-center">
                                      <AlertOutlined className="mr-2 text-amber-500" />
                                      Instructions
                                    </Title>
                                    <div className="bg-white p-3 rounded">
                                      <Paragraph>{item.instructions}</Paragraph>
                                    </div>
                                  </Col>
                                </Row>
                              </Card>
                            </Card>
                          </List.Item>
                        );
                      }}
                    />

                    <PaginationFooter
                      current={treatmentPlanPage}
                      pageSize={treatmentPlanPageSize}
                      total={treatmentPlanTotal}
                      onChange={setTreatmentPlanPage}
                      showSizeChanger={true}
                      showGoToPage={true}
                      showTotal={true}
                    />
                  </>
                )}
              </Card>
            </TabPane>
          </Tabs>
        </Card>

        <style jsx global>{`
          .custom-tabs .ant-tabs-tab {
            padding: 8px 12px;
            margin: 0 4px 0 0;
            border-radius: 8px 8px 0 0;
            background: #f5f5f5;
          }
          
          .custom-tabs .ant-tabs-tab-active {
            background: #ffffff;
          }
          
          .custom-table .ant-table-thead > tr > th {
            background-color: #f0f7ff;
          }
          
          .details-timeline-item {
            position: relative;
            padding-left: 40px;
            margin-bottom: 20px;
          }
          
          .details-timeline-item-line {
            position: absolute;
            left: 20px;
            top: 0;
            height: 100%;
            border-left: 2px solid #e6f7ff;
            z-index: 1;
          }
          
          .details-timeline-item-dot {
            position: absolute;
            left: 12px;
            top: 12px;
            width: 18px;
            height: 18px;
            background-color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
          }
          
          .ant-card-bordered {
            border-radius: 8px;
          }
        `}</style>
      </div>
    </PageContainer>
  );
};

export default MyHealthCheckResults;
