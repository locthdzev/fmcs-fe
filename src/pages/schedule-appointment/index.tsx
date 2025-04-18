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
import { Typography, Spin } from "antd";
import { toast } from "react-toastify";
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
  const [staffList, setStaffList] =
    useState<AvailableOfficersResponseDTO[]>(initialStaffList);
  const [statistics, setStatistics] = useState<AppointmentStatisticsDTO | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const connectionRef = useRef<(() => void) | null>(null);

  const [healthNotifications] = useState<any[]>([
    {
      id: 1,
      title: "Nurse Sarah",
      date: "Dec, 12",
      message:
        "New health screening schedule has been posted for this month. Please check and confirm. 🏥",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2550&q=80",
    },
    {
      id: 2,
      title: "Canteen Manager",
      date: "Dec, 12",
      message:
        "Weekly food safety inspection completed. All standards met successfully.",
      image:
        "https://images.unsplash.com/photo-1600486913747-55e5470d6f40?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2550&q=80",
    },
    {
      id: 3,
      title: "Dr. Johnson",
      date: "Dec, 12",
      message:
        "Reminder: Vaccination campaign starts next week. Please prepare necessary arrangements.",
      image:
        "https://images.unsplash.com/photo-1543965170-4c01a586684e?ixid=MXwxMjA3fDB8MHxzZWFyY2h8NDZ8fG1hbnxlbnwwfDB8MHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=60",
    },
    {
      id: 4,
      title: "Nutritionist Lisa",
      date: "Dec, 12",
      message:
        "New healthy menu options added for next month. Student feedback has been positive.",
      image:
        "https://images.unsplash.com/photo-1533993192821-2cce3a8267d1?ixid=MXwxMjA3fDB8MHxzZWFyY2h8MTl8fHdvbWFuJTIwbW9kZXJufGVufDB8fDB8&ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=60",
    },
  ]);

  const fetchStaffList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllHealthcareStaff();
      setStaffList(response.data || []);
    } catch (error) {
      toast.error("Unable to load healthcare staff list.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    const token = Cookies.get("token");
    if (!token) {
      toast.error("No token found. Please log in.");
      setLoading(false);
      return;
    }
    try {
      const result = await getAppointmentStatistics(token);
      setStatistics(result.data);
    } catch (error: any) {
      toast.error(error.message || "Unable to load appointment statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      <div className="flex flex-wrap w-full">
        {/* Left Column for Healthcare Staff */}
        <div className="w-full rounded-3xl bg-white p-6 shadow-xl lg:w-8/12">
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
            <div className="flex flex-wrap w-full">
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
                  <div key={staff.staffId} className="w-full md:w-56 p-2">
                    <Link href={`/schedule-appointment/${staff.staffId}`}>
                      <div
                        className={`rounded-3xl p-2 ${color.bg} cursor-pointer hover:shadow-lg transition-shadow flex flex-col items-center`}
                        style={{ minHeight: "220px" }}
                      >
                        <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded-2xl">
                          <img
                            src={
                              staff.imageURL ||
                              "https://images.unsplash.com/photo-1570295999919-56cebcd28b2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
                            }
                            alt={`${staff.fullName}'s image`}
                            className="w-full h-full object-contain rounded-2xl"
                          />
                        </div>

                        <div className="mt-2 flex items-center">
                          <span className="h-3 w-3 bg-green-500 rounded-full mr-1"></span>
                          <span className="text-xs font-medium text-green-600">
                            Available
                          </span>
                        </div>
                        <div className="mt-1 text-center">
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

        {/* Right Column for Health Notifications */}
        <div className="mt-8 w-full lg:mt-0 lg:w-4/12 lg:pl-4">
          <div className="rounded-3xl bg-white px-6 pt-6 shadow-lg">
            <div className="flex pb-6 text-2xl font-bold text-gray-800">
              <p>Health Notifications</p>
            </div>
            <div>
              {healthNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex w-full border-t border-gray-200 p-4 hover:bg-gray-100 2xl:items-start"
                >
                  <img
                    src={notification.image}
                    alt="profile image"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="w-full pl-4">
                    <div className="flex w-full items-center justify-between">
                      <div className="font-medium text-gray-800">
                        {notification.title}
                      </div>
                    </div>
                    <p className="my-2 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <p className="text-right text-sm text-gray-500">
                      {notification.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
