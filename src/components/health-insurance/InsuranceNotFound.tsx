import React from "react";
import { Typography } from "antd";
import PageContainer from "@/components/shared/PageContainer";

const { Text } = Typography;

interface InsuranceNotFoundProps {
  title: string;
  message: string;
}

const InsuranceNotFound: React.FC<InsuranceNotFoundProps> = ({ title, message }) => {
  return (
    <PageContainer title={title}>
      <div className="text-center py-8">
        <Text type="secondary">{message}</Text>
      </div>
    </PageContainer>
  );
};

export default InsuranceNotFound; 