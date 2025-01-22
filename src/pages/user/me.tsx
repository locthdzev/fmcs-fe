import { useEffect, useState } from "react";
import { getUserProfile, UserProfile } from "@/api/user";
import { toast } from "react-toastify";
import router from "next/router";
import Cookies from "js-cookie";
import { Button } from "@heroui/react";
import { FaLock } from "react-icons/fa";

export default function UserProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = Cookies.get("token");
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const data = await getUserProfile();
        setUserProfile(data);
      } catch (error: any) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to fetch user profile.");
        router.replace("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-red-500">
          Failed to load user profile.
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-6">
      <div className="w-full lg:w-8/12 bg-white rounded-3xl shadow-xl p-6">
        <h3 className="text-2xl font-bold mb-6">User Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Full name", value: userProfile.fullName },
            { label: "Username", value: userProfile.userName || "N/A" },
            { label: "Email", value: userProfile.email },
            { label: "Roles", value: userProfile.roles?.join(", ") || "N/A" },
            { label: "Gender", value: userProfile.gender },
            {
              label: "Date of birth",
              value: new Date(userProfile.dob).toLocaleDateString("vi-VN"),
            },
            { label: "Address", value: userProfile.address },
            { label: "Phone", value: userProfile.phone },
            {
              label: "Created at",
              value: new Date(userProfile.createdAt).toLocaleDateString(
                "vi-VN"
              ),
            },
            { label: "Status", value: userProfile.status || "Active" },
          ].map((field, index) => (
            <div key={index} className="flex items-center">
              <span className="font-semibold text-gray-700 w-1/3">
                {field.label}
              </span>
              <div className="relative flex-1">
                <div className="absolute top-1/2 w-full h-px bg-gray-300 -translate-y-1/2"></div>
                <span className="absolute top-1/2 left-4 bg-white px-2 text-gray-800 -translate-y-1/2">
                  {field.value}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
            radius="full"
          >
            Change information
          </Button>
        </div>
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-xl font-semibold mb-4">Account & Security</h3>
          <div className="flex items-center">
            <span className="mr-2">
              <FaLock />
            </span>
            <span className="mr-2">Change account password</span>
            <div className="ml-auto">
              <Button
                className="bg-gradient-to-tr from-green-500 to-green-300 text-white shadow-lg"
                radius="full"
              >
                Change password
              </Button>
            </div>
          </div>
          <div className="text-gray-500">
            Use strong passwords for security!
          </div>{" "}
        </div>
      </div>
    </div>
  );
}
