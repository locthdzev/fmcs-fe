import React, { useState, useEffect, useCallback, useRef } from "react";
import { GetServerSideProps } from "next";
import {
  AvailableOfficersResponseDTO,
  getAllHealthcareStaff,
  ResultDTO,
  setupHealthcareStaffRealTime,
  getAppointmentStatistics,
  AppointmentStatisticsDTO,
} from "@/api/appointment-api";
import Link from "next/link";
import { Typography, Spin, message, Card } from "antd";
import Cookies from "js-cookie";
import moment from "moment";

const { Title, Text } = Typography;

interface AppointmentIndexPageProps {
  initialStaffList: AvailableOfficersResponseDTO[];
  token: string | null;
}

const AppointmentIndexPage: React.FC<AppointmentIndexPageProps> = ({
  initialStaffList,
  token,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [staffList, setStaffList] =
    useState<AvailableOfficersResponseDTO[]>(initialStaffList);
  const [statistics, setStatistics] = useState<AppointmentStatisticsDTO | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  // Use the current date instead of a fixed reference date
  const currentDate = moment();

  const connectionRef = useRef<(() => void) | null>(null);

  const fetchStaffList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllHealthcareStaff();
      setStaffList(response.data || []);
    } catch (error) {
      messageApi.error("Unable to load healthcare staff list.");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    const token = Cookies.get("token");
    if (!token) {
      messageApi.error("No token found. Please log in.");
      setLoading(false);
      return;
    }
    try {
      const result = await getAppointmentStatistics(token);
      setStatistics(result.data);
    } catch (error: any) {
      messageApi.error(error.message || "Unable to load appointment statistics.");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchStaffList(); // Initial fetch
    fetchStatistics();

    console.log("Setting up SignalR...");
    const cleanupSignalR = setupHealthcareStaffRealTime(
      (updatedStaffList: AvailableOfficersResponseDTO[]) => {
        console.log("Received real-time update:", updatedStaffList);
        setStaffList((prevList) => {
          // Only update if the new list is valid; otherwise, keep previous state
          if (updatedStaffList && updatedStaffList.length > 0) {
            return updatedStaffList;
          }
          console.warn(
            "Ignoring invalid SignalR update, retaining previous list"
          );
          return prevList;
        });
      }
    );
    connectionRef.current = cleanupSignalR;

    return () => {
      console.log("Component unmounting, stopping SignalR...");
      if (connectionRef.current) {
        connectionRef.current();
      }
    };
  }, [fetchStaffList, fetchStatistics]);

  if (!token) {
    return null; // Redirect handled in getServerSideProps
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {contextHolder}
      <style jsx global>{`
        .stats-card {
          transition: all 0.3s ease;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          background: white;
        }
        
        .stats-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        
        .stats-number {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.2;
          background: linear-gradient(135deg, #3551a5, #5073e5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .stats-label {
          font-size: 1rem;
          font-weight: 500;
          color: #6b7280;
        }
        
        .staff-card {
          transition: all 0.3s ease;
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .staff-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
        }
        
        .staff-image-container {
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 16px;
          margin-bottom: 12px;
        }
        
        .staff-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .staff-name {
          font-weight: 600;
          font-size: 1.1rem;
          line-height: 1.5;
          margin-bottom: 4px;
        }
        
        .staff-position {
          font-size: 0.9rem;
          color: #6b7280;
          margin-bottom: 8px;
        }
        
        .staff-info {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .availability-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          background-color: #ecfdf5;
          color: #065f46;
          margin-top: auto;
        }
        
        .availability-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #10b981;
        }
        
        .page-title {
          background: linear-gradient(135deg, #2c3e76, #3a57b9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .page-subtitle {
          color: #6b7280;
          font-weight: 400;
          margin-bottom: 24px;
        }
        
        @media (max-width: 768px) {
          .stats-number {
            font-size: 2rem;
          }
          .stats-label {
            font-size: 0.9rem;
          }
          .staff-image-container {
            height: 180px;
          }
        }
      `}</style>
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl page-title">Campus Health Services</h1>
          <p className="page-subtitle">Schedule an appointment with our healthcare professionals</p>
        </div>
        
        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="stats-card p-6">
            <div className="stats-number">{statistics ? statistics.totalHealthcareOfficers : "-"}</div>
            <div className="stats-label">Healthcare Officers</div>
          </div>
          <div className="stats-card p-6">
            <div className="stats-number">{statistics ? statistics.studentsCurrentlyReceivingCare : "-"}</div>
            <div className="stats-label">Students In Care</div>
          </div>
          <div className="stats-card p-6">
            <div className="stats-number">{statistics ? statistics.appointmentsScheduledToday : "-"}</div>
            <div className="stats-label">Today's Appointments</div>
          </div>
        </div>
        
        {/* Healthcare Staff Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Available Healthcare Professionals</h2>
            <Text type="secondary">{currentDate.format('dddd, MMMM D, YYYY')}</Text>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <Spin size="large" tip="Loading healthcare staff..." />
            </div>
          ) : staffList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {staffList.map((staff, index) => {
                const colors = [
                  {
                    bg: "bg-blue-100",
                    text: "text-blue-700",
                    border: "border-blue-200",
                  },
                  {
                    bg: "bg-yellow-100",
                    text: "text-yellow-700",
                    border: "border-yellow-200",
                  },
                  {
                    bg: "bg-green-100",
                    text: "text-green-700",
                    border: "border-green-200",
                  },
                  {
                    bg: "bg-purple-100",
                    text: "text-purple-700",
                    border: "border-purple-200",
                  },
                  { 
                    bg: "bg-red-100", 
                    text: "text-red-700", 
                    border: "border-red-200" 
                  },
                  {
                    bg: "bg-cyan-100",
                    text: "text-cyan-700",
                    border: "border-cyan-200",
                  },
                ];
                const color = colors[index % colors.length];

                return (
                  <Link key={staff.staffId} href={`/schedule-appointment/${staff.staffId}`} className="block h-full">
                    <div className={`rounded-2xl shadow-md p-5 ${color.bg} staff-card ${color.border} border`}>
                      <div className="staff-image-container bg-gray-100">
                        <img
                          src={staff.imageURL || "/images/placeholder.jpg"}
                          alt={`${staff.fullName}`}
                          className="staff-image"
                        />
                      </div>
                      
                      <div className="staff-info text-center">
                        <h3 className={`staff-name ${color.text}`}>{staff.fullName}</h3>
                        <p className="staff-position">General Physician</p>
                        <div className="availability-badge">
                          <span className="availability-dot"></span>
                          <span>Available</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="shadow-md rounded-xl p-8 text-center">
              <Text type="secondary" className="text-lg">No healthcare staff available at this time.</Text>
              <p className="mt-2">Please check back later or contact the health center directly.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const token = req.cookies.token || null;

  if (!token) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  try {
    const response = await getAllHealthcareStaffWithToken(token);
    const staffList = response.data || [];

    return {
      props: {
        initialStaffList: staffList,
        token,
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
};

const getAllHealthcareStaffWithToken = async (
  token: string
): Promise<ResultDTO<AvailableOfficersResponseDTO[]>> => {
  const axios = (await import("axios")).default;
  const https = (await import("https")).default;

  const response = await axios.get(
    "http://localhost:5104/api/appointment-management/healthcare-staff",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    }
  );

  if (!response.data.isSuccess) {
    throw new Error(
      response.data.message || "Failed to fetch healthcare staff"
    );
  }
  return response.data;
};

export default AppointmentIndexPage;
