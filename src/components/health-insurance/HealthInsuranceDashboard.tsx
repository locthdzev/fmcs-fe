import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { Statistic, Row, Col } from "antd";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { getAllHealthInsurances } from "@/api/health-insurance-api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const HealthInsuranceDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    getAllHealthInsurances(1, 1000).then((result) => {
      const data = result.data;
      const statusCount = data.reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      setStats({
        total: data.length,
        pending: statusCount.Pending || 0,
        completed: statusCount.Completed || 0,
        rejected: statusCount.Rejected || 0,
        statusData: Object.entries(statusCount).map(([name, value]) => ({ name, value })),
      });
    });
  }, []);

  return (
    <Card className="m-4">
      <CardHeader>
        <h3 className="text-2xl font-bold">Health Insurance Dashboard</h3>
      </CardHeader>
      <CardBody>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="Total Insurances" value={stats.total || 0} />
          </Col>
          <Col span={6}>
            <Statistic title="Pending" value={stats.pending || 0} />
          </Col>
          <Col span={6}>
            <Statistic title="Completed" value={stats.completed || 0} />
          </Col>
          <Col span={6}>
            <Statistic title="Rejected" value={stats.rejected || 0} />
          </Col>
        </Row>
        <div style={{ marginTop: 24 }}>
          <h4>Status Distribution</h4>
          <PieChart width={400} height={300}>
            <Pie
              data={stats.statusData || []}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {stats.statusData?.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </CardBody>
    </Card>
  );
};

export default HealthInsuranceDashboard;