import { useState } from "react";
import { useRouter } from "next/router";
import { sendOtp, verifyOtp } from "@/api/otp";
import { toast } from "react-toastify";
import OTPInput from "react-otp-input";

export default function Recovery() {
  const [emailOrUserName, setEmailOrUserName] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [step, setStep] = useState<"send" | "verify">("send");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await sendOtp(emailOrUserName);
      if (response.isSuccess) {
        toast.success("OTP has been sent to your email!");
        setStep("verify");
      } else {
        toast.error(
          response.message || "Failed to send OTP. Please try again."
        );
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while sending OTP.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await verifyOtp({ emailOrUserName, OTPCode: otpCode });
      if (response.isSuccess) {
        toast.success(
          "OTP verification successful! Redirecting to reset password..."
        );
        router.push({
          pathname: "/auth/reset-password",
          query: {
            [emailOrUserName.includes(".com") ? "email" : "username"]:
              emailOrUserName,
          },
        });
      } else {
        toast.error(
          response.message || "OTP verification failed. Please try again."
        );
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while verifying OTP.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 relative overflow-hidden">
      <div className="relative bg-white p-12 rounded-lg shadow-xl w-full max-w-lg border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">
            Recover Your Account
          </h1>
          <p className="text-gray-600 text-lg">
            Enter your details to recover access
          </p>
        </div>

        {step === "send" ? (
          <form onSubmit={handleSendOtp} className="space-y-6 backdrop-blur-sm">
            <div className="relative">
              <input
                type="text"
                placeholder="Email or username"
                value={emailOrUserName}
                onChange={(e) => setEmailOrUserName(e.target.value)}
                required
                className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 text-white py-4 text-lg rounded-lg hover:bg-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? "Sending..." : "Send OTP Code"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            className="space-y-6 backdrop-blur-sm"
          >
            <div className="flex justify-between gap-3">
              <OTPInput
                value={otpCode}
                onChange={(value) => setOtpCode(value)}
                numInputs={6}
                shouldAutoFocus
                renderInput={(props) => <input {...props} />}
                inputStyle={{
                  width: "56px",
                  height: "56px",
                  fontSize: "24px",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  color: "#374151",
                }}
                containerStyle={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || otpCode.length < 6}
              className="w-full bg-orange-500 text-white py-4 text-lg rounded-lg hover:bg-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}
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
