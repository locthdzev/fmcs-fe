import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  Pagination,
  Space,
  Row,
  Col,
  Modal,
  Image,
  Descriptions,
  Tag,
  Card,
  Typography,
  Badge,
  Divider,
  Tooltip,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  verifyHealthInsurance,
  setupHealthInsuranceRealTime,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileImageOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  GlobalOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

export function VerificationList() {
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [selectedInsurance, setSelectedInsurance] = useState<HealthInsuranceResponseDTO | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHealthInsurances(
        currentPage,
        pageSize,
        searchText,
        "CreatedAt",
        false,
        "Submitted"
      );
      setInsurances(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load health insurances.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText]);

  useEffect(() => {
    fetchInsurances();
    const connection = setupHealthInsuranceRealTime(() => {
      fetchInsurances();
    });
    return () => {
      connection.stop();
    };
  }, [fetchInsurances]);

  const handleVerify = async (id: string, status: string) => {
    try {
      const response = await verifyHealthInsurance(id, status);
      if (response.isSuccess) {
        toast.success(`Insurance ${status.toLowerCase()}!`);
        fetchInsurances();
        setIsModalVisible(false);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to verify insurance.");
    }
  };

  const columns = [
    {
      title: (
        <div className="flex items-center">
          <UserOutlined className="mr-2" />
          Policyholder
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserOutlined className="text-blue-500" />
          </div>
          <div>
            <Text strong className="block">{record.user.fullName}</Text>
            <Text type="secondary" className="text-sm">{record.user.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <IdcardOutlined className="mr-2" />
          Insurance Number
        </div>
      ),
      dataIndex: "healthInsuranceNumber",
      render: (text: string) => (
        <Text strong className="text-blue-600">{text}</Text>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <UserOutlined className="mr-2" />
          Full Name
        </div>
      ),
      dataIndex: "fullName",
      render: (text: string) => (
        <Text strong>{text}</Text>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <CalendarOutlined className="mr-2" />
          Valid Period
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <div className="space-y-1">
          <div className="flex items-center">
            <Badge status="processing" />
            <Text className="ml-2">From: {formatDate(record.validFrom)}</Text>
          </div>
          <div className="flex items-center">
            <Badge status="warning" />
            <Text className="ml-2">To: {formatDate(record.validTo)}</Text>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <CheckCircleOutlined className="mr-2" />
          Actions
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => {
            setSelectedInsurance(record);
            setIsModalVisible(true);
          }}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Verify
        </Button>
      ),
    },
  ];

  const topContent = (
    <Card className="mb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Title level={5} className="mb-0">Insurance Verification List</Title>
          <Text type="secondary">Total: {total} pending</Text>
        </div>
        <Divider className="my-3" />
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Space size="middle">
              <Input.Search
                placeholder="Search by insurance number"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                className="search-input"
              />
            </Space>
          </Col>
        </Row>
      </div>
    </Card>
  );

  const bottomContent = (
    <Card className="mt-4">
      <Row justify="end">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
          showSizeChanger
          showTotal={(total) => `Total ${total} records`}
          className="pagination-custom"
        />
      </Row>
    </Card>
  );

  return (
    <div className="space-y-4">
      {topContent}
      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={insurances}
          loading={loading}
          pagination={false}
          rowKey="id"
          className="custom-table"
        />
      </Card>
      {bottomContent}

      <Modal
        title={
          <div className="flex items-center space-x-2">
            <FileImageOutlined className="text-blue-500" />
            <Text strong>Insurance Verification Details</Text>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button 
            key="reject" 
            danger 
            icon={<CloseCircleOutlined />}
            onClick={() => handleVerify(selectedInsurance?.id || "", "Rejected")}
          >
            Reject
          </Button>,
          <Button 
            key="verify" 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={() => handleVerify(selectedInsurance?.id || "", "Verified")}
            className="bg-green-500 hover:bg-green-600"
          >
            Verify
          </Button>,
        ]}
        width={800}
        className="verification-modal"
      >
        {selectedInsurance && (
          <div className="space-y-6">
            <Card className="shadow-sm">
              <Descriptions title={
                <div className="flex items-center space-x-2 mb-4">
                  <IdcardOutlined className="text-blue-500" />
                  <Text strong>Insurance Information</Text>
                </div>
              } bordered column={2}>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <IdcardOutlined />
                      <span>Insurance Number</span>
                    </div>
                  }
                >
                  <Text strong>{selectedInsurance.healthInsuranceNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <UserOutlined />
                      <span>Full Name</span>
                    </div>
                  }
                >
                  <Text strong>{selectedInsurance.fullName}</Text>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <CalendarOutlined />
                      <span>Date of Birth</span>
                    </div>
                  }
                >
                  {formatDate(selectedInsurance.dateOfBirth)}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <UserOutlined />
                      <span>Gender</span>
                    </div>
                  }
                >
                  {selectedInsurance.gender}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <HomeOutlined />
                      <span>Address</span>
                    </div>
                  }
                  span={2}
                >
                  {selectedInsurance.address}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <MedicineBoxOutlined />
                      <span>Healthcare Provider</span>
                    </div>
                  }
                  span={2}
                >
                  <Space>
                    <Text strong>{selectedInsurance.healthcareProviderName}</Text>
                    <Tag color="blue">{selectedInsurance.healthcareProviderCode}</Tag>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <CalendarOutlined />
                      <span>Valid Period</span>
                    </div>
                  }
                  span={2}
                >
                  <Space>
                    <Badge status="processing" text={`From: ${formatDate(selectedInsurance.validFrom)}`} />
                    <Badge status="warning" text={`To: ${formatDate(selectedInsurance.validTo)}`} />
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <GlobalOutlined />
                      <span>Issue Date</span>
                    </div>
                  }
                >
                  {formatDate(selectedInsurance.issueDate)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedInsurance.imageUrl && (
              <Card 
                title={
                  <div className="flex items-center space-x-2">
                    <FileImageOutlined className="text-blue-500" />
                    <Text strong>Insurance Image</Text>
                  </div>
                }
                className="shadow-sm"
              >
                <Image
                  src={selectedInsurance.imageUrl}
                  alt="Insurance"
                  style={{ maxWidth: "100%" }}
                  className="rounded-lg"
                />
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
} 