import React, { useEffect, useState } from 'react';
import { Descriptions, Tabs, Table, Image, Spin, Row, Col, Card, Typography, Button, Tag, Badge, Divider } from 'antd';
import { HealthInsuranceResponseDTO, getHealthInsuranceHistory, HistoryDTO, getHealthInsuranceById } from '@/api/healthinsurance';
import moment from 'moment';
import { useRouter } from 'next/router';
import { 
  ArrowLeftOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;

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
        if (field === 'ImageUrl') {
          return (
            <div key={field}>
              <div>Previous Image:</div>
              <Image src={value.Item1} style={{ maxWidth: '200px', marginBottom: '8px' }} />
              <div>New Image:</div>
              <Image src={value.Item2} style={{ maxWidth: '200px' }} />
            </div>
          );
        }
        return (
          <div key={field}>
            <strong>{field}:</strong>
            <div style={{ marginLeft: 16 }}>
              From: {value.Item1}<br />
              To: {value.Item2}
            </div>
          </div>
        );
      }
      return (
        <div key={field}>
          <strong>{field}:</strong> {value}
        </div>
      );
    });
  } catch {
    return details;
  }
};

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Pending':
      return 'processing';
    case 'Expired':
      return 'error';
    case 'SoftDeleted':
      return 'default';
    default:
      return 'default';
  }
};

const getVerificationStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'Verified':
      return 'success';
    case 'Rejected':
      return 'error';
    case 'Pending':
      return 'warning';
    default:
      return 'default';
  }
};

export function HealthInsuranceDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [insurance, setInsurance] = useState<HealthInsuranceResponseDTO | null>(null);
  const [history, setHistory] = useState<HistoryDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInsurance();
      fetchHistory();
    }
  }, [id]);

  const fetchInsurance = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await getHealthInsuranceById(id as string);
      if (response.isSuccess) {
        setInsurance(response.data);
      } else {
        toast.error("Unable to load insurance details");
      }
    } catch (error) {
      toast.error("Error loading insurance details");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await getHealthInsuranceHistory(id as string);
      if (response.isSuccess && Array.isArray(response.data)) {
        setHistory(response.data);
      } else {
        console.error("Invalid history data format:", response);
        setHistory([]);
      }
    } catch (error) {
      console.error("Unable to load history:", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const groupHistoryByDate = (historyData: HistoryDTO[]) => {
    const grouped = historyData.reduce((acc: { [key: string]: HistoryDTO[] }, item) => {
      const date = moment(item.updatedAt).format('DD/MM/YYYY');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([date, items]) => ({
      date,
      items: items.sort((a, b) => moment(b.updatedAt).valueOf() - moment(a.updatedAt).valueOf())
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!insurance) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Typography.Text>No insurance found</Typography.Text>
      </div>
    );
  }

  const items = [
    {
      key: '1',
      label: (
        <span>
          <SafetyCertificateOutlined className="mr-2" />
          Insurance Information
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col span={16}>
            <Card className="shadow-sm">
              <div className="mb-6">
                <Title level={5} className="mb-4">Policyholder Information</Title>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <div className="flex items-center mb-2">
                      <UserOutlined className="text-blue-500 mr-2" />
                      <Text strong>{insurance.user?.fullName || 'N/A'}</Text>
                    </div>
                    <Text type="secondary" className="ml-6">{insurance.user?.email || 'N/A'}</Text>
                  </Col>
                </Row>
              </div>

              <Divider />

              <div className="mb-6">
                <Title level={5} className="mb-4">Insurance Details</Title>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div className="mb-4">
                      <Text type="secondary">Insurance Number</Text>
                      <div>
                        <Text strong className="text-lg">{insurance.healthInsuranceNumber}</Text>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="mb-4">
                      <Text type="secondary">Healthcare Provider</Text>
                      <div>
                        <Text strong>{insurance.healthcareProviderName}</Text>
                        <Text type="secondary"> ({insurance.healthcareProviderCode})</Text>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="mb-4">
                      <Text type="secondary">Status</Text>
                      <div>
                        <Tag color={getStatusColor(insurance.status)}>{insurance.status}</Tag>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="mb-4">
                      <Text type="secondary">Verification Status</Text>
                <div>
                        <Badge status={getVerificationStatusColor(insurance.verificationStatus) as any} text={insurance.verificationStatus} />
                      </div>
                    </div>
                  </Col>
                </Row>
                </div>

              <Divider />

              <div className="mb-6">
                <Title level={5} className="mb-4">Personal Information</Title>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div className="mb-4">
                      <Text type="secondary">Full Name</Text>
                      <div><Text>{insurance.fullName}</Text></div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="mb-4">
                      <Text type="secondary">Date of Birth</Text>
                      <div>
                        <CalendarOutlined className="mr-2 text-blue-500" />
                        <Text>{formatDate(insurance.dateOfBirth)}</Text>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="mb-4">
                      <Text type="secondary">Gender</Text>
                      <div><Text>{insurance.gender}</Text></div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="mb-4">
                      <Text type="secondary">Address</Text>
                      <div>
                        <EnvironmentOutlined className="mr-2 text-blue-500" />
                        <Text>{insurance.address}</Text>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              <Divider />

              <div>
                <Title level={5} className="mb-4">Validity Period</Title>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Card className="bg-gray-50">
                      <Text type="secondary">Valid From</Text>
                      <div>
                        <ClockCircleOutlined className="mr-2 text-green-500" />
                        <Text strong>{formatDate(insurance.validFrom)}</Text>
                      </div>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card className="bg-gray-50">
                      <Text type="secondary">Valid To</Text>
                      <div>
                        <ClockCircleOutlined className="mr-2 text-red-500" />
                        <Text strong>{formatDate(insurance.validTo)}</Text>
                      </div>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card className="bg-gray-50">
                      <Text type="secondary">Deadline</Text>
                      <div>
                        <ClockCircleOutlined className="mr-2 text-orange-500" />
                        <Text strong>{insurance.deadline ? formatDate(insurance.deadline) : 'No deadline'}</Text>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card className="shadow-sm">
              <Title level={5} className="mb-4">Insurance Card Image</Title>
            {insurance.imageUrl ? (
                <div className="text-center">
                <Image
                  src={insurance.imageUrl}
                  alt="Insurance"
                    className="rounded-lg shadow-sm"
                  style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                />
              </div>
            ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <Text type="secondary">No image available</Text>
                </div>
              )}
            </Card>

            <Card className="shadow-sm mt-6">
              <Title level={5} className="flex items-center mb-4">
                <HistoryOutlined className="mr-2 text-primary" />
                Insurance History
              </Title>
              <div className="space-y-6 relative">
                <div className="relative">
                  <div className="absolute left-1 top-3 w-[2px] h-[calc(100%+1.5rem)] bg-gray-200"></div>
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 z-10"></div>
                    <Text strong>Last Updated</Text>
                  </div>
                  <div className="ml-4">
                    <Text>{formatDate(insurance.updatedAt)}</Text>
                    <div>
                      <Text type="secondary">by {insurance.updatedBy?.userName}</Text>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 z-10"></div>
                    <Text strong>Created</Text>
                  </div>
                  <div className="ml-4">
                    <Text>{formatDate(insurance.createdAt)}</Text>
                    <div>
                      <Text type="secondary">by {insurance.createdBy?.userName}</Text>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <HistoryOutlined className="mr-2" />
          History
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Card className="shadow-sm">
            <div className="mb-4">
              <Title level={5} className="flex items-center">
                <HistoryOutlined className="mr-2 text-primary" />
                Change History
              </Title>
            </div>
            
            <div className="space-y-8">
              {groupHistoryByDate(history).map(({ date, items }) => (
                <div key={date} className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-200"></div>
                  
                  <div className="relative mb-4">
                    <div className="absolute -left-2 top-1/2 w-4 h-4 rounded-full bg-blue-500 transform -translate-y-1/2"></div>
                    <Card className="ml-6 bg-blue-50 border-0">
                      <Text strong>{date}</Text>
                    </Card>
                  </div>

                  <div className="space-y-4 ml-6">
                    {items.map((record) => (
                      <Card key={record.id} size="small" className="shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <UserOutlined className="mr-2 text-blue-500" />
                            <div>
                              <Text strong>{record.updatedBy.userName}</Text>
                              <Text type="secondary" className="ml-2">
                                {moment(record.updatedAt).format('HH:mm:ss')}
                              </Text>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {record.previousStatus !== record.newStatus ? (
                              <>
                                <Tag color="default">{record.previousStatus || 'None'}</Tag>
                                <ArrowRightOutlined className="text-gray-400" />
                                <Tag color={getStatusColor(record.newStatus)}>{record.newStatus}</Tag>
                              </>
                            ) : (
                              <Tag color={getStatusColor(record.newStatus)}>{record.newStatus}</Tag>
                            )}
                          </div>
                        </div>

                        <div className="pl-2">
                          {(() => {
                            try {
                              const changes = JSON.parse(record.changeDetails);
                              return (
                                <div className="space-y-3">
                                  {Object.entries(changes).map(([field, value]: [string, any]) => {
                                    if (typeof value === 'object' && value.Item1 !== undefined && value.Item2 !== undefined) {
                                      if (field === 'ImageUrl') {
                                        return (
                                          <Card key={field} size="small" className="bg-gray-50">
                                            <div className="space-y-2">
                                              <Text strong className="block mb-2">{field}</Text>
                                              <Row gutter={16}>
                                                <Col span={12}>
                                                  <div className="text-center">
                                                    <Text type="secondary" className="block mb-1">Previous</Text>
                                                    {value.Item1 ? (
                                                      <Image
                                                        src={value.Item1}
                                                        alt="Previous"
                                                        className="rounded-lg border border-gray-200"
                                                        style={{ maxHeight: '100px', objectFit: 'contain' }}
                                                      />
                                                    ) : (
                                                      <div className="h-[100px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                                        <Text type="secondary">No image</Text>
                                                      </div>
                                                    )}
                                                  </div>
                                                </Col>
                                                <Col span={12}>
                                                  <div className="text-center">
                                                    <Text type="secondary" className="block mb-1">After</Text>
                                                    {value.Item2 ? (
                                                      <Image
                                                        src={value.Item2}
                                                        alt="New"
                                                        className="rounded-lg border border-gray-200"
                                                        style={{ maxHeight: '100px', objectFit: 'contain' }}
                                                      />
                                                    ) : (
                                                      <div className="h-[100px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                                        <Text type="secondary">No image</Text>
                                                      </div>
                                                    )}
                                                  </div>
                                                </Col>
                                              </Row>
                                            </div>
                                          </Card>
                                        );
                                      }
                                      return (
                                        <div key={field} className="bg-gray-50 rounded p-3">
                                          <Text strong className="block mb-2">{field}</Text>
                                          <Row gutter={16}>
                                            <Col span={12}>
                                              <div className="p-2 rounded bg-white border border-gray-100">
                                                <Text type="secondary" className="block mb-1">Previous:</Text>
                                                <Text>{value.Item1}</Text>
                                              </div>
                                            </Col>
                                            <Col span={12}>
                                              <div className="p-2 rounded bg-white border border-gray-100">
                                                <Text type="secondary" className="block mb-1">After:</Text>
                                                <Text>{value.Item2}</Text>
                                              </div>
                                            </Col>
                                          </Row>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div key={field} className="bg-gray-50 rounded p-3">
                                        <Text strong className="block">{field}:</Text>
                                        <div className="mt-1 p-2 rounded bg-white border border-gray-100">
                                          <Text>{value}</Text>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            } catch {
                              return <Text type="secondary">{record.changeDetails}</Text>;
                            }
                          })()}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card className="mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()}
            className="mr-4 hover:bg-gray-100"
          >
            Back
          </Button>
          <Title level={4} className="m-0">Health Insurance Details</Title>
          <div style={{ width: 32 }}></div>
        </div>
        <Tabs 
          defaultActiveKey="1" 
          items={items}
          className="mt-4"
          type="card"
        />
      </Card>
    </div>
  );
} 