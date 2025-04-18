import React, { useContext, useEffect } from "react";
import { SurveyList } from "@/components/survey/staff-survey";
import { UserContext } from "@/context/UserContext";
import { useRouter } from "next/router";
import { Spin, Typography, Alert } from "antd";

const { Title } = Typography;

export default function StaffSurveyPage() {
  const userContext = useContext(UserContext);
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    if (!userContext?.user || !userContext.user.auth) {
      router.push("/auth/login");
      return;
    }

    // Redirect regular users to their own page
    if (!userContext.user.role.includes("Healthcare Staff")) {
      router.push("/survey/MySurvey");
    }
  }, [userContext, router]);

  if (!userContext?.user || !userContext.user.auth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Check if user has the correct role
  if (!userContext.user.role.includes("Healthcare Staff")) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert
          message="Redirecting..."
          description="This page is for healthcare staff only. Redirecting to user surveys page."
          type="info"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <SurveyList />
    </div>
  );
}
