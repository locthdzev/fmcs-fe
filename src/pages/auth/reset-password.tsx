import { useState } from "react";
import { useRouter } from "next/router";
import { resetPassword } from "@/api/auth";
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
  Steps,
} from "antd";
import Link from "next/link";
import { ArrowLeftOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { email, username } = router.query;
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const handleResetPassword = async (values: {
    newPassword: string;
    confirmPassword: string;
  }) => {
    setIsLoading(true);

    if (values.newPassword !== values.confirmPassword) {
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
        password: values.newPassword,
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
            <img
              src="/reset-password.svg"
              alt="Reset Password"
              className="w-full h-auto"
            />
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
                RESET YOUR PASSWORD
              </Title>
              <Text type="secondary">Enter your new password</Text>
            </div>

            <div className="mb-6">
              <Steps
                current={2}
                items={[
                  {
                    title: "Verify Identity",
                    description: "Enter your email/username",
                  },
                  {
                    title: "Enter OTP",
                    description: "Verify with code",
                  },
                  {
                    title: "Reset Password",
                    description: "Create new password",
                  },
                ]}
                progressDot
                size="small"
              />
            </div>

            <Form
              form={form}
              name="reset_password"
              onFinish={handleResetPassword}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="newPassword"
                rules={[
                  {
                    required: true,
                    message: "Please input your new password!",
                  },
                  { min: 6, message: "Password must be at least 6 characters" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="New Password"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                rules={[
                  {
                    required: true,
                    message: "Please confirm your new password!",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("The two passwords do not match!")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirm New Password"
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
                  Reset Password
                </Button>
              </Form.Item>
            </Form>

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
