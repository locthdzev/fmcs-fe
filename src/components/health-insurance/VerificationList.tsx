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
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  verifyHealthInsurance,
  setupHealthInsuranceRealTime,
} from "@/api/healthinsurance";
import { SearchOutlined } from "@ant-design/icons";

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
      title: "Policyholder",
      render: (record: HealthInsuranceResponseDTO) => (
        <div>
          <div>{record.user.fullName}</div>
          <div className="text-gray-500">{record.user.email}</div>
        </div>
      ),
    },
    {
      title: "Insurance Number",
      dataIndex: "healthInsuranceNumber",
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
    },
    {
      title: "Valid Period",
      render: (record: HealthInsuranceResponseDTO) =>
        `${formatDate(record.validFrom)} - ${formatDate(record.validTo)}`,
    },
    {
      title: "Actions",
      render: (record: HealthInsuranceResponseDTO) => (
        <Space>
          <Button
            onClick={() => {
              setSelectedInsurance(record);
              setIsModalVisible(true);
            }}
          >
            Verify
          </Button>
        </Space>
      ),
    },
  ];

  const topContent = (
    <Row gutter={[16, 16]} align="middle" justify="space-between">
      <Col>
        <Space>
          <Input
            placeholder="Search by insurance number"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </Space>
      </Col>
      <Col>
        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
          Total {total} pending verifications
        </span>
      </Col>
    </Row>
  );

  const bottomContent = (
    <Row justify="end" style={{ marginTop: 16 }}>
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={total}
        onChange={(page, size) => {
          setCurrentPage(page);
          setPageSize(size);
        }}
        showSizeChanger
        showTotal={(total) => `Total ${total} items`}
      />
    </Row>
  );

  return (
    <div>
      {topContent}
      <Table
        columns={columns}
        dataSource={insurances}
        loading={loading}
        pagination={false}
        rowKey="id"
        style={{ marginTop: 16 }}
      />
      {bottomContent}

      <Modal
        title="Verify Health Insurance"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="reject" danger onClick={() => handleVerify(selectedInsurance?.id || "", "Rejected")}>
            Reject
          </Button>,
          <Button key="verify" type="primary" onClick={() => handleVerify(selectedInsurance?.id || "", "Verified")}>
            Verify
          </Button>,
        ]}
        width={800}
      >
        {selectedInsurance && (
          <div>
            <Descriptions title="Insurance Information" bordered column={2}>
              <Descriptions.Item label="Insurance Number">
                {selectedInsurance.healthInsuranceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Full Name">
                {selectedInsurance.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Date of Birth">
                {formatDate(selectedInsurance.dateOfBirth)}
              </Descriptions.Item>
              <Descriptions.Item label="Gender">
                {selectedInsurance.gender}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {selectedInsurance.address}
              </Descriptions.Item>
              <Descriptions.Item label="Healthcare Provider">
                {selectedInsurance.healthcareProviderName} ({selectedInsurance.healthcareProviderCode})
              </Descriptions.Item>
              <Descriptions.Item label="Valid From">
                {formatDate(selectedInsurance.validFrom)}
              </Descriptions.Item>
              <Descriptions.Item label="Valid To">
                {formatDate(selectedInsurance.validTo)}
              </Descriptions.Item>
              <Descriptions.Item label="Issue Date">
                {formatDate(selectedInsurance.issueDate)}
              </Descriptions.Item>
            </Descriptions>
            {selectedInsurance.imageUrl && (
              <div style={{ marginTop: 16 }}>
                <h4>Insurance Image</h4>
                <Image
                  src={selectedInsurance.imageUrl}
                  alt="Insurance"
                  style={{ maxWidth: "100%" }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
} 