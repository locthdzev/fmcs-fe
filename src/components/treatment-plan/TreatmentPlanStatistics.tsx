import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Spin
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { getTreatmentPlanStatistics } from "@/api/treatment-plan";

const { TabPane } = Tabs;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export function TreatmentPlanStatistics() {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await getTreatmentPlanStatistics();
      if (response && response.isSuccess && response.data) {
        // Map the response to match the expected format
        const formattedData = {
          totalTreatmentPlans: response.data.totalCount || 0,
          totalActiveTreatmentPlans: response.data.statusDistribution?.InProgress || 0,
          totalCompletedTreatmentPlans: response.data.statusDistribution?.Completed || 0,
          totalCancelledTreatmentPlans: response.data.statusDistribution?.Cancelled || 0,
          treatmentPlansByStatus: response.data.statusDistribution || {},
          treatmentPlansByMonth: response.data.monthlyDistribution || {},
          treatmentPlansByDrug: response.data.top5Drugs || {},
          treatmentPlansByUser: response.data.top5Staff || {},
          averageDuration: response.data.averageDuration,
          completionRate: response.data.completionRate,
          cancellationRate: response.data.cancellationRate,
          averageTreatmentPlansPerPatient: response.data.averageTreatmentPlansPerPatient,
          patientDistribution: response.data.patientDistribution || {}
        };
        setStatistics(formattedData);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!statistics) return null;

  // Xử lý dữ liệu cho biểu đồ trạng thái
  const statusChartData = Object.entries(
    statistics.treatmentPlansByStatus || {}
  ).map(([status, count]) => ({
    name: status,
    value: count as number,
  }));

  // Xử lý dữ liệu cho biểu đồ hàng tháng
  const monthlyChartData = Object.entries(
    statistics.treatmentPlansByMonth || {}
  ).map(([month, count]) => ({
    name: month,
    count: count as number,
  }));

  // Xử lý dữ liệu cho biểu đồ thuốc hàng đầu
  const drugChartData = Object.entries(
    statistics.treatmentPlansByDrug || {}
  ).map(([drug, count]) => ({
    name: drug,
    count: count as number,
  }));

  // Xử lý dữ liệu cho biểu đồ người dùng hàng đầu
  const userChartData = Object.entries(
    statistics.treatmentPlansByUser || {}
  ).map(([user, count]) => ({
    name: user,
    count: count as number,
  }));

  return (
    <>
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Treatment Plans"
              value={statistics.totalTreatmentPlans}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Treatment Plans"
              value={statistics.totalActiveTreatmentPlans}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed Treatment Plans"
              value={statistics.totalCompletedTreatmentPlans}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Cancelled Treatment Plans"
              value={statistics.totalCancelledTreatmentPlans}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Duration (days)"
              value={statistics.averageDuration?.toFixed(2) || 0}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completion Rate (%)"
              value={statistics.completionRate?.toFixed(2) || 0}
              precision={2}
              valueStyle={{ color: "#1677ff" }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Cancellation Rate (%)"
              value={statistics.cancellationRate?.toFixed(2) || 0}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Avg Plans Per Patient"
              value={statistics.averageTreatmentPlansPerPatient?.toFixed(2) || 0}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <Tabs defaultActiveKey="1">
          <TabPane tab="Status Distribution" key="1">
            <Row>
              <Col span={12}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value, name) => [
                        `${value} plans`,
                        `Status: ${name}`,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Col>
              <Col span={12}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={statusChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value) => [`${value} plans`]}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      fill="#8884d8"
                      name="Number of Plans"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Col>
            </Row>
          </TabPane>
          <TabPane tab="Monthly Distribution" key="2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={monthlyChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  name="Number of Plans"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabPane>
          <TabPane tab="Top Drugs" key="3">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={drugChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Number of Plans" />
              </BarChart>
            </ResponsiveContainer>
          </TabPane>
          <TabPane tab="Top Staff" key="4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={userChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Bar dataKey="count" fill="#ffc658" name="Number of Plans" />
              </BarChart>
            </ResponsiveContainer>
          </TabPane>
        </Tabs>
      </Card>
    </>
  );
} 