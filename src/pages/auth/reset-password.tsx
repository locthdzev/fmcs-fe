import { useState } from "react";
import { useRouter } from "next/router";
import { resetPassword } from "@/api/auth";
import { message } from "antd";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { email, username } = router.query;
  const [messageApi, contextHolder] = message.useMessage();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      messageApi.error({
        content: "Passwords do not match. Please try again.",
        duration: 5,
      });
      setIsLoading(false);
      return;
    }

    try {
      const emailOrUsername = email || username;
      if (!emailOrUsername) {
        messageApi.error({
          content: "Email or username is required.",
          duration: 5,
        });
        setIsLoading(false);
        return;
      }
      const response = await resetPassword({
        emailOrUsername: Array.isArray(emailOrUsername)
          ? emailOrUsername[0]
          : emailOrUsername,
        password: newPassword,
      });

      if (response.isSuccess) {
        messageApi.success({
          content: "Password reset successful! You can now login.",
          duration: 5,
        });
        router.push("/");
      } else {
        messageApi.error({
          content: "Password reset failed. Please try again.",
          duration: 5,
        });
      }
    } catch (error) {
      const err = error as any;
      messageApi.error({
        content:
          err.response?.data?.message ||
          "An error occurred while resetting password.",
        duration: 5,
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 relative overflow-hidden">
      {contextHolder}
      <div className="relative bg-white p-12 rounded-lg shadow-xl w-full max-w-lg border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 text-lg">Enter your new password</p>
        </div>
        <form
          onSubmit={handleResetPassword}
          className="space-y-6 backdrop-blur-sm"
        >
          <div className="relative">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300"
            />
          </div>
          <div className="relative">
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 text-white py-4 text-lg rounded-lg hover:bg-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-orange-600 hover:text-orange-700 flex items-center justify-center gap-2 transition-colors duration-300 hover:underline text-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
