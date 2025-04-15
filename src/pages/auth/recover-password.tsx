import { useState } from "react";
import { useRouter } from "next/router";
import { sendOtp, verifyOtp } from "@/api/otp";
import {
  message,
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  Row,
  Col,
} from "antd";
import OTPInput from "react-otp-input";
import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const { Title, Text } = Typography;

export default function Recovery() {
  const [emailOrUserName, setEmailOrUserName] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [step, setStep] = useState<"send" | "verify">("send");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const handleSendOtp = async (values: { emailOrUserName: string }) => {
    setEmailOrUserName(values.emailOrUserName);
    setIsLoading(true);
    try {
      const response = await sendOtp(values.emailOrUserName);
      if (response.isSuccess) {
        messageApi.success({
          content: "OTP has been sent to your email!",
          duration: 5,
        });
        setStep("verify");
      } else {
        messageApi.error({
          content: response.message || "Failed to send OTP. Please try again.",
          duration: 5,
        });
      }
    } catch (error: any) {
      messageApi.error({
        content: error.message || "An error occurred while sending OTP.",
        duration: 5,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const response = await verifyOtp({ emailOrUserName, OTPCode: otpCode });
      if (response.isSuccess) {
        messageApi.success({
          content:
            "OTP verification successful! Redirecting to reset password...",
          duration: 5,
        });
        router.push({
          pathname: "/auth/reset-password",
          query: {
            [emailOrUserName.includes(".com") ? "email" : "username"]:
              emailOrUserName,
          },
        });
      } else {
        messageApi.error({
          content:
            response.message || "OTP verification failed. Please try again.",
          duration: 5,
        });
      }
    } catch (error: any) {
      messageApi.error({
        content: error.message || "An error occurred while verifying OTP.",
        duration: 5,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      {contextHolder}
      <Row gutter={[24, 0]} className="w-full max-w-6xl mx-auto" align="middle">
        <Col
          xs={0}
          sm={0}
          md={12}
          lg={14}
          xl={14}
          className="flex justify-center items-center"
        >
          <div className="p-8 w-full">
            <AnimatePresence mode="wait">
              {step === "send" ? (
                <motion.img
                  key="forgot-password"
                  src="/forgot-password.svg"
                  alt="Forgot Password"
                  className="w-full h-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                />
              ) : (
                <motion.img
                  key="enter-otp"
                  src="/enter-otp.svg"
                  alt="Enter OTP"
                  className="w-full h-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </AnimatePresence>
          </div>
        </Col>
        <Col
          xs={24}
          sm={24}
          md={12}
          lg={10}
          xl={10}
          className="flex items-center"
        >
          <Card
            style={{ width: "100%" }}
            bordered={false}
            className="shadow-lg"
          >
            <div className="text-center mb-6">
              <Title level={4} style={{ color: "#f97316", fontWeight: "bold" }}>
                RECOVER YOUR ACCOUNT
              </Title>
              <Text type="secondary">Enter your details to recover access</Text>
            </div>

            {step === "send" ? (
              <Form
                name="recovery"
                onFinish={handleSendOtp}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="emailOrUserName"
                  rules={[
                    {
                      required: true,
                      message: "Please input your email or username!",
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter your email or username"
                    size="large"
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    style={{ background: "#f97316", height: "45px" }}
                  >
                    Send OTP Code
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                <div className="flex justify-center">
                  <OTPInput
                    value={otpCode}
                    onChange={(value) => setOtpCode(value)}
                    numInputs={6}
                    shouldAutoFocus
                    renderInput={(props) => <input {...props} />}
                    inputStyle={{
                      width: "45px",
                      height: "45px",
                      fontSize: "20px",
                      fontWeight: "bold",
                      textAlign: "center",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      color: "#374151",
                      margin: "0 4px",
                    }}
                    containerStyle={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  />
                </div>
                <Button
                  type="primary"
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otpCode.length < 6}
                  loading={isLoading}
                  block
                  style={{ background: "#f97316", height: "45px" }}
                >
                  Verify Code
                </Button>
              </Space>
            )}

            <Divider />

            <div className="text-center">
              <Link href="/" className="text-orange-600 hover:text-orange-700">
                <Space>
                  <ArrowLeftOutlined />
                  <span>Back to Login</span>
                </Space>
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
