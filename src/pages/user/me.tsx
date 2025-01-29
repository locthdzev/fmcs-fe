import { useEffect, useState } from "react";
import { getUserProfile, UserProfile, updateUser } from "@/api/user";
import { toast } from "react-toastify";
import router from "next/router";
import Cookies from "js-cookie";
import { Button } from "@heroui/react";
import { FaLock } from "react-icons/fa";

export default function UserProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = Cookies.get("token");
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const data = await getUserProfile();
        const formattedData = {
          ...data,
          dob: new Date(data.dob).toISOString().split("T")[0], // Format thành `YYYY-MM-DD`
        };
        setUserProfile(data);
        setFormValues(formattedData);
      } catch (error: any) {
        toast.error("Failed to fetch user profile.");
        router.replace("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!userProfile) return;
    try {
      const result = await updateUser(userProfile.id, formValues);
      toast.success("User information updated successfully.");
      setUserProfile({ ...userProfile, ...formValues });
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update user information.");
    }
  };

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
      <div className="w-full lg:w-8/12 bg-white rounded-3xl shadow-xl p-8">
        <h3 className="text-3xl font-bold mb-6">
          {isEditing ? "Edit Profile" : "User Profile"}
        </h3>
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                label: "Full Name",
                name: "fullName",
                placeholder: "Daisy",
                type: "text",
              },
              {
                label: "Username",
                name: "userName",
                placeholder: "Username",
                type: "text",
              },
              {
                label: "Email",
                name: "email",
                placeholder: "daisy@site.com",
                type: "email",
              },
              {
                label: "Gender",
                name: "gender",
                placeholder: "Gender",
                type: "select",
                options: ["Male", "Female"],
              },
              {
                label: "Date of Birth",
                name: "dob",
                placeholder: "Date of Birth",
                type: "date",
              },
              {
                label: "Address",
                name: "address",
                placeholder: "Address",
                type: "text",
              },
              {
                label: "Phone",
                name: "phone",
                placeholder: "Phone",
                type: "text",
              },
            ].map((field, index) => (
              <label
                key={index}
                htmlFor={field.name}
                className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
              >
                <span className="text-xs font-medium text-gray-700">
                  {field.label}
                </span>
                {field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={formValues[field.name as keyof UserProfile] || ""}
                    onChange={handleInputChange}
                    className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                  >
                    {field.options?.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={String(
                      formValues[field.name as keyof UserProfile] || ""
                    )}
                    onChange={handleInputChange}
                    className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                    placeholder={field.placeholder}
                  />
                )}
              </label>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Full name", value: userProfile.fullName },
              { label: "Username", value: userProfile.userName || "N/A" },
              { label: "Email", value: userProfile.email },
              { label: "Gender", value: userProfile.gender },
              {
                label: "Date of birth",
                value: new Date(userProfile.dob).toLocaleDateString("vi-VN"),
              },
              { label: "Address", value: userProfile.address },
              { label: "Phone", value: userProfile.phone },
            ].map((field, index) => (
              <label
                key={index}
                className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm"
              >
                <span className="text-xs font-medium text-gray-700">
                  {field.label}
                </span>
                <div className="mt-1 w-full break-words text-gray-800 bg-gray-50 p-2 rounded-md shadow-inner">
                  {field.value}
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          {isEditing ? (
            <>
              <Button
                className="bg-gradient-to-tr from-blue-600 to-blue-300 text-white shadow-lg mr-2"
                radius="full"
                onClick={handleSave}
              >
                Save
              </Button>
              <Button
                className="bg-gradient-to-tr from-gray-500 to-gray-300 text-white shadow-lg"
                radius="full"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
              radius="full"
              onClick={() => setIsEditing(true)}
            >
              Change information
            </Button>
          )}
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
                className="bg-gradient-to-tr from-green-400 to-blue-400 text-white shadow-lg"
                radius="full"
              >
                Change password
              </Button>
            </div>
          </div>
          <div className="text-gray-500 mt-2">
            Use strong passwords for security!
          </div>
        </div>
      </div>
    </div>
  );
}
