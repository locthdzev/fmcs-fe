import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Card, Space, Button, Input, Select, DatePicker, Tag, Row, Col, Tooltip, Modal, Spin, Statistic, Typography, notification, Popconfirm, Radio, Checkbox, Flex, Tabs, Badge, Avatar, Rate, Progress } from 'antd';
import { SearchOutlined, EditOutlined, EyeOutlined, ExportOutlined, FilterOutlined, ReloadOutlined, DownloadOutlined, StarOutlined, UserOutlined, TeamOutlined, CalendarOutlined, FileTextOutlined, CheckCircleFilled, ExclamationCircleOutlined, FrownOutlined, MehOutlined, SmileOutlined, PieChartOutlined, BarChartOutlined } from '@ant-design/icons';
import { getSurveys, getSurveyById, exportSurveysToExcel, SurveyExportConfig, SurveyResponse, SurveyUpdateRequest, updateSurvey } from '@/api/survey';
import { useRouter } from 'next/router';
import moment from 'moment';
import { Survey } from './survey';
import { Pie, Column } from '@ant-design/charts';

interface SurveyManagementProps {}

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export const SurveyManagement: React.FC<SurveyManagementProps> = () => {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalSurveys, setTotalSurveys] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  
  // Filters
  const [userSearch, setUserSearch] = useState<string>('');
  const [staffSearch, setStaffSearch] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[moment.Moment | null, moment.Moment | null] | null>(null);
  
  // Sorting
  const [sortBy, setSortBy] = useState<string>('surveyDate');
  const [sortOrder, setSortOrder] = useState<boolean>(false); // false = descending, true = ascending
  
  // Detail view
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  
  // Export config
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [exportConfig, setExportConfig] = useState<SurveyExportConfig>({
    exportAllPages: false,
    includeUser: true,
    includeStaff: true,
    includeAppointment: true,
    includeSurveyDate: true,
    includeRating: true,
    includeFeedback: true,
    includeStatus: true,
    includeCreatedAt: true,
    includeUpdatedAt: true,
  });
  
  const router = useRouter();

  // Status constants - cập nhật để phù hợp với API backend
  const SURVEY_STATUS = {
    PENDING: "Pending",
    SUBMITTED: "Submitted",
    UPDATED: "UpdatedAfterSubmission"
  };

  // Stats counters
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    updated: 0,
    highRating: 0, // rating >= 4
    lowRating: 0   // rating <= 2
  });

  // Mock data tạm thời để kiểm tra UI
  const mockSurveys: SurveyResponse[] = [
    {
      id: "12345678-1234-1234-1234-123456789101",
      user: {
        id: "user-1",
        fullName: "Nguyễn Văn A",
        email: "nguyenvana@example.com"
      },
      staff: {
        id: "staff-1",
        fullName: "Bác sĩ Trần Thị B",
        email: "tranthi@example.com"
      },
      surveyDate: "2023-11-01T10:00:00",
      rating: 5,
      feedback: "Dịch vụ rất tốt, bác sĩ rất tận tình",
      createdAt: "2023-11-01T12:00:00",
      status: "Completed"
    },
    {
      id: "12345678-1234-1234-1234-123456789102",
      user: {
        id: "user-2",
        fullName: "Lê Thị C",
        email: "lethic@example.com"
      },
      staff: {
        id: "staff-2",
        fullName: "Bác sĩ Nguyễn Văn D",
        email: "nguyenvand@example.com"
      },
      surveyDate: "2023-11-02T09:00:00",
      rating: 3,
      feedback: "Dịch vụ khá, nhưng phải đợi lâu",
      createdAt: "2023-11-02T11:00:00",
      status: "Completed"
    },
    {
      id: "12345678-1234-1234-1234-123456789103",
      user: {
        id: "user-3",
        fullName: "Phạm Văn E",
        email: "phamvane@example.com"
      },
      staff: {
        id: "staff-1",
        fullName: "Bác sĩ Trần Thị B",
        email: "tranthi@example.com"
      },
      surveyDate: "2023-11-03T14:00:00",
      rating: 2,
      feedback: "Chưa được như mong đợi",
      createdAt: "2023-11-03T16:00:00",
      status: "Pending"
    }
  ];

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        pageSize,
        userSearch,
        staffSearch,
        ratingFilter,
        sortBy,
        ascending: sortOrder,
        status: statusFilter,
        surveyStartDate: dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
        surveyEndDate: dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
      };
      
      console.log('Fetching surveys with params:', params);
      
      // Thử gọi API thực tế
      try {
      const response = await getSurveys(params);
        console.log('API Response:', response);
        
        if (response && response.isSuccess) {
          // Xử lý data từ API
          if (response.data) {
            // Trường hợp 1: response.data có cấu trúc {items, totalItems}
            if (response.data.items && Array.isArray(response.data.items)) {
              const surveyItems = response.data.items;
              console.log('Successfully loaded survey items (format 1):', surveyItems);
              setSurveys(surveyItems);
              setTotalSurveys(response.data.totalItems || surveyItems.length);
              
              // Tính toán thống kê
              const pendingCount = surveyItems.filter((s: SurveyResponse) => s.status === SURVEY_STATUS.PENDING).length;
              const submittedCount = surveyItems.filter((s: SurveyResponse) => s.status === SURVEY_STATUS.SUBMITTED).length;
              const updatedCount = surveyItems.filter((s: SurveyResponse) => s.status === SURVEY_STATUS.UPDATED).length;
              const highRatingCount = surveyItems.filter((s: SurveyResponse) => s.rating >= 4).length;
              const lowRatingCount = surveyItems.filter((s: SurveyResponse) => s.rating <= 2).length;
              
              setStats({
                total: response.data.totalItems || surveyItems.length,
                pending: pendingCount,
                submitted: submittedCount,
                updated: updatedCount,
                highRating: highRatingCount,
                lowRating: lowRatingCount
              });
            } 
            // Trường hợp 2: response.data là mảng
            else if (Array.isArray(response.data)) {
              const surveyItems = response.data;
              console.log('Successfully loaded survey items (format 2):', surveyItems);
              setSurveys(surveyItems);
              setTotalSurveys(surveyItems.length);
              
              // Tính toán thống kê
              const pendingCount = surveyItems.filter((s: SurveyResponse) => s.status === SURVEY_STATUS.PENDING).length;
              const submittedCount = surveyItems.filter((s: SurveyResponse) => s.status === SURVEY_STATUS.SUBMITTED).length;
              const updatedCount = surveyItems.filter((s: SurveyResponse) => s.status === SURVEY_STATUS.UPDATED).length;
              const highRatingCount = surveyItems.filter((s: SurveyResponse) => s.rating >= 4).length;
              const lowRatingCount = surveyItems.filter((s: SurveyResponse) => s.rating <= 2).length;
              
              setStats({
                total: surveyItems.length,
                pending: pendingCount,
                submitted: submittedCount,
                updated: updatedCount,
                highRating: highRatingCount,
                lowRating: lowRatingCount
              });
            }
            else {
              console.error('Unexpected data structure:', response.data);
              notification.error({
                message: 'Data Structure Error',
                description: 'The API returned data in an unexpected format',
              });
              useMockData();
            }
      } else {
            console.error('API response is missing data property');
        notification.error({
              message: 'Error',
              description: 'API response is missing data',
            });
            useMockData();
          }
        } else {
          console.warn('API call không thành công, sử dụng mock data');
          // Sử dụng mock data nếu API có vấn đề
          useMockData();
        }
      } catch (error) {
        console.error('Error fetching surveys from API, using mock data instead:', error);
        // Sử dụng mock data nếu API có lỗi
        useMockData();
      }
    } catch (error: any) {
      console.error('Error in fetchSurveys:', error);
      notification.error({
        message: 'Error',
        description: error.message || 'Could not load survey list',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, userSearch, staffSearch, ratingFilter, sortBy, sortOrder, statusFilter, dateRange]);

  // Hàm sử dụng dữ liệu mock
  const useMockData = () => {
    console.log('Using mock data:', mockSurveys);
    // Filter mock data dựa vào các bộ lọc hiện tại
    let filteredData = [...mockSurveys];
    
    if (userSearch) {
      filteredData = filteredData.filter(s => 
        s.user.fullName.toLowerCase().includes(userSearch.toLowerCase())
      );
    }
    
    if (staffSearch) {
      filteredData = filteredData.filter(s => 
        s.staff.fullName.toLowerCase().includes(staffSearch.toLowerCase())
      );
    }
    
    if (ratingFilter !== undefined) {
      filteredData = filteredData.filter(s => s.rating === ratingFilter);
    }
    
    if (statusFilter) {
      filteredData = filteredData.filter(s => s.status === statusFilter);
    }
    
    // Set data và stats
    setSurveys(filteredData);
    setTotalSurveys(filteredData.length);
    
    // Tính toán thống kê
    const pendingCount = filteredData.filter(s => s.status === SURVEY_STATUS.PENDING).length;
    const submittedCount = filteredData.filter(s => s.status === SURVEY_STATUS.SUBMITTED).length;
    const updatedCount = filteredData.filter(s => s.status === SURVEY_STATUS.UPDATED).length;
    const highRatingCount = filteredData.filter(s => s.rating >= 4).length;
    const lowRatingCount = filteredData.filter(s => s.rating <= 2).length;
    
    setStats({
      total: filteredData.length,
      pending: pendingCount,
      submitted: submittedCount,
      updated: updatedCount,
      highRating: highRatingCount,
      lowRating: lowRatingCount
    });
  };

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const handleViewDetail = (surveyId: string) => {
    setSelectedSurveyId(surveyId);
    setDetailModalVisible(true);
  };

  const handleEditInNewPage = (surveyId: string) => {
    router.push(`/survey/details/${surveyId}`);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const params = {
        page: exportConfig.exportAllPages ? undefined : currentPage,
        pageSize: exportConfig.exportAllPages ? undefined : pageSize,
        userSearch,
        staffSearch,
        ratingFilter,
        sortBy,
        ascending: sortOrder,
        status: statusFilter,
        surveyStartDate: dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
        surveyEndDate: dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
      };
      
      const response = await exportSurveysToExcel(exportConfig, params);
      if (response.isSuccess) {
        notification.success({
          message: 'Success',
          description: 'Excel export successful!',
        });
        window.open(response.data, '_blank');
      } else {
        notification.error({
          message: 'Error',
          description: 'Could not export to Excel',
        });
      }
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: error.message || 'Could not export to Excel',
      });
    } finally {
      setLoading(false);
      setExportModalVisible(false);
    }
  };

  const resetFilters = () => {
    setUserSearch('');
    setStaffSearch('');
    setRatingFilter(undefined);
    setStatusFilter(undefined);
    setDateRange(null);
    setCurrentPage(1);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case SURVEY_STATUS.PENDING: return 'orange';
      case SURVEY_STATUS.SUBMITTED: return 'green';
      case SURVEY_STATUS.UPDATED: return 'blue';
      default: return 'default';
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

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case SURVEY_STATUS.SUBMITTED: return <CheckCircleFilled style={{ color: '#52c41a' }} />;
      case SURVEY_STATUS.PENDING: return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case SURVEY_STATUS.UPDATED: return <CheckCircleFilled style={{ color: '#1890ff' }} />;
      default: return <ExclamationCircleOutlined style={{ color: '#1677ff' }} />;
    }
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

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === 'ascend');
    }
  };

  const renderRating = (rating: number) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        // Check if this star should be colored
        const isColored = star <= rating;
        const colorClass = isColored ? 
          (star === 1 ? 'text-red-500' : 
          star === 2 ? 'text-orange-500' : 
          star === 3 ? 'text-yellow-500' : 
          star === 4 ? 'text-blue-500' : 
          'text-green-500') : 'text-gray-400';
        
        // Display different icons based on value
        return (
          <span key={star} className="transition-transform hover:scale-110">
            {(star === 1 || star === 2) ? (
              <FrownOutlined className={colorClass} style={{ fontSize: 18 }} />
            ) : star === 3 ? (
              <MehOutlined className={colorClass} style={{ fontSize: 18 }} />
            ) : (
              <SmileOutlined className={colorClass} style={{ fontSize: 18 }} />
            )}
          </span>
        );
      })}
      <span className="ml-2 text-sm font-medium">{rating}/5</span>
    </div>
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      width: 100,
      render: (text: string) => <Tooltip title={text}><span className="font-mono text-xs text-gray-600">{text.substring(0, 8)}...</span></Tooltip>
    },
    {
      title: 'User',
      dataIndex: ['user', 'fullName'],
      key: 'user',
      sorter: true,
      render: (text: string, record: SurveyResponse) => (
        <div className="flex items-center">
          <Avatar icon={<UserOutlined />} className="mr-2 shadow-sm" />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Staff',
      dataIndex: ['staff', 'fullName'],
      key: 'staff',
      sorter: true,
      render: (text: string, record: SurveyResponse) => (
        <div className="flex items-center">
          <Avatar icon={<TeamOutlined />} className="mr-2 shadow-sm" style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.staff.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Survey Date',
      dataIndex: 'surveyDate',
      key: 'surveyDate',
      sorter: true,
      render: (text: string) => (
        <div className="flex items-center">
          <CalendarOutlined className="mr-2 text-blue-500" />
          <span className="font-medium">{moment(text).format('DD/MM/YYYY')}</span>
        </div>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      sorter: true,
      render: (rating: number) => renderRating(rating)
    },
    {
      title: 'Feedback',
      dataIndex: 'feedback',
      key: 'feedback',
      ellipsis: true,
      render: (text: string) => text ? (
        <Tooltip title={text}>
          <div className="flex items-start">
            <FileTextOutlined className="mr-2 text-gray-500 mt-1" />
            <span className="line-clamp-2 text-sm">{text.length > 30 ? `${text.substring(0, 30)}...` : text}</span>
          </div>
        </Tooltip>
      ) : (
        <span className="text-gray-400 text-sm italic">No feedback</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => (
        <Tag color={getStatusColor(text)} icon={getStatusIcon(text)} className="px-3 py-1 font-medium">
          {getStatusLabel(text)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_: any, record: SurveyResponse) => (
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
          size="middle"
            onClick={() => handleViewDetail(record.id)}
          className="hover:shadow-md transition-all duration-300 flex items-center"
        >
          View Details
          </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="shadow-md border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 -mx-6 -mt-6 px-6 py-8 mb-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
    <div>
              <Title level={2} style={{ color: 'white', margin: 0 }}>Survey Management</Title>
              <Paragraph className="text-blue-100 mt-2 text-base mb-0">
                Manage and analyze user feedback and ratings
              </Paragraph>
            </div>
            <div className="flex mt-4 md:mt-0 space-x-3">
            <Button 
              icon={<ExportOutlined />}
              onClick={() => setExportModalVisible(true)}
                className="flex items-center bg-white text-blue-700 border-blue-100 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-200 shadow-sm"
              >
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <Title level={4} className="mb-4 text-gray-700 flex items-center">
            <StarOutlined className="mr-2 text-indigo-500" /> Statistics
          </Title>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="shadow-sm bg-gradient-to-br from-gray-50 to-indigo-50 border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
              <Statistic 
                title={<span className="text-gray-600 font-medium">Total Surveys</span>} 
                value={stats.total} 
                prefix={<span className="text-indigo-600"><CalendarOutlined /></span>}
                valueStyle={{ color: '#4F46E5', fontWeight: 600 }}
              />
            </Card>
            
            <Card className="shadow-sm bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer">
              <Statistic 
                title={<span className="text-amber-700 font-medium">Pending</span>} 
                value={stats.pending} 
                prefix={<span className="text-amber-500"><ExclamationCircleOutlined /></span>}
                valueStyle={{ color: '#F59E0B', fontWeight: 600 }}
              />
            </Card>
            
            <Card className="shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:shadow-md hover:border-green-300 transition-all cursor-pointer">
              <Statistic 
                title={<span className="text-green-700 font-medium">Submitted</span>} 
                value={stats.submitted} 
                prefix={<span className="text-emerald-500"><CheckCircleFilled /></span>}
                valueStyle={{ color: '#10B981', fontWeight: 600 }}
              />
            </Card>
            
            <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
              <Statistic 
                title={<span className="text-blue-700 font-medium">Updated</span>} 
                value={stats.updated} 
                prefix={<span className="text-blue-500"><CheckCircleFilled /></span>}
                valueStyle={{ color: '#3B82F6', fontWeight: 600 }}
              />
            </Card>
            
            <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
              <Statistic 
                title={<span className="text-blue-700 font-medium">High Ratings</span>} 
                value={stats.highRating} 
                prefix={<span className="text-blue-500"><SmileOutlined /></span>}
                suffix={<span className="text-sm text-gray-500">≥ 4</span>}
                valueStyle={{ color: '#3B82F6', fontWeight: 600 }}
              />
            </Card>
            
            <Card className="shadow-sm bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 hover:shadow-md hover:border-red-300 transition-all cursor-pointer">
              <Statistic 
                title={<span className="text-red-700 font-medium">Low Ratings</span>} 
                value={stats.lowRating} 
                prefix={<span className="text-red-500"><FrownOutlined /></span>}
                suffix={<span className="text-sm text-gray-500">≤ 2</span>}
                valueStyle={{ color: '#EF4444', fontWeight: 600 }}
              />
            </Card>
          </div>
          
          {/* Charts for visualization */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rating Distribution Chart */}
            <Card 
              className="shadow-sm hover:shadow-md transition-all" 
              title={
                <div className="flex items-center">
                  <PieChartOutlined className="mr-2 text-blue-500" /> Rating Distribution
                </div>
              }
            >
              <div className="h-80 rating-pie-chart">
                <Pie
                  data={[
                    { type: '1 Star', value: surveys.filter((s: SurveyResponse) => s.rating === 1).length },
                    { type: '2 Stars', value: surveys.filter((s: SurveyResponse) => s.rating === 2).length },
                    { type: '3 Stars', value: surveys.filter((s: SurveyResponse) => s.rating === 3).length },
                    { type: '4 Stars', value: surveys.filter((s: SurveyResponse) => s.rating === 4).length },
                    { type: '5 Stars', value: surveys.filter((s: SurveyResponse) => s.rating === 5).length },
                  ]}
                  angleField="value"
                  colorField="type"
                  radius={0.8}
                  innerRadius={0.6}
                  label={false}
                  statistic={{
                    title: {
                      customHtml: () => 'Total',
                      style: {
                        fontSize: '16px',
                        lineHeight: 1.5,
                        color: 'rgba(0, 0, 0, 0.45)',
                      }
                    },
                    content: {
                      customHtml: () => {
                        const total = surveys.reduce((acc, cur) => acc + (cur.rating ? 1 : 0), 0);
                        return `${total}`;
                      },
                      style: {
                        fontSize: '24px',
                        lineHeight: 1.5,
                        color: 'rgba(0, 0, 0, 0.85)',
                      }
                    }
                  }}
                  legend={{
                    layout: 'horizontal',
                    position: 'bottom'
                  }}
                  animation={{
                    appear: {
                      animation: 'fade-in',
                      duration: 1500,
                    },
                  }}
                />
              </div>
            </Card>
            
            {/* Status Distribution Chart */}
            <Card 
              className="shadow-sm hover:shadow-md transition-all"
              title={
                <div className="flex items-center">
                  <BarChartOutlined className="mr-2 text-purple-500" /> Status Distribution
                </div>
              }
            >
              <div className="h-80 status-column-chart flex flex-col justify-center">
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-amber-500 mr-2"></div>
                      <span className="font-medium">Pending</span>
                    </div>
                    <Tooltip title={`${stats.pending || 0} surveys (${stats.total ? Math.round((stats.pending || 0) / stats.total * 100) : 0}%)`}>
                      <span className="font-semibold">{stats.pending || 0}</span>
                    </Tooltip>
                  </div>
                  <Tooltip title={`${stats.total ? Math.round((stats.pending || 0) / stats.total * 100) : 0}% of total surveys`}>
                    <Progress 
                      percent={stats.total ? Math.round((stats.pending || 0) / stats.total * 100) : 0} 
                      showInfo={false} 
                      strokeColor="#faad14" 
                      trailColor="#f5f5f5"
                      strokeWidth={12}
                      className="custom-progress"
                    />
                  </Tooltip>
                </div>
                
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                      <span className="font-medium">Submitted</span>
                    </div>
                    <Tooltip title={`${stats.submitted || 0} surveys (${stats.total ? Math.round((stats.submitted || 0) / stats.total * 100) : 0}%)`}>
                      <span className="font-semibold">{stats.submitted || 0}</span>
                    </Tooltip>
                  </div>
                  <Tooltip title={`${stats.total ? Math.round((stats.submitted || 0) / stats.total * 100) : 0}% of total surveys`}>
                    <Progress 
                      percent={stats.total ? Math.round((stats.submitted || 0) / stats.total * 100) : 0} 
                      showInfo={false} 
                      strokeColor="#52c41a" 
                      trailColor="#f5f5f5"
                      strokeWidth={12}
                      className="custom-progress"
                    />
                  </Tooltip>
        </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                      <span className="font-medium">Updated</span>
                    </div>
                    <Tooltip title={`${stats.updated || 0} surveys (${stats.total ? Math.round((stats.updated || 0) / stats.total * 100) : 0}%)`}>
                      <span className="font-semibold">{stats.updated || 0}</span>
                    </Tooltip>
                  </div>
                  <Tooltip title={`${stats.total ? Math.round((stats.updated || 0) / stats.total * 100) : 0}% of total surveys`}>
                    <Progress 
                      percent={stats.total ? Math.round((stats.updated || 0) / stats.total * 100) : 0} 
                      showInfo={false} 
                      strokeColor="#1890ff" 
                      trailColor="#f5f5f5"
                      strokeWidth={12}
                      className="custom-progress"
                    />
                  </Tooltip>
                </div>
                
                <div className="mt-4 pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Total Surveys</span>
                    <span className="text-2xl font-bold text-indigo-700">{stats.total || 0}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 mt-2 rounded-full overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-amber-500 via-green-500 to-blue-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>
      
      {/* Search & Filters */}
      <Card className="shadow-md border-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-indigo-100/20 rounded-bl-full -z-10"></div>
        <Tabs defaultActiveKey="1" className="survey-management-tabs">
          <TabPane tab={<span className="text-base px-1"><FilterOutlined className="mr-2" />Filters & Search</span>} key="1">
            <div className="space-y-4">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12} lg={6}>
            <Input 
                    placeholder="Search by user name" 
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
                    prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
                    className="w-full hover:border-blue-400 focus:border-blue-500 transition-colors"
            />
          </Col>
                <Col xs={24} md={12} lg={6}>
            <Input 
                    placeholder="Search by staff name" 
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
                    prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
                    className="w-full hover:border-blue-400 focus:border-blue-500 transition-colors"
            />
          </Col>
                <Col xs={24} md={12} lg={6}>
            <Select
                    placeholder="Filter by rating"
              value={ratingFilter}
              onChange={(value) => setRatingFilter(value)}
                    className="w-full hover:border-blue-400"
              allowClear
                    dropdownClassName="survey-rating-dropdown"
                  >
                    <Option value={5}>5 stars ⭐⭐⭐⭐⭐</Option>
                    <Option value={4}>4 stars ⭐⭐⭐⭐</Option>
                    <Option value={3}>3 stars ⭐⭐⭐</Option>
                    <Option value={2}>2 stars ⭐⭐</Option>
                    <Option value={1}>1 star ⭐</Option>
            </Select>
          </Col>
                <Col xs={24} md={12} lg={6}>
            <Select
                    placeholder="Filter by status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
                    className="w-full hover:border-blue-400"
              allowClear
            >
                    <Option value={SURVEY_STATUS.PENDING}>Pending</Option>
                    <Option value={SURVEY_STATUS.SUBMITTED}>Submitted</Option>
                    <Option value={SURVEY_STATUS.UPDATED}>Updated</Option>
            </Select>
          </Col>
        </Row>

              <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <RangePicker 
                    placeholder={['Start date', 'End date']}
              value={dateRange as any}
              onChange={(dates) => setDateRange(dates as [moment.Moment | null, moment.Moment | null])}
                    className="w-full hover:border-blue-400"
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
                    placeholder="Sort by"
              value={sortBy}
              onChange={(value) => setSortBy(value)}
                    className="w-full hover:border-blue-400"
                  >
                    <Option value="surveyDate">Survey Date</Option>
                    <Option value="rating">Rating</Option>
                    <Option value="createdAt">Created Date</Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Select
                    placeholder="Sort order"
              value={sortOrder}
              onChange={(value) => setSortOrder(value)}
                    className="w-full hover:border-blue-400"
            >
                    <Option value={true}>Ascending</Option>
                    <Option value={false}>Descending</Option>
            </Select>
          </Col>
        </Row>
              
              <Flex justify="end">
                <Button 
                  icon={<FilterOutlined />} 
                  onClick={resetFilters}
                  className="flex items-center hover:text-blue-700 hover:border-blue-300"
                >
                  Clear Filters
                </Button>
              </Flex>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Data Table */}
      <Card className="shadow-md border-0">
        <div className="rounded-md overflow-hidden">
        <Table
          columns={columns}
          dataSource={surveys}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalSurveys,
            showSizeChanger: true,
            showQuickJumper: true,
              showTotal: (total) => `Total ${total} records`,
          }}
          onChange={handleTableChange}
            className="survey-table" 
            rowClassName={(record, index) => 
              index % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'
            }
            scroll={{ x: 'max-content' }}
        />
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <FileTextOutlined className="text-blue-500 mr-2" />
            <span className="text-lg font-semibold">Survey Details</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailModalVisible(false)} size="large" className="px-5 h-10">
            Close
          </Button>
        ]}
        width={900}
        className="survey-detail-modal"
        centered
        destroyOnClose
        maskClosable
        bodyStyle={{ padding: '0', overflow: 'hidden', borderRadius: '0 0 8px 8px' }}
        style={{ top: 20 }}
      >
        {selectedSurveyId ? (
          <div className="survey-view-only">
            <Survey id={selectedSurveyId} readOnly={true} onSuccess={fetchSurveys} />
          </div>
        ) : (
          <div className="flex justify-center py-16">
            <Spin size="large" tip="Loading..." />
          </div>
        )}
      </Modal>

      {/* Export Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <ExportOutlined className="text-green-500 mr-2" />
            <span>Export Configuration</span>
          </div>
        }
        open={exportModalVisible}
        onOk={handleExport}
        onCancel={() => setExportModalVisible(false)}
        confirmLoading={loading}
      >
        <div className="mb-4">
          <Text strong>Select data to export:</Text>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <Radio.Group
              value={exportConfig.exportAllPages}
              onChange={(e) => setExportConfig({...exportConfig, exportAllPages: e.target.value})}
            className="w-full"
          >
            <Space direction="vertical" className="w-full">
              <Radio value={false}>Export current page only</Radio>
              <Radio value={true}>Export all data</Radio>
            </Space>
            </Radio.Group>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Checkbox
              checked={exportConfig.includeUser}
              onChange={(e) => setExportConfig({...exportConfig, includeUser: e.target.checked})}
            >
            User information
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeStaff}
              onChange={(e) => setExportConfig({...exportConfig, includeStaff: e.target.checked})}
            >
            Staff information
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeAppointment}
              onChange={(e) => setExportConfig({...exportConfig, includeAppointment: e.target.checked})}
            >
            Appointment information
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeSurveyDate}
              onChange={(e) => setExportConfig({...exportConfig, includeSurveyDate: e.target.checked})}
            >
            Survey date
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeRating}
              onChange={(e) => setExportConfig({...exportConfig, includeRating: e.target.checked})}
            >
            Rating
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeFeedback}
              onChange={(e) => setExportConfig({...exportConfig, includeFeedback: e.target.checked})}
            >
            Feedback
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeStatus}
              onChange={(e) => setExportConfig({...exportConfig, includeStatus: e.target.checked})}
            >
            Status
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeCreatedAt}
              onChange={(e) => setExportConfig({...exportConfig, includeCreatedAt: e.target.checked})}
            >
            Created date
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeUpdatedAt}
              onChange={(e) => setExportConfig({...exportConfig, includeUpdatedAt: e.target.checked})}
            >
            Updated date
            </Checkbox>
        </div>
      </Modal>

      {/* Add global styles for table */}
      <style jsx global>{`
        .survey-table .ant-table-thead > tr > th {
          background-color: #f0f5ff;
          color: #1e3a8a;
          font-weight: 600;
        }
        
        .survey-table .ant-pagination-item-active {
          border-color: #3b82f6;
        }
        
        .survey-table .ant-pagination-item-active a {
          color: #3b82f6;
        }
        
        .survey-management-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #3b82f6;
          font-weight: 500;
        }
        
        .survey-management-tabs .ant-tabs-ink-bar {
          background-color: #3b82f6;
        }
        
        .survey-rating-dropdown .ant-select-item-option-selected {
          background-color: #f0f5ff;
        }

        /* Custom Progress Bar Styles */
        .custom-progress .ant-progress-bg {
          transition: all 1s ease-in-out;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .custom-progress:hover .ant-progress-bg {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          filter: brightness(1.05);
        }
      `}</style>
    </div>
  );
};
