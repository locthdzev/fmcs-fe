import React, { useEffect, useState } from 'react';
import { Card, Collapse, Descriptions, Tag, Typography, Spin, Pagination, Empty, Divider, List, Tabs, Badge } from 'antd';
import { getCurrentUserHealthCheckResults, getHealthCheckResultById, HealthCheckResultsResponseDTO, HealthCheckResultsIdResponseDTO } from '@/api/healthcheckresult';
import moment from 'moment';
import { PageHeader } from '@/components/shared/PageHeader';
import { CaretRightOutlined, FileTextOutlined, MedicineBoxOutlined, AlertOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const statusColors: Record<string, string> = {
  'Waiting for Approval': 'orange',
  'FollowUpRequired': 'red',
  'NoFollowUpRequired': 'green',
  'Completed': 'blue',
  'CancelledCompletely': 'gray',
  'CancelledForAdjustment': 'purple',
  'SoftDeleted': 'black'
};

const formatStatus = (status: string) => {
  // Format the status from camelCase to readable format
  if (status === 'FollowUpRequired') return 'Follow-up Required';
  if (status === 'NoFollowUpRequired') return 'No Follow-up Required';
  if (status === 'CancelledCompletely') return 'Cancelled Completely';
  if (status === 'CancelledForAdjustment') return 'Cancelled for Adjustment';
  if (status === 'SoftDeleted') return 'Soft Deleted';
  return status;
};

const MyHealthCheckResults: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HealthCheckResultsResponseDTO[]>([]);
  const [detailsMap, setDetailsMap] = useState<Record<string, HealthCheckResultsIdResponseDTO>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // State to keep track of expanded panels
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

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
        setError(response.message || 'Failed to load health check results');
      }
    } catch (error) {
      console.error('Error fetching health check results:', error);
      setError('An error occurred while fetching your health check results');
    } finally {
      setLoading(false);
    }
  };

  const fetchResultDetails = async (resultId: string) => {
    // Skip if we already have the details
    if (detailsMap[resultId]) return;
    
    setLoadingDetails(prev => ({ ...prev, [resultId]: true }));
    try {
      const response = await getHealthCheckResultById(resultId);
      if (response.success) {
        setDetailsMap(prev => ({
          ...prev,
          [resultId]: response.data
        }));
      }
    } catch (error) {
      console.error(`Error fetching details for result ${resultId}:`, error);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [resultId]: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

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
                  style={{ backgroundColor: '#f50' }} 
                />
              )}
            </div>
          }
        >
          <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}>
            <Descriptions.Item label="Checkup Date" span={1}>
              {moment(details.checkupDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Healthcare Staff" span={2}>
              {details.staff?.fullName}
            </Descriptions.Item>
            {details.followUpRequired && details.followUpDate && (
              <Descriptions.Item label="Follow-up Date" span={3}>
                <Text strong className="text-red-500">
                  {moment(details.followUpDate).format('DD/MM/YYYY')}
                </Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Tabs 
          defaultActiveKey="details" 
          className="bg-white rounded shadow-sm" 
          type="card"
        >
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Health Check Details
              </span>
            } 
            key="details"
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
                  <Descriptions bordered column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}>
                    <Descriptions.Item 
                      label={<span className="font-semibold">Result Summary</span>}
                      labelStyle={{ backgroundColor: '#f0f7ff' }}
                    >
                      <Paragraph>{detail.resultSummary}</Paragraph>
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<span className="font-semibold">Diagnosis</span>}
                      labelStyle={{ backgroundColor: '#f0f7ff' }}
                    >
                      <Paragraph>{detail.diagnosis}</Paragraph>
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<span className="font-semibold">Recommendations</span>}
                      labelStyle={{ backgroundColor: '#f0f7ff' }}
                    >
                      <Paragraph>{detail.recommendations}</Paragraph>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              ))
            ) : (
              <Empty description="No detailed information available" />
            )}
          </TabPane>
          <TabPane 
            tab={
              <span>
                <MedicineBoxOutlined />
                Prescriptions {details.prescriptions?.length > 0 && 
                  <Badge count={details.prescriptions.length} style={{ marginLeft: 5, backgroundColor: '#52c41a' }} />
                }
              </span>
            } 
            key="prescriptions"
          >
            {details.prescriptions && details.prescriptions.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={details.prescriptions}
                renderItem={item => (
                  <List.Item>
                    <Card className="w-full shadow-sm">
                      <List.Item.Meta
                        title={
                          <div className="flex items-center gap-2">
                            <MedicineBoxOutlined className="text-green-500" />
                            <span>Prescription Date: {moment(item.prescriptionDate).format('DD/MM/YYYY')}</span>
                          </div>
                        }
                        description={
                          <div className="mt-2">
                            <Tag color={item.status === 'Dispensed' ? 'green' : 'blue'}>
                              {item.status}
                            </Tag>
                            <span className="ml-2">Total Medicines: {item.totalMedicines}</span>
                          </div>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No prescriptions available" />
            )}
          </TabPane>
          <TabPane 
            tab={
              <span>
                <AlertOutlined />
                Treatment Plans {details.treatmentPlans?.length > 0 && 
                  <Badge count={details.treatmentPlans.length} style={{ marginLeft: 5, backgroundColor: '#1677ff' }} />
                }
              </span>
            } 
            key="treatment-plans"
          >
            {details.treatmentPlans && details.treatmentPlans.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={details.treatmentPlans}
                renderItem={item => (
                  <List.Item>
                    <Card bordered={true} className="w-full shadow-sm">
                      <Title level={5} className="flex items-center">
                        <AlertOutlined className="mr-2 text-blue-500" />
                        Treatment Plan
                      </Title>
                      <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                        <Descriptions.Item 
                          label="Status" 
                          labelStyle={{ backgroundColor: '#f0f7ff' }}
                        >
                          <Tag color={item.status === 'Completed' ? 'green' : item.status === 'InProgress' ? 'blue' : 'gray'}>
                            {item.status}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item 
                          label="Duration" 
                          labelStyle={{ backgroundColor: '#f0f7ff' }}
                        >
                          {moment(item.startDate).format('DD/MM/YYYY')} - {moment(item.endDate).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item 
                          label="Days Remaining" 
                          labelStyle={{ backgroundColor: '#f0f7ff' }}
                        >
                          {item.daysRemaining >= 0 ? (
                            <Tag color="blue">{item.daysRemaining} days</Tag>
                          ) : (
                            <Tag color="green">Completed</Tag>
                          )}
                        </Descriptions.Item>
                      </Descriptions>
                      <Divider orientation="left">Description</Divider>
                      <Paragraph>{item.treatmentDescription}</Paragraph>
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No treatment plans available" />
            )}
          </TabPane>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="p-6">
      <PageHeader title="My Health Check Results" subtitle="View your health examination history and details" />
      
      <Card className="mt-4 shadow">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <Text type="danger">{error}</Text>
          </div>
        ) : data.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No health check results found"
          />
        ) : (
          <>
            <Collapse 
              expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
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
                        <span className="font-semibold text-lg mr-2">{result.healthCheckResultCode}</span>
                        {result.followUpRequired && (
                          <Badge 
                            count="Follow-up" 
                            style={{ backgroundColor: '#f50', marginRight: 8 }} 
                          />
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Tag color={statusColors[result.status] || 'default'}>
                          {formatStatus(result.status)}
                        </Tag>
                        <span className="text-gray-500 text-sm">
                          {moment(result.checkupDate).format('DD/MM/YYYY')}
                        </span>
                      </div>
                    </div>
                  }
                >
                  {renderHealthCheckResultDetails(result.id)}
                </Panel>
              ))}
            </Collapse>
            
            <div className="flex justify-end mt-4">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                onChange={(newPage) => setPage(newPage)}
                onShowSizeChange={(_, newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                showTotal={(total) => `Total ${total} items`}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default MyHealthCheckResults; 