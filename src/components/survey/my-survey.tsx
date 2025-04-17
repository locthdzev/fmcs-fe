import React, { useState, useEffect, useContext } from 'react';
import { Card, Typography, Rate, Input, Button, Form, Space, Tag, Spin, notification, Progress, Avatar, List, Result, Flex, Alert } from 'antd';
import { UserOutlined, SaveOutlined, ExclamationCircleOutlined, FrownOutlined, MehOutlined, SmileOutlined, CheckCircleFilled, CalendarOutlined, StarOutlined, ReloadOutlined } from '@ant-design/icons';
import { getSurveyById, updateSurvey, SurveyResponse, SurveyUpdateRequest, getSurveysByUserId, getSurveysByStaffId } from '@/api/survey';
import { useRouter } from 'next/router';
import moment from 'moment';
import { UserContext } from '@/context/UserContext';
import { useSurveyRequired } from '@/context/SurveyRequiredContext';
import { SurveyAlert } from './SurveyAlert';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface SurveyProps {
  id?: string;
  onSuccess?: () => void;
  readOnly?: boolean;
}

interface SurveyListProps {
  userId?: string;
  onSelectSurvey?: (id: string) => void;
}

// Custom icons for rate component with larger size
const customIcons: Record<number, React.ReactNode> = {
  1: <FrownOutlined className="text-red-500" style={{ fontSize: 36 }} />,
  2: <FrownOutlined className="text-orange-500" style={{ fontSize: 36 }} />,
  3: <MehOutlined className="text-yellow-500" style={{ fontSize: 36 }} />,
  4: <SmileOutlined className="text-blue-500" style={{ fontSize: 36 }} />,
  5: <SmileOutlined className="text-green-500" style={{ fontSize: 36 }} />,
};

export const Survey: React.FC<SurveyProps> = ({ id, onSuccess, readOnly = false }) => {
  const [survey, setSurvey] = useState<SurveyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [form] = Form.useForm();
  const router = useRouter();
  
  // Get ID from router if not passed via props
  const surveyId = id || (router.query.id as string);
  
  // Move the hook to component level
  const surveyRequiredContext = useSurveyRequired();

  useEffect(() => {
    if (surveyId) {
      fetchSurveyData();
    }
  }, [surveyId]);

  const fetchSurveyData = async () => {
    setLoading(true);
    try {
      const response = await getSurveyById(surveyId);
      if (response.isSuccess && response.data) {
        setSurvey(response.data);
        // Initialize form with existing data
        form.setFieldsValue({
          rating: response.data.rating,
          feedback: response.data.feedback || '',
        });
      } else {
        notification.error({
          message: 'Error',
          description: 'Could not load survey information',
        });
      }
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: error.message || 'Could not load survey information',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!surveyId) {
      console.error("Survey ID is missing!");
      notification.error({ message: 'Error', description: 'Survey ID is missing.' });
      return;
    }
    
    console.log("Form values received:", JSON.stringify(values));
    console.log("Current Survey ID:", surveyId);
    
    setSaving(true);
    try {
      // Ensure rating is a valid integer
      let ratingValue = parseInt(values.rating);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        console.error("Invalid rating value from form:", values.rating);
        notification.error({
          message: 'Error',
          description: 'Please select a valid rating from 1 to 5',
        });
        setSaving(false);
        return;
      }
      
      // Simplify data to be sent
      const updateData = {
        rating: ratingValue,
        feedback: values.feedback || "",
        status: "Submitted"
      };
      
      console.log("Prepared updateData:", JSON.stringify(updateData));
      console.log(`Attempting to update survey with ID: ${surveyId}`);
      
      const response = await updateSurvey(surveyId, updateData);
      
      console.log("API update response received:", response);
      
      if (response.isSuccess) {
        notification.success({
          message: 'Success',
          description: 'Survey updated successfully',
          icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
        });
        
        // Reload current survey data without checking other surveys
        fetchSurveyData();
        
        // Only update survey status after all other tasks are completed
        // and only call once
        if (onSuccess) {
          onSuccess();
        }
        
        // Update survey status in context after completing all other tasks
        // and use a longer timeout to avoid loops
        if (surveyRequiredContext) {
          setTimeout(() => {
            surveyRequiredContext.checkPendingSurveys();
          }, 1000);
        }
      } else {
        console.error("API update failed:", response.message);
        notification.error({
          message: 'Error',
          description: response.message || 'Could not update survey',
        });
      }
    } catch (error: any) {
      console.error("handleSubmit Error caught:", error);
      console.error("Error details (if available):", error.response?.data);
      
      // Display detailed error message
      let errorMsg = 'Could not update survey';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.title) { // Check for ASP.NET Core validation error title
        errorMsg = error.response.data.title;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      notification.error({
        message: 'Error',
        description: errorMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Pending': return 'orange';
      case 'Completed': return 'green';
      case 'Cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStatusEmoji = (status?: string) => {
    switch (status) {
      case 'Completed': return '✓';
      case 'Pending': return '⏱';
      case 'Cancelled': return '✕';
      default: return '';
    }
  };
  
  // Convert rating to percentage for progress indicator
  const getRatingPercentage = (rating: number = 0) => {
    return (rating / 5) * 100;
  };

  const getIconColorClass = (rating: number): string => {
    switch (rating) {
      case 1: return 'text-red-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-yellow-500';
      case 4: return 'text-blue-500';
      case 5: return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
        <Spin size="large" />
        <p className="mt-4 text-gray-500">Loading survey information...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-red-50 p-6 text-center">
          <ExclamationCircleOutlined style={{ fontSize: 64, color: '#f5222d' }} />
          <Title level={3} className="mt-4 text-red-600">Survey Not Found</Title>
          <Paragraph className="text-gray-500 mb-6">
            The survey doesn't exist or has been deleted. Please check the URL.
          </Paragraph>
          <Button 
            type="primary" 
            size="large" 
            onClick={() => router.push('/survey/MySurvey')}
            className="hover-lift"
          >
            Back to Survey Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden card-clean">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                {getStatusEmoji(survey.status)} Survey Feedback Form
              </Title>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                Survey ID: {surveyId?.substring(0, 8)}...
              </Text>
            </div>
            <Tag 
              color={getStatusColor(survey.status)} 
              className="text-sm px-3 py-1 font-medium"
              style={{ fontSize: '1rem' }}
            >
              {survey.status || 'Pending'}
            </Tag>
          </div>
        </div>
        
        {/* Main content */}
        <div className="p-6">
          {/* Appointment info card */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Staff info for user view */}
            <Card 
              className="bg-blue-50 border border-blue-100 card-clean"
            >
              <div className="flex items-start">
                <Avatar icon={<UserOutlined />} className="mr-4 bg-blue-500" />
                <div>
                  <Text type="secondary" className="block mb-1">Healthcare Staff</Text>
                  <Text strong className="text-lg block">{survey.staff?.fullName}</Text>
                  <Text type="secondary">{survey.staff?.email}</Text>
                </div>
              </div>
            </Card>
            
            {/* Date and Status card */}
            <Card className="bg-gray-50 border border-gray-100 card-clean">
              <div>
                <div className="mb-4 flex items-center">
                  <CalendarOutlined className="mr-2 text-blue-500" />
                  <div>
                    <Text type="secondary" className="block mb-1">Survey Date</Text>
                    <Text strong className="text-lg">{moment(survey.surveyDate).format('DD/MM/YYYY')}</Text>
                  </div>
                </div>
                <div className="flex items-center">
                  <CalendarOutlined className="mr-2 text-blue-500" />
                  <div>
                    <Text type="secondary" className="block mb-1">Created Date</Text>
                    <Text>{moment(survey.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Appointment details if available */}
          {survey.appointment && (
            <Card 
              className="mb-6 bg-gray-50 border border-gray-100 card-clean"
            >
              <div className="mb-2">
                <Text className="text-gray-700 font-medium text-lg">Appointment Information</Text>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text type="secondary" className="block mb-1">Appointment Date</Text>
                  <Text strong>{moment(survey.appointment.appointmentDate).format('DD/MM/YYYY HH:mm')}</Text>
                </div>
                {survey.appointment.reason && (
                  <div>
                    <Text type="secondary" className="block mb-1">Reason</Text>
                    <Text>{survey.appointment.reason}</Text>
                  </div>
                )}
                {survey.appointment.status && (
                  <div className="md:col-span-2 mt-2">
                    <Text type="secondary" className="block mb-1">Appointment Status</Text>
                    <Tag color="blue">{survey.appointment.status}</Tag>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Rating form */}
          <Card
            title={<span className="text-lg">Service Rating</span>}
            className="mb-6 border-gray-200 card-clean"
          >
            {readOnly ? (
              <div className="p-4">
                <div className="mb-6 text-center">
                  <Progress 
                    type="circle" 
                    percent={getRatingPercentage(survey.rating)} 
                    format={() => (
                      <div className="text-2xl font-bold">
                        {survey.rating}
                        <span className="text-base font-normal text-gray-400">/5</span>
                      </div>
                    )} 
                    strokeColor={{
                      '0%': '#1677ff',
                      '100%': '#1677ff',
                    }}
                    className="mb-2"
                  />
                  <Text className="block text-gray-500 mt-2">Rating</Text>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-center">
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isColored = star <= survey.rating;
                        const colorClass = isColored ? 
                          (star === 1 ? 'text-red-500' : 
                           star === 2 ? 'text-orange-500' : 
                           star === 3 ? 'text-yellow-500' : 
                           star === 4 ? 'text-blue-500' : 
                           'text-green-500') : 'text-gray-400';
                        
                        return (
                          <span key={star}>
                            {(star === 1 || star === 2) ? (
                              <FrownOutlined className={colorClass} style={{ fontSize: 36 }} />
                            ) : star === 3 ? (
                              <MehOutlined className={colorClass} style={{ fontSize: 36 }} />
                            ) : (
                              <SmileOutlined className={colorClass} style={{ fontSize: 36 }} />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Text type="secondary" className="block mb-2 text-base">Comments</Text>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {survey.feedback ? (
                      <Paragraph>{survey.feedback}</Paragraph>
                    ) : (
                      <Paragraph className="text-gray-400">No comments provided</Paragraph>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                  rating: survey.rating,
                  feedback: survey.feedback || '',
                }}
              >
                <div className="mb-6">
                  {survey.rating > 0 && (
                    <div className="mb-6 text-center">
                      <Progress 
                        type="circle" 
                        percent={getRatingPercentage(survey.rating)} 
                        format={() => (
                          <div className="text-2xl font-bold">
                            {survey.rating}
                            <span className="text-base font-normal text-gray-400">/5</span>
                          </div>
                        )} 
                        strokeColor={{
                          '0%': '#1677ff',
                          '100%': '#1677ff',
                        }}
                        className="mb-2"
                      />
                      <Text className="block text-gray-500 mt-2">Current Rating</Text>
                    </div>
                  )}
                
                  <Form.Item 
                    name="rating" 
                    rules={[{ required: true, message: 'Please rate your satisfaction' }]}
                  >
                    <div className="mt-2 mb-6">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors rating-container">
                        <Flex align="center" justify="center" vertical gap={16}>
                          <Rate
                            className="rating-large"
                            defaultValue={0}
                            onChange={(value) => {
                              console.log('Rating changed to:', value);
                              
                              // Update form field - Form.Item should handle this automatically,
                              // but explicitly setting it can ensure reactivity if needed.
                              form.setFieldsValue({ rating: value });
                              
                              const container = document.querySelector('.rating-container');
                              if (container) {
                                container.classList.remove('pulse', 'border-blue-400');
                                // Force reflow to restart animation
                                void (container as HTMLElement).offsetWidth;
                                container.classList.add('pulse', 'border-blue-400');
                                
                                setTimeout(() => {
                                  container.classList.remove('border-blue-400');
                                }, 800);
                              }
                            }}
                            character={({ index, value }) => {
                              // Handle possible undefined values with defaults
                              const indexValue = index ?? 0;
                              const ratingValue = value ?? 0;
                              const colorClass = ratingValue > indexValue ? getIconColorClass(indexValue + 1) : 'text-gray-400';
                              
                              // Display different icons based on index (0-based)
                              if (indexValue === 0 || indexValue === 1) {
                                return <FrownOutlined className={colorClass} style={{ fontSize: 40 }} />;
                              } else if (indexValue === 2) {
                                return <MehOutlined className={colorClass} style={{ fontSize: 40 }} />;
                              } else {
                                return <SmileOutlined className={colorClass} style={{ fontSize: 40 }} />;
                              }
                            }}
                          />
                          
                          <Flex className="w-full" justify="space-between">
                            <div className="text-center text-xs text-red-500 font-medium">Very Unsatisfied</div>
                            <div className="text-center text-xs text-green-500 font-medium">Very Satisfied</div>
                          </Flex>
                        </Flex>
                      </div>
                    </div>
                  </Form.Item>
                  
                  <Form.Item
                    name="feedback"
                    label={<span className="text-base">Your Comments</span>}
                  >
                    <TextArea 
                      rows={4} 
                      placeholder="Share your experience with our service..." 
                      className="text-base transition-standard"
                    />
                  </Form.Item>
                </div>
                
                <Form.Item className="mb-0 flex justify-center">
                  <Space size="large">
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={saving}
                      size="large"
                      className="min-w-[160px] hover-lift h-12 text-base"
                    >
                      Update Survey
                    </Button>
                    <Button
                      size="large"
                      onClick={() => router.back()}
                      className="hover-lift"
                    >
                      Back
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </Card>
          
          {/* Note or instruction */}
          <div className="text-center text-gray-500 text-sm mb-4">
            <p>Thank you for taking the time to rate our service.</p>
            <p>Your feedback will help us improve our service quality.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to display user's survey list
export const SurveyList: React.FC<SurveyListProps> = ({ userId, onSelectSurvey }) => {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  const userContext = useContext(UserContext);
  const router = useRouter();
  const surveyRequiredContext = useSurveyRequired();
  
  // Survey status constants to match backend
  const SURVEY_STATUS = {
    PENDING: "Pending",
    SUBMITTED: "Submitted",
    UPDATED: "UpdatedAfterSubmission"
  };
  
  // Get user ID from prop or from context
  const userIdToUse = userId || (userContext?.user?.userId);
  
  useEffect(() => {
    if (userIdToUse) {
      fetchUserSurveys(userIdToUse);
    } else {
      setLoading(false);
      setError('User not found');
    }
  }, [userIdToUse]);

  const fetchUserSurveys = async (userIdToUse: string | undefined) => {
    if (!userIdToUse) {
      setError('User ID is required');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // For regular users, fetch their surveys
      const response = await getSurveysByUserId(userIdToUse, {
        page: 1,
        pageSize: 50,
      });
      console.log('User Survey API Response:', JSON.stringify(response));

      if (response && response.isSuccess) {
        console.log('Response data:', JSON.stringify(response.data));
        
        // Check different possible response structures
        let surveyItems: SurveyResponse[] = [];
        let totalItems = 0;
        
        if (Array.isArray(response.data)) {
          // If data is directly an array of surveys
          surveyItems = response.data;
          totalItems = response.data.length;
        } else if (response.data && typeof response.data === 'object') {
          if (response.data.items && Array.isArray(response.data.items)) {
            // If data has items array (pagination structure)
            surveyItems = response.data.items;
            totalItems = response.data.totalItems || surveyItems.length;
          } else if (response.data.id) {
            // If data is the survey object itself (single item)
            surveyItems = [response.data];
            totalItems = 1;
          }
        }
        
        console.log('Processed items:', surveyItems);
        setSurveys(surveyItems);
        
        if (totalItems === 0) {
          setError('You don\'t have any surveys yet.');
        }
        
        // Update survey counts by status
        const pendingCount = surveyItems.filter(s => s.status === SURVEY_STATUS.PENDING).length;
        const completedCount = surveyItems.filter(s => s.status === SURVEY_STATUS.SUBMITTED || s.status === SURVEY_STATUS.UPDATED).length;
        setPendingCount(pendingCount);
        setCompletedCount(completedCount);
        
        // Update survey status in context after fetch is complete
        if (surveyRequiredContext) {
          setTimeout(() => {
            surveyRequiredContext.checkPendingSurveys();
          }, 300);
        }
      } else {
        setError('Unable to load your surveys.');
      }
    } catch (error: any) {
      console.error('Error in fetchUserSurveys:', error);
      setError(error.message || 'An error occurred while loading surveys.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case SURVEY_STATUS.PENDING: return 'orange';
      case SURVEY_STATUS.SUBMITTED: return 'green';
      case SURVEY_STATUS.UPDATED: return 'blue';
      default: return 'default';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case SURVEY_STATUS.SUBMITTED: return <CheckCircleFilled style={{ color: '#52c41a' }} />;
      case SURVEY_STATUS.PENDING: return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case SURVEY_STATUS.UPDATED: return <CheckCircleFilled style={{ color: '#1890ff' }} />;
      default: return <ExclamationCircleOutlined style={{ color: '#1677ff' }} />;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case SURVEY_STATUS.PENDING: return 'Pending';
      case SURVEY_STATUS.SUBMITTED: return 'Submitted';
      case SURVEY_STATUS.UPDATED: return 'Updated';
      default: return status || 'Pending';
    }
  };

  const handleViewSurvey = (id: string) => {
    if (onSelectSurvey) {
      onSelectSurvey(id);
    } else {
      router.push(`/survey/details/${id}`);
    }
  };

  const filteredSurveys = filterStatus 
    ? surveys.filter(survey => survey.status === filterStatus)
    : surveys;

  // Get counts for each status
  const statusCounts = {
    All: surveys.length,
    [SURVEY_STATUS.PENDING]: surveys.filter(s => s.status === SURVEY_STATUS.PENDING).length,
    [SURVEY_STATUS.SUBMITTED]: surveys.filter(s => s.status === SURVEY_STATUS.SUBMITTED).length,
    [SURVEY_STATUS.UPDATED]: surveys.filter(s => s.status === SURVEY_STATUS.UPDATED).length
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
        <Spin size="large" />
        <p className="mt-6 text-gray-500 animate-pulse">Loading your surveys...</p>
      </div>
    );
  }

  if (error && surveys.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <ExclamationCircleOutlined style={{ fontSize: 64, color: '#faad14', marginBottom: 16 }} />
          <Title level={3}>Notice</Title>
          <Paragraph className="text-gray-500 mb-6">
            {error}
          </Paragraph>
          <Button 
            type="primary" 
            size="large"
            onClick={() => router.push('/home')}
            className="hover:scale-105 transition-transform"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // If no error but still no surveys, show empty state
  if (surveys.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <img 
            src="/images/empty-state.svg" 
            alt="No surveys" 
            className="w-64 h-64 mx-auto mb-6 opacity-70"
            onError={(e) => {
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f2f5'/%3E%3Ctext x='50%' y='50%' font-family='Arial' font-size='12' fill='%23bfbfbf' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
            }} 
          />
          <Title level={3}>No Surveys Found</Title>
          <Paragraph className="text-gray-500 mb-6">
            You currently don't have any surveys to complete or that have been completed.
            Surveys will appear here after you have appointments with healthcare staff.
          </Paragraph>
          <Button 
            type="primary" 
            size="large"
            onClick={() => router.push('/home')}
            className="hover:scale-105 transition-transform"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add survey alert notification */}
      <SurveyAlert />
      
      <Card 
        title={
          <div className="flex items-center">
            <StarOutlined className="text-yellow-500 mr-2" />
            <span className="text-lg font-semibold">My Surveys</span>
          </div>
        }
        className="shadow-md"
      >
        {/* Header with statistics */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="mb-4">
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              My Surveys
            </Title>
          </div>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', marginBottom: 20 }}>
            Review and complete your feedback surveys. Your opinions help us improve our services.
          </Paragraph>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500">Total Surveys</div>
                  <div className="text-2xl font-bold text-gray-800">{statusCounts.All}</div>
                </div>
                <div className="bg-gray-100 p-2 rounded-full">
                  <CalendarOutlined style={{ fontSize: 20, color: '#1f2937' }} />
                </div>
              </div>
            </div>
            
            <div className="bg-amber-500 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-white opacity-90">Pending</div>
                  <div className="text-2xl font-bold text-white">{statusCounts[SURVEY_STATUS.PENDING]}</div>
                </div>
                <div className="bg-white bg-opacity-30 p-2 rounded-full">
                  <ExclamationCircleOutlined style={{ fontSize: 20, color: 'white' }} />
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-500 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-white opacity-90">Submitted</div>
                  <div className="text-2xl font-bold text-white">{statusCounts[SURVEY_STATUS.SUBMITTED]}</div>
                </div>
                <div className="bg-white bg-opacity-30 p-2 rounded-full">
                  <CheckCircleFilled style={{ fontSize: 20, color: 'white' }} />
                </div>
              </div>
            </div>
            
            <div className="bg-sky-500 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-white opacity-90">Updated</div>
                  <div className="text-2xl font-bold text-white">{statusCounts[SURVEY_STATUS.UPDATED]}</div>
                </div>
                <div className="bg-white bg-opacity-30 p-2 rounded-full">
                  <CheckCircleFilled style={{ fontSize: 20, color: 'white' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter tabs */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="mb-4">
            <Title level={4} className="mb-3">Filter by Status</Title>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <Button 
                type={filterStatus === null ? "primary" : "default"}
                onClick={() => setFilterStatus(null)}
                className="min-w-[100px]"
              >
                All ({statusCounts.All})
              </Button>
              <Button 
                type={filterStatus === SURVEY_STATUS.PENDING ? "primary" : "default"}
                onClick={() => setFilterStatus(SURVEY_STATUS.PENDING)}
                className="min-w-[100px]"
                icon={<ExclamationCircleOutlined />}
              >
                Pending ({statusCounts[SURVEY_STATUS.PENDING]})
              </Button>
              <Button 
                type={filterStatus === SURVEY_STATUS.SUBMITTED ? "primary" : "default"}
                onClick={() => setFilterStatus(SURVEY_STATUS.SUBMITTED)}
                className="min-w-[100px]"
                icon={<CheckCircleFilled />}
              >
                Submitted ({statusCounts[SURVEY_STATUS.SUBMITTED]})
              </Button>
              <Button 
                type={filterStatus === SURVEY_STATUS.UPDATED ? "primary" : "default"}
                onClick={() => setFilterStatus(SURVEY_STATUS.UPDATED)}
                className="min-w-[100px]"
                icon={<CheckCircleFilled />}
              >
                Updated ({statusCounts[SURVEY_STATUS.UPDATED]})
              </Button>
            </div>
          </div>

          {/* Survey cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filteredSurveys.map((survey, index) => (
              <div 
                key={survey.id} 
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                style={{ 
                  animationDelay: `${index * 0.05}s`,
                  animation: 'fadeInUp 0.5s ease-out forwards'
                }}
              >
                <div className={`h-2 ${
                  survey.status === SURVEY_STATUS.SUBMITTED ? 'bg-green-500' : 
                  survey.status === SURVEY_STATUS.PENDING ? 'bg-orange-400' : 
                  'bg-blue-500'}`}>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <Avatar icon={<UserOutlined />} className="mr-2" />
                      <div>
                        <div className="font-medium">{survey.staff?.fullName}</div>
                        <div className="text-xs text-gray-500">{survey.staff?.email}</div>
                      </div>
                    </div>
                    <Tag color={getStatusColor(survey.status)} className="ml-2">
                      {getStatusIcon(survey.status)} {getStatusLabel(survey.status)}
                    </Tag>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Survey Date</div>
                    <div className="flex items-center">
                      <CalendarOutlined className="mr-2 text-blue-500" />
                      <span>{moment(survey.surveyDate).format('DD/MM/YYYY')}</span>
                    </div>
                  </div>
                  
                  {survey.rating > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-1">Your Rating</div>
                      <div className="flex items-center">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            // Determine if this icon should be colored
                            const isColored = star <= survey.rating;
                            const colorClass = isColored ? 
                              (star === 1 ? 'text-red-500' : 
                               star === 2 ? 'text-orange-500' : 
                               star === 3 ? 'text-yellow-500' : 
                               star === 4 ? 'text-blue-500' : 
                               'text-green-500') : 'text-gray-400';
                            
                            // Display different smile icons based on the value
                            return (
                              <span key={star}>
                                {(star === 1 || star === 2) ? (
                                  <FrownOutlined className={colorClass} style={{ fontSize: 24 }} />
                                ) : star === 3 ? (
                                  <MehOutlined className={colorClass} style={{ fontSize: 24 }} />
                                ) : (
                                  <SmileOutlined className={colorClass} style={{ fontSize: 24 }} />
                                )}
                              </span>
                            );
                          })}
                        </div>
                        <span className="ml-2 text-lg font-medium">{survey.rating}/5</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="primary"
                      onClick={() => handleViewSurvey(survey.id)}
                      className="hover:scale-105 transition-transform"
                    >
                      {survey.rating > 0 ? 'View Details' : 'Fill Survey'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Add global animation */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
