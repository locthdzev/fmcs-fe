import React, { useEffect, useState } from 'react';
import { Modal, Descriptions, Tabs, Table, Image, Spin, Row, Col } from 'antd';
import { HealthInsuranceResponseDTO, getHealthInsuranceHistory, HistoryDTO } from '@/api/healthinsurance';
import moment from 'moment';

interface DetailModalProps {
  visible: boolean;
  insurance: HealthInsuranceResponseDTO | null;
  onClose: () => void;
}

const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return '';
  return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
};

const formatChangeDetails = (details: string) => {
  try {
    const changes = JSON.parse(details);
    return Object.entries(changes).map(([field, value]: [string, any]) => {
      if (typeof value === 'object' && value.Item1 !== undefined && value.Item2 !== undefined) {
        return `${field}: ${value.Item1} → ${value.Item2}`;
      }
      return `${field}: ${value}`;
    }).join('\n');
  } catch {
    return details;
  }
};

export default function DetailModal({ visible, insurance, onClose }: DetailModalProps) {
  const [history, setHistory] = useState<HistoryDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && insurance) {
      fetchHistory();
    }
  }, [visible, insurance]);

  const fetchHistory = async () => {
    if (!insurance) return;
    setLoading(true);
    try {
      const historyData = await getHealthInsuranceHistory(insurance.id);
      setHistory(historyData);
    } catch (error) {
      console.error("Unable to load history.");
    } finally {
      setLoading(false);
    }
  };

  const historyColumns = [
    { 
      title: "Updated At", 
      dataIndex: "updatedAt",
      render: (text: string) => formatDateTime(text)
    },
    {
      title: "Updated By",
      render: (record: HistoryDTO) => record.updatedBy.userName,
    },
    { 
      title: "Status Change",
      render: (record: HistoryDTO) => 
        record.previousStatus !== record.newStatus ? 
        `${record.previousStatus || 'None'} → ${record.newStatus}` : 
        record.newStatus
    },
    { 
      title: "Changes",
      render: (record: HistoryDTO) => (
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
          {formatChangeDetails(record.changeDetails)}
        </pre>
      )
    },
  ];

  if (!insurance) return null;

  const items = [
    {
      key: '1',
      label: 'Information',
      children: (
        <Row gutter={[24, 24]}>
          <Col span={16}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Policyholder" span={2}>
                <div>
                  <div>{insurance.user.fullName}</div>
                  <div style={{ color: '#666' }}>{insurance.user.email}</div>
                </div>
              </Descriptions.Item>
              
              <Descriptions.Item label="Insurance Number" span={2}>
                {insurance.healthInsuranceNumber}
              </Descriptions.Item>

              <Descriptions.Item label="Full Name">
                {insurance.fullName}
              </Descriptions.Item>

              <Descriptions.Item label="Date of Birth">
                {formatDate(insurance.dateOfBirth)}
              </Descriptions.Item>

              <Descriptions.Item label="Gender">
                {insurance.gender}
              </Descriptions.Item>

              <Descriptions.Item label="Address">
                {insurance.address}
              </Descriptions.Item>

              <Descriptions.Item label="Healthcare Provider" span={2}>
                {insurance.healthcareProviderName} ({insurance.healthcareProviderCode})
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

              <Descriptions.Item label="Status">
                {insurance.status}
              </Descriptions.Item>

              <Descriptions.Item label="Verification Status">
                {insurance.verificationStatus}
              </Descriptions.Item>

              <Descriptions.Item label="Deadline">
                {insurance.deadline ? formatDate(insurance.deadline) : 'No deadline'}
              </Descriptions.Item>

              <Descriptions.Item label="Created Info" span={2}>
                {formatDateTime(insurance.createdAt)}
                {insurance.createdBy ? ` by ${insurance.createdBy.userName}` : ''}
              </Descriptions.Item>

              {insurance.updatedAt && (
                <Descriptions.Item label="Updated Info" span={2}>
                  {formatDateTime(insurance.updatedAt)}
                  {insurance.updatedBy ? ` by ${insurance.updatedBy.userName}` : ''}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>
          <Col span={8}>
            {insurance.imageUrl ? (
              <div style={{ textAlign: 'center' }}>
                <h4>Insurance Image</h4>
                <Image
                  src={insurance.imageUrl}
                  alt="Insurance"
                  style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                No image available
              </div>
            )}
          </Col>
        </Row>
      ),
    },
    {
      key: '2',
      label: 'History',
      children: (
        <div style={{ position: 'relative', minHeight: '200px' }}>
          {loading ? (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={historyColumns}
              dataSource={history}
              rowKey="id"
              pagination={false}
              scroll={{ y: 400 }}
            />
          )}
        </div>
      ),
    }
  ];

  return (
    <Modal
      title="Health Insurance Details"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
    >
      <Tabs defaultActiveKey="1" items={items} />
    </Modal>
  );
}
