import React from "react";
import { TreatmentPlanStatistics } from "@/components/statitics/TreatmentPlanStatistics";
import { Card, Typography } from "antd";

const { Title } = Typography;

export default function TreatmentPlanStatisticsPage() {
  return (
    <div className="p-6">
      <Card className="mb-6">
        <Title level={2}>Treatment Plan Statistics</Title>
        <p className="text-gray-600 mb-4">
          View detailed statistics about treatment plans including status
          distribution, monthly trends, top drugs and staff.
        </p>
      </Card>

      <TreatmentPlanStatistics />
    </div>
  );
}
