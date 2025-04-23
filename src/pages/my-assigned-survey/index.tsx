import React, { useContext, useEffect } from "react";
import { SurveyList } from "@/components/survey/staff-survey";
import PageContainer from "@/components/shared/PageContainer";
import { StarOutlined } from "@ant-design/icons";

export default function StaffSurveyPage() {
  return (
    <PageContainer title="My Assigned Surveys" icon={<StarOutlined />}>
      <SurveyList />
    </PageContainer>
  );
}
