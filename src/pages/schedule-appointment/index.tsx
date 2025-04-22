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
import { Typography, Spin, message } from "antd";
import Cookies from "js-cookie";

const { Title } = Typography;

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
    <div style={{ padding: "24px", width: "100%" }}>
      {contextHolder}
      <div className="flex flex-wrap w-full justify-center">
        {/* Healthcare Staff Section */}
        <div className="w-full rounded-3xl bg-white p-6 shadow-xl" style={{ maxWidth: "1200px" }}>
          <div className="mb-8 flex items-center justify-between text-black">
            <Title level={2} style={{ margin: 0 }}>
              Campus Health Officers
            </Title>
            <p>{new Date().toLocaleDateString("en-US")}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between pb-8">
            <div className="flex flex-wrap text-black">
              <div className="pr-10">
                <div className="text-2xl font-bold">
                  {statistics
                    ? statistics.totalHealthcareOfficers
                    : "Loading..."}
                </div>
                <div>Total Healthcare Officers</div>
              </div>
              <div className="pr-10">
                <div className="text-2xl font-bold">
                  {statistics
                    ? statistics.studentsCurrentlyReceivingCare
                    : "Loading..."}
                </div>
                <div>Students Currently Receiving Care</div>
              </div>
              <div className="pr-10">
                <div className="text-2xl font-bold">
                  {statistics
                    ? statistics.appointmentsScheduledToday
                    : "Loading..."}
                </div>
                <div>Appointments Scheduled Today</div>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "50px 0" }}>
              <Spin tip="Loading staff..." />
            </div>
          ) : staffList.length > 0 ? (
            <div className="flex flex-wrap justify-center">
              {staffList.map((staff, index) => {
                const colors = [
                  {
                    bg: "bg-blue-100",
                    text: "text-blue-700",
                    bar: "bg-blue-700",
                  },
                  {
                    bg: "bg-yellow-100",
                    text: "text-yellow-700",
                    bar: "bg-yellow-700",
                  },
                  {
                    bg: "bg-green-100",
                    text: "text-green-700",
                    bar: "bg-green-700",
                  },
                  {
                    bg: "bg-purple-100",
                    text: "text-purple-700",
                    bar: "bg-purple-700",
                  },
                  { bg: "bg-red-100", text: "text-red-700", bar: "bg-red-700" },
                  {
                    bg: "bg-cyan-100",
                    text: "text-cyan-700",
                    bar: "bg-cyan-700",
                  },
                ];
                const color = colors[index % colors.length];

                return (
                  <div key={staff.staffId} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-3">
                    <Link href={`/schedule-appointment/${staff.staffId}`}>
                      <div
                        className={`rounded-3xl p-3 ${color.bg} cursor-pointer hover:shadow-lg transition-shadow flex flex-col items-center`}
                        style={{ minHeight: "240px" }}
                      >
                        <div className="w-36 h-36 flex items-center justify-center bg-gray-100 rounded-2xl overflow-hidden">
                          <img
                            src={
                              staff.imageURL ||
                              "https://images.unsplash.com/photo-1570295999919-56cebcd28b2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
                            }
                            alt={`${staff.fullName}'s image`}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        </div>

                        <div className="mt-3 flex items-center">
                          <span className="h-3 w-3 bg-green-500 rounded-full mr-1"></span>
                          <span className="text-xs font-medium text-green-600">
                            Available
                          </span>
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-base font-bold">
                            {staff.fullName}
                          </p>
                          <p className="mt-1 text-sm opacity-70">
                            General Physician
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No healthcare staff available at this time.</p>
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
