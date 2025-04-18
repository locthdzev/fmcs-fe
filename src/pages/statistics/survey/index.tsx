import React, { useState, useEffect } from "react";
import { SurveyStatistics } from "@/components/statitics/SurveyStatistics";
import { getSurveys, SurveyResponse } from "@/api/survey";
import { notification } from "antd";

export default function SurveyStatisticsPage() {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  const SURVEY_STATUS = {
    PENDING: "Pending",
    SUBMITTED: "Submitted",
    UPDATED: "UpdatedAfterSubmission"
  };
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    updated: 0,
    highRating: 0,
    lowRating: 0
  });

  useEffect(() => {
    const fetchSurveys = async () => {
      setLoading(true);
      try {
        const response = await getSurveys({});
        
        let surveyData: SurveyResponse[] = [];
        if (response?.isSuccess && response?.data) {
          if (Array.isArray(response.data)) {
            surveyData = response.data;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            surveyData = response.data.items;
          }
          
          setSurveys(surveyData);
          
          // Calculate stats
          const pendingCount = surveyData.filter((s: SurveyResponse) => s.status === SURVEY_STATUS.PENDING).length;
          const submittedCount = surveyData.filter((s: SurveyResponse) => s.status === SURVEY_STATUS.SUBMITTED).length;
          const updatedCount = surveyData.filter((s: SurveyResponse) => s.status === SURVEY_STATUS.UPDATED).length;
          const highRatingCount = surveyData.filter((s: SurveyResponse) => s.rating >= 4).length;
          const lowRatingCount = surveyData.filter((s: SurveyResponse) => s.rating <= 2).length;
          
          setStats({
            total: surveyData.length,
            pending: pendingCount,
            submitted: submittedCount,
            updated: updatedCount,
            highRating: highRatingCount,
            lowRating: lowRatingCount
          });
        } else {
          notification.error({
            message: "Error",
            description: "Failed to load survey data"
          });
        }
      } catch (error) {
        console.error("Error fetching surveys:", error);
        notification.error({
          message: "Error",
          description: "Failed to load survey data"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSurveys();
  }, []);

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">Loading survey statistics...</div>
        </div>
      ) : (
        <SurveyStatistics 
          surveys={surveys} 
          stats={stats} 
          SURVEY_STATUS={SURVEY_STATUS} 
        />
      )}
    </>
  );
}
