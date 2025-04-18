import React, { useContext, useEffect, useState } from "react";
import PageContainer from "@/components/shared/PageContainer";
import { useRouter } from "next/router";
import { getSurveyById, SurveyResponse } from "@/api/survey";
import { Survey } from "@/components/survey/my-survey";
import { Spin, Result, Button, Typography, notification } from "antd";
import { ArrowLeftOutlined, LoadingOutlined } from "@ant-design/icons";
import { UserContext } from "@/context/UserContext";

const { Title, Text } = Typography;

export default function UserSubmittedSurveyDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<SurveyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userContext = useContext(UserContext);

  useEffect(() => {
    if (id && typeof id === 'string') {
      handleSurveyDetails();
    }
  }, [id]);

  const handleBackClick = () => {
    router.push("/my-submitted-survey");
  };

  const handleSurveyDetails = async () => {
    if (!id || typeof id !== 'string') {
      setError("Invalid survey ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getSurveyById(id);

      if (response.isSuccess && response.data) {
        setSurvey(response.data);
      } else {
        setError("Survey not found");
        notification.error({
          message: "Error",
          description: "Invalid survey ID",
          duration: 5
        });
      }
    } catch (error: any) {
      console.error("Error fetching survey details:", error);
      setError(error.message || "Failed to fetch survey details. Please try again.");
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch survey details",
        duration: 5
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is the survey owner
  const isCurrentUserSurveyOwner = survey && userContext?.user?.userId === survey.user.id;
  // Allow editing if it's the user's own survey
  const isReadOnly = !isCurrentUserSurveyOwner;

  const backButton = (
    <Button
      icon={<ArrowLeftOutlined />}
      onClick={handleBackClick}
    >
      Back to My Surveys
    </Button>
  );

  return (
    <PageContainer
      title="My Survey Details"
      onBack={handleBackClick}
      rightContent={backButton}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
          <p className="ml-2 mt-4">Loading survey data...</p>
        </div>
      ) : error ? (
        <Result
          status="404"
          title="Survey Not Found"
          subTitle={error || "Invalid or non-existent survey ID."}
          extra={
            <Button type="primary" onClick={handleBackClick}>
              Back to My Surveys
            </Button>
          }
        />
      ) : survey ? (
        <Survey id={id as string} readOnly={isReadOnly} onSuccess={handleBackClick} />
      ) : (
        <Result
          status="warning"
          title="No Data"
          subTitle="Could not load survey data"
          extra={
            <Button type="primary" onClick={handleBackClick}>
              Back to My Surveys
            </Button>
          }
        />
      )}
    </PageContainer>
  );
} 