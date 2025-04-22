import React, { useEffect, useState } from "react";
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
} from "antd";
import {
  getCurrentUserHealthCheckResults,
  getHealthCheckResultById,
  HealthCheckResultsResponseDTO,
  HealthCheckResultsIdResponseDTO,
} from "@/api/healthcheckresult";
import moment from "moment";
import {
  CaretRightOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  AlertOutlined,
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

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  useEffect(() => {
    if (activeTab === "prescriptions") {
      fetchPrescriptions();
    }
  }, [activeTab, prescriptionPage, prescriptionPageSize]);

  useEffect(() => {
    if (activeTab === "treatment-plans") {
      fetchTreatmentPlans();
    }
  }, [activeTab, treatmentPlanPage, treatmentPlanPageSize]);

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

  const fetchPrescriptions = async () => {
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
  };

  const fetchTreatmentPlans = async () => {
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
          className="mb-4 shadow-sm"
          title={
            <div className="flex items-center">
              <span className="mr-2">Health Check Information</span>
              {details.followUpRequired && (
                <Badge
                  count="Follow-up Required"
                  style={{ backgroundColor: "#f50" }}
                />
              )}
            </div>
          }
        >
          <Descriptions
            bordered
            column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="Checkup Date" span={1}>
              {moment(details.checkupDate).format("DD/MM/YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Healthcare Staff" span={2}>
              {details.staff?.fullName}{" "}
              {details.staff?.email && `(${details.staff.email})`}
            </Descriptions.Item>
            {details.followUpRequired && details.followUpDate && (
              <Descriptions.Item label="Follow-up Date" span={3}>
                <Text strong className="text-red-500">
                  {moment(details.followUpDate).format("DD/MM/YYYY")}
                </Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card
          title={
            <div className="flex items-center">
              <FileTextOutlined className="mr-2" />
              <span>Health Check Details</span>
            </div>
          }
          className="shadow-sm"
        >
          {details.healthCheckResultDetails.length > 0 ? (
            details.healthCheckResultDetails.map((detail, index) => (
              <Card
                key={detail.id}
                title={
                  <div className="flex items-center">
                    <AlertOutlined className="mr-2 text-blue-500" />
                    <span>Detail {index + 1}</span>
                  </div>
                }
                className="mb-4 shadow-sm"
                bordered={true}
              >
                <Descriptions
                  bordered
                  column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}
                  labelStyle={{ width: "33%" }}
                >
                  <Descriptions.Item
                    label={<span className="font-semibold">Symptom</span>}
                    labelStyle={{ backgroundColor: "#f0f7ff", width: "33%" }}
                  >
                    <Paragraph>{detail.resultSummary}</Paragraph>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={<span className="font-semibold">Diagnosis</span>}
                    labelStyle={{ backgroundColor: "#f0f7ff", width: "33%" }}
                  >
                    <Paragraph>{detail.diagnosis}</Paragraph>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <span className="font-semibold">Recommendations</span>
                    }
                    labelStyle={{ backgroundColor: "#f0f7ff", width: "33%" }}
                  >
                    <Paragraph>{detail.recommendations}</Paragraph>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ))
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
      icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      <Card className="mt-4 shadow">
        <Tabs
          defaultActiveKey="health-check-results"
          onChange={(key) => setActiveTab(key)}
        >
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
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
                <Collapse
                  expandIcon={({ isActive }) => (
                    <CaretRightOutlined rotate={isActive ? 90 : 0} />
                  )}
                  onChange={handleCollapseChange}
                  activeKey={expandedKeys}
                  className="mb-4"
                >
                  {data.map((result) => (
                    <Panel
                      key={result.id}
                      header={
                        <div className="flex justify-between items-center py-2">
                          <div className="flex items-center">
                            <span className="font-semibold text-lg mr-2">
                              {result.healthCheckResultCode}
                            </span>
                            {result.followUpRequired && (
                              <Badge
                                count="Follow-up"
                                style={{
                                  backgroundColor: "#f50",
                                  marginRight: 8,
                                }}
                              />
                            )}
                          </div>
                          <div className="flex gap-2 items-center">
                            <Tag
                              color={statusColors[result.status] || "default"}
                            >
                              {formatStatus(result.status)}
                            </Tag>
                            <span className="text-gray-500 text-sm">
                              {moment(result.checkupDate).format("DD/MM/YYYY")}
                            </span>
                          </div>
                        </div>
                      }
                    >
                      {renderHealthCheckResultDetails(result.id)}
                    </Panel>
                  ))}
                </Collapse>

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
              <span>
                <MedicineBoxOutlined />
                Prescriptions
              </span>
            }
            key="prescriptions"
          >
            <Card className="shadow-sm">
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
                        <Card className="mb-4 shadow-sm">
                          <div className="flex justify-between items-center mb-4">
                            <Title level={5} className="flex items-center m-0">
                              <MedicineBoxOutlined className="mr-2 text-green-500" />
                              {item.prescriptionCode}
                            </Title>
                            <Tag
                              color={
                                item.status === "Dispensed" ? "green" : "blue"
                              }
                            >
                              {item.status}
                            </Tag>
                          </div>
                          <Descriptions
                            bordered
                            size="small"
                            column={{
                              xxl: 4,
                              xl: 3,
                              lg: 3,
                              md: 2,
                              sm: 1,
                              xs: 1,
                            }}
                          >
                            <Descriptions.Item label="Prescription Date">
                              {moment(item.prescriptionDate).format(
                                "DD/MM/YYYY"
                              )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Health Check">
                              {item.healthCheckResult?.healthCheckResultCode ||
                                "N/A"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Created By">
                              {item.staff?.fullName}{" "}
                              {item.staff?.email && `(${item.staff.email})`}
                            </Descriptions.Item>
                          </Descriptions>

                          <Divider orientation="left">Medicines</Divider>
                          <Table
                            dataSource={item.prescriptionDetails || []}
                            rowKey="id"
                            pagination={false}
                            size="small"
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
              <span>
                <AlertOutlined />
                Treatment Plans
              </span>
            }
            key="treatment-plans"
          >
            <Card className="shadow-sm">
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
                      const endDate = moment(item.endDate);
                      const now = moment();
                      const daysRemaining = endDate.diff(now, "days");

                      return (
                        <List.Item>
                          <Card className="mb-4 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                              <Title
                                level={5}
                                className="flex items-center m-0"
                              >
                                <AlertOutlined className="mr-2 text-blue-500" />
                                {item.treatmentPlanCode}
                              </Title>
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
                              >
                                {item.status}
                              </Tag>
                            </div>
                            <Descriptions
                              bordered
                              size="small"
                              column={{
                                xxl: 4,
                                xl: 3,
                                lg: 3,
                                md: 2,
                                sm: 1,
                                xs: 1,
                              }}
                            >
                              <Descriptions.Item label="Medicine">
                                {item.drug?.name || "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Start Date">
                                {moment(item.startDate).format("DD/MM/YYYY")}
                              </Descriptions.Item>
                              <Descriptions.Item label="End Date">
                                {moment(item.endDate).format("DD/MM/YYYY")}
                              </Descriptions.Item>
                              <Descriptions.Item label="Days Remaining">
                                {daysRemaining >= 0 ? (
                                  <Tag color="blue">{daysRemaining} days</Tag>
                                ) : (
                                  <Tag color="green">Completed</Tag>
                                )}
                              </Descriptions.Item>
                              <Descriptions.Item label="Created By" span={2}>
                                {item.createdBy?.fullName}{" "}
                                {item.createdBy?.email &&
                                  `(${item.createdBy.email})`}
                              </Descriptions.Item>
                            </Descriptions>

                            <Divider orientation="left">
                              Treatment Details
                            </Divider>
                            <div className="mb-4">
                              <Title level={5}>Description</Title>
                              <Paragraph>{item.treatmentDescription}</Paragraph>
                            </div>

                            <div>
                              <Title level={5}>Instructions</Title>
                              <Paragraph>{item.instructions}</Paragraph>
                            </div>
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
    </PageContainer>
  );
};

export default MyHealthCheckResults;
