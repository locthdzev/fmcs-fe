import React, { useContext, useEffect } from "react";
import { SurveyList } from "@/components/survey/my-survey";
import PageContainer from "@/components/shared/PageContainer";
import { FormOutlined } from "@ant-design/icons";

export default function UserSurveyPage() {
  return (
    <PageContainer title="My Submitted Surveys" icon={<FormOutlined />}>
      <SurveyList />
    </PageContainer>
  );
}
