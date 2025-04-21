import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Button,
  Spin,
  Empty,
  Space,
  Tag,
  Image,
  Row,
  Col,
  Descriptions,
  Divider,
  message,
  Alert,
  Modal,
  Result,
} from "antd";
import {
  FileImageOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileExclamationOutlined,
  WarningOutlined,
  FormOutlined,
  SyncOutlined,
  SendOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  StopOutlined,
  MedicineBoxOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getCurrentUserHealthInsurance,
  HealthInsuranceResponseDTO,
  getCurrentUserPendingUpdateRequests,
  UpdateRequestDTO,
  updateHealthInsurance,
  requestHealthInsuranceUpdate,
} from "@/api/healthinsurance";
import MyInsuranceUpdateModal from "./MyInsuranceUpdateModal";
import MyInsuranceUpdateRequestModal from "./MyInsuranceUpdateRequestModal";
import PageContainer from "@/components/shared/PageContainer";
import { useRouter } from "next/router";

const { Title, Text } = Typography;

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "-";
  return dayjs(dateStr).format("DD/MM/YYYY");
};

const formatDateTime = (dateStr: string | undefined) => {
  if (!dateStr) return "-";
  return dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss");
};

const getStatusTag = (status: string | undefined) => {
  if (!status) return <Tag>Unknown</Tag>;

  switch (status) {
    case "Pending":
      return (
        <Tag icon={<ClockCircleOutlined />} color="processing">
          Pending
        </Tag>
      );
    case "Submitted":
      return (
        <Tag icon={<SendOutlined />} color="blue">
          Submitted
        </Tag>
      );
    case "Completed":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Completed
        </Tag>
      );
    case "Expired":
      return (
        <Tag icon={<WarningOutlined />} color="error">
          Expired
        </Tag>
      );
    case "DeadlineExpired":
      return (
        <Tag icon={<FileExclamationOutlined />} color="volcano">
          Deadline Expired
        </Tag>
      );
    case "SoftDeleted":
      return (
        <Tag icon={<StopOutlined />} color="default">
          Soft Deleted
        </Tag>
      );
    case "NotApplicable":
      return (
        <Tag icon={<QuestionCircleOutlined />} color="default">
          N/A
        </Tag>
      );
    case "Initial":
      return (
        <Tag icon={<ClockCircleOutlined />} color="processing">
          Initial
        </Tag>
      );
    case "AboutToExpire":
      return (
        <Tag icon={<WarningOutlined />} color="orange">
          About To Expire
        </Tag>
      );
    case "ExpiredUpdate":
      return (
        <Tag icon={<FileExclamationOutlined />} color="magenta">
          Expired Update
        </Tag>
      );
    case "NoInsurance":
      return (
        <Tag icon={<QuestionCircleOutlined />} color="purple">
          No Insurance
        </Tag>
      );
    case "Active":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Active
        </Tag>
      );
    default:
      return <Tag>{status}</Tag>;
  }
};

const getVerificationTag = (status: string | undefined) => {
  if (!status) return <Tag>Not Verified</Tag>;

  switch (status) {
    case "Unverified":
      return (
        <Tag icon={<ClockCircleOutlined />} color="warning">
          Unverified
        </Tag>
      );
    case "Verified":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Verified
        </Tag>
      );
    case "Rejected":
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          Rejected
        </Tag>
      );
    case "Pending":
      return (
        <Tag icon={<ClockCircleOutlined />} color="warning">
          Pending
        </Tag>
      );
    default:
      return <Tag>{status}</Tag>;
  }
};

export const UserHealthInsurance: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [insurance, setInsurance] = useState<HealthInsuranceResponseDTO | null>(
    null
  );
  const [pendingRequests, setPendingRequests] = useState<UpdateRequestDTO[]>(
    []
  );
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [updateRequestModalVisible, setUpdateRequestModalVisible] =
    useState<boolean>(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState<boolean>(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [confirmationMode, setConfirmationMode] = useState<
    "update" | "request"
  >("update");
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();
  const [successModalVisible, setSuccessModalVisible] =
    useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [successIcon, setSuccessIcon] = useState<React.ReactNode | null>(null);

  const fetchInsurance = async () => {
    try {
      setLoading(true);
      const response = await getCurrentUserHealthInsurance();
      if (response.isSuccess) {
        if (response.data && response.data.status !== "SoftDeleted") {
          setInsurance(response.data);
        } else {
          setInsurance(null);
        }
      } else {
        messageApi.error(
          response.message || "Failed to load insurance information"
        );
      }
    } catch (error) {
      console.error("Error fetching insurance:", error);
      messageApi.error("Failed to load insurance information");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await getCurrentUserPendingUpdateRequests();
      if (response.isSuccess) {
        setPendingRequests(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  useEffect(() => {
    fetchInsurance();
    fetchPendingRequests();
  }, []);

  const handleUpdate = () => {
    setConfirmationMode("update");
    setUpdateModalVisible(true);
  };

  const handleUpdateRequest = () => {
    setConfirmationMode("request");
    setUpdateRequestModalVisible(true);
  };

  const handleUpdateSuccess = (formData: any, imageFile?: File) => {
    // Just transfer data to confirmation modal, don't call API here
    console.log("Got data from update modal:", formData, imageFile);
    setConfirmationData({
      formData,
      imageFile,
      currentImage: insurance?.imageUrl,
    });
    setUpdateModalVisible(false);
    setConfirmationModalVisible(true);
  };

  const handleUpdateRequestSuccess = (formData: any, imageFile?: File) => {
    // Just transfer data to confirmation modal, don't call API here
    console.log("Got data from update request modal:", formData, imageFile);
    setConfirmationData({
      formData,
      imageFile,
      currentImage: insurance?.imageUrl,
    });
    setUpdateRequestModalVisible(false);
    setConfirmationModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      if (!confirmationData) {
        messageApi.error("No data to submit");
        return;
      }

      setLoading(true);
      console.log("Submitting data:", confirmationData);

      // Đảm bảo cờ imageChanged được thiết lập
      const formData = {
        ...confirmationData.formData,
        imageChanged: confirmationData.imageFile ? true : false,
      };

      let response;
      if (confirmationMode === "update") {
        // Logic for update
        response = await updateHealthInsurance(
          insurance!.id,
          formData,
          confirmationData.imageFile
        );
        console.log("Update response:", response);
      } else {
        // Logic for update request
        response = await requestHealthInsuranceUpdate(
          insurance!.id,
          formData,
          confirmationData.imageFile
        );
        console.log("Request response:", response);
      }

      if (response.isSuccess) {
        // Hiển thị thông báo thành công nổi bật hơn
        setTimeout(() => {
          messageApi.success({
            content:
              confirmationMode === "update"
                ? "Your insurance has been updated and is waiting for verification"
                : "Your update request has been submitted for review",
            duration: 5,
            icon:
              confirmationMode === "update" ? (
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
              ) : (
                <SendOutlined style={{ color: "#1677ff" }} />
              ),
            style: {
              marginTop: "20vh",
              fontWeight: "bold",
            },
          });
        }, 300);

        // Thêm modal thông báo thành công
        setSuccessMessage(
          confirmationMode === "update"
            ? "Your insurance has been updated and is waiting for verification"
            : "Your update request has been submitted for review"
        );

        setSuccessIcon(
          confirmationMode === "update" ? (
            <CheckCircleOutlined style={{ fontSize: 72, color: "#52c41a" }} />
          ) : (
            <SendOutlined style={{ fontSize: 72, color: "#1677ff" }} />
          )
        );

        fetchInsurance();
        fetchPendingRequests();

        // Close all modals
        setUpdateModalVisible(false);
        setUpdateRequestModalVisible(false);
        setConfirmationModalVisible(false);
        setConfirmationData(null);

        // Show success modal
        setSuccessModalVisible(true);
      } else {
        setTimeout(() => {
          messageApi.error({
            content:
              response.message ||
              `Failed to ${confirmationMode} health insurance`,
            duration: 5,
            style: {
              marginTop: "20vh",
            },
          });
        }, 300);
      }
    } catch (error) {
      console.error(`Error in ${confirmationMode}:`, error);
      setTimeout(() => {
        messageApi.error({
          content: `Failed to ${confirmationMode} health insurance`,
          duration: 5,
          style: {
            marginTop: "20vh",
          },
        });
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setConfirmationModalVisible(false);
    if (confirmationMode === "update") {
      setUpdateModalVisible(true);
    } else {
      setUpdateRequestModalVisible(true);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <PageContainer
        title="My Health Insurance"
        icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
        onBack={handleBack}
      >
        <Card className="mt-4 shadow">
          <div className="flex justify-center items-center py-8">
            <Spin
              size="large"
              tip="Loading your health insurance information..."
            />
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (!insurance) {
    return (
      <PageContainer
        title="My Health Insurance"
        icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
        onBack={handleBack}
      >
        <Card className="mt-4 shadow">
          <Empty
            description="No health insurance information found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      </PageContainer>
    );
  }

  const canUpdateDirectly =
    insurance.status === "Pending" &&
    insurance.verificationStatus === "Unverified";

  const canRequestUpdate =
    insurance.verificationStatus === "Verified" ||
    insurance.verificationStatus === "Rejected";

  const hasPendingRequests = pendingRequests.length > 0;

  return (
    <PageContainer
      title="My Health Insurance"
      icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
    >
      {contextHolder}
      <Card className="mt-4 shadow">
        <div className="flex justify-end items-center mb-4">
          <Space>
            {canUpdateDirectly && !hasPendingRequests && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleUpdate}
              >
                Update Health Insurance
              </Button>
            )}
            {canRequestUpdate && !hasPendingRequests && (
              <Button
                type="primary"
                icon={<FormOutlined />}
                onClick={handleUpdateRequest}
                danger={insurance.verificationStatus === "Rejected"}
              >
                {insurance.verificationStatus === "Rejected"
                  ? "Update Rejected Insurance"
                  : "Request Health Insurance Update"}
              </Button>
            )}
          </Space>
        </div>

        {hasPendingRequests && (
          <Alert
            message="Pending Update Request"
            description="You have pending update requests that need to be reviewed by an administrator. You cannot make new requests until the current ones are processed."
            type="info"
            showIcon
            icon={<SyncOutlined spin />}
            className="mb-4"
          />
        )}

        {insurance.verificationStatus === "Rejected" && (
          <Alert
            message="Health Insurance Rejected"
            description={
              <>
                Your health insurance information has been rejected.
                {!hasPendingRequests && (
                  <span>
                    {" "}
                    Please click the{" "}
                    <strong>"Update Rejected Insurance"</strong> button to
                    submit new information.
                  </span>
                )}
              </>
            }
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Card title="Insurance Information" className="mb-4">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Status" span={2}>
                  {getStatusTag(insurance.status)}{" "}
                  {getVerificationTag(insurance.verificationStatus)}
                </Descriptions.Item>
                <Descriptions.Item label="Insurance Number" span={2}>
                  {insurance.healthInsuranceNumber || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Full Name">
                  {insurance.fullName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Date of Birth">
                  {formatDate(insurance.dateOfBirth)}
                </Descriptions.Item>
                <Descriptions.Item label="Gender">
                  {insurance.gender || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Address" span={2}>
                  {insurance.address || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Healthcare Provider" span={2}>
                  {insurance.healthcareProviderName}{" "}
                  {insurance.healthcareProviderCode
                    ? `(${insurance.healthcareProviderCode})`
                    : ""}
                </Descriptions.Item>
                <Descriptions.Item label="Valid From">
                  {formatDate(insurance.validFrom)}
                </Descriptions.Item>
                <Descriptions.Item label="Valid To">
                  {formatDate(insurance.validTo)}
                </Descriptions.Item>
                <Descriptions.Item label="Issue Date">
                  {formatDate(insurance.issueDate)}
                </Descriptions.Item>
                <Descriptions.Item
                  label="Deadline"
                  span={insurance.deadline ? 1 : 2}
                >
                  {insurance.deadline
                    ? formatDateTime(insurance.deadline)
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated" span={2}>
                  {insurance.updatedBy
                    ? `${insurance.updatedBy.userName || ""} (${
                        insurance.updatedBy.email || ""
                      }) - ${formatDateTime(insurance.updatedAt)}`
                    : insurance.createdBy
                    ? `${insurance.createdBy.userName || ""} (${
                        insurance.createdBy.email || ""
                      }) - ${formatDateTime(insurance.createdAt)}`
                    : formatDateTime(insurance.createdAt)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="Insurance Card Image" className="mb-4">
              {insurance.imageUrl ? (
                <div className="flex justify-center">
                  <Image
                    src={insurance.imageUrl}
                    alt="Insurance Card"
                    style={{ maxWidth: "100%" }}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileImageOutlined style={{ fontSize: 48, color: "#ccc" }} />
                  <div className="mt-2">No image available</div>
                </div>
              )}
            </Card>

            {hasPendingRequests && (
              <Card title="Pending Update Requests">
                {pendingRequests.map((request, index) => (
                  <div key={request.id} className="mb-2">
                    <Text>
                      Request submitted on {formatDateTime(request.requestedAt)}
                    </Text>
                    <br />
                    <Text type="secondary">Status: {request.status}</Text>
                    {index < pendingRequests.length - 1 && <Divider />}
                  </div>
                ))}
              </Card>
            )}
          </Col>
        </Row>
      </Card>

      <MyInsuranceUpdateModal
        visible={updateModalVisible}
        insurance={insurance}
        onClose={() => setUpdateModalVisible(false)}
        onSuccess={handleUpdateSuccess}
      />

      <MyInsuranceUpdateRequestModal
        visible={updateRequestModalVisible}
        insurance={insurance}
        onClose={() => setUpdateRequestModalVisible(false)}
        onSuccess={handleUpdateRequestSuccess}
      />

      {/* Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <ExclamationCircleOutlined className="text-warning mr-2" />
            <span>
              {confirmationMode === "update"
                ? "Confirm Insurance Update"
                : "Confirm Update Request"}
            </span>
          </div>
        }
        open={confirmationModalVisible}
        onOk={handleConfirmSubmit}
        onCancel={handleCancelConfirmation}
        width={1000}
        okText="Submit"
        okButtonProps={{ loading }}
        cancelText="Back to Edit"
      >
        <Alert
          message="Please review your information carefully"
          description="Make sure all the details and the uploaded image are correct before submitting."
          type="warning"
          showIcon
          className="mb-4"
        />

        {confirmationData && (
          <Row gutter={[24, 24]} align="top">
            <Col xs={24} md={14}>
              <Text strong className="block mb-2">
                Updated Information
              </Text>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Has Insurance" span={2}>
                  {confirmationData.formData.hasInsurance ? "Yes" : "No"}
                </Descriptions.Item>

                {confirmationData.formData.hasInsurance && (
                  <>
                    <Descriptions.Item label="Insurance Number" span={2}>
                      {confirmationData.formData.healthInsuranceNumber || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Full Name">
                      {confirmationData.formData.fullName || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Date of Birth">
                      {confirmationData.formData.dateOfBirth
                        ? dayjs(confirmationData.formData.dateOfBirth).format(
                            "DD/MM/YYYY"
                          )
                        : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Gender">
                      {confirmationData.formData.gender || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                      {confirmationData.formData.address || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Healthcare Provider" span={2}>
                      {confirmationData.formData.healthcareProviderName}
                      {confirmationData.formData.healthcareProviderCode
                        ? ` (${confirmationData.formData.healthcareProviderCode})`
                        : ""}
                    </Descriptions.Item>
                    <Descriptions.Item label="Valid From">
                      {confirmationData.formData.validFrom
                        ? dayjs(confirmationData.formData.validFrom).format(
                            "DD/MM/YYYY"
                          )
                        : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Valid To">
                      {confirmationData.formData.validTo
                        ? dayjs(confirmationData.formData.validTo).format(
                            "DD/MM/YYYY"
                          )
                        : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Issue Date" span={2}>
                      {confirmationData.formData.issueDate
                        ? dayjs(confirmationData.formData.issueDate).format(
                            "DD/MM/YYYY"
                          )
                        : "-"}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
            </Col>

            <Col xs={24} md={10}>
              <>
                <Text strong className="block mb-2">
                  Insurance Card Image
                </Text>
                <div className="border rounded-md p-3">
                  {confirmationData.imageFile ? (
                    <div className="flex justify-center">
                      <Image
                        src={URL.createObjectURL(confirmationData.imageFile)}
                        alt="New Insurance Card"
                        style={{ maxWidth: "100%", maxHeight: "350px" }}
                      />
                    </div>
                  ) : confirmationData.currentImage ? (
                    <div className="flex justify-center">
                      <div className="text-center">
                        <div className="mb-2">(Using current image)</div>
                        <Image
                          src={confirmationData.currentImage}
                          alt="Current Insurance Card"
                          style={{ maxWidth: "100%", maxHeight: "350px" }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FileImageOutlined
                        style={{ fontSize: 48, color: "#ccc" }}
                      />
                      <div className="mt-2">No image provided</div>
                    </div>
                  )}
                </div>
              </>
            </Col>
          </Row>
        )}
      </Modal>

      {/* Success Modal */}
      <Modal
        open={successModalVisible}
        onCancel={() => setSuccessModalVisible(false)}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setSuccessModalVisible(false)}
          >
            OK
          </Button>,
        ]}
        width={500}
        centered
      >
        <Result icon={successIcon} title="Success!" subTitle={successMessage} />
      </Modal>
    </PageContainer>
  );
};
