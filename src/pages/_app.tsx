import Head from "next/head";
import "tailwindcss/tailwind.css";
import { AppProps } from "next/app";
import { DashboardLayout } from "@/dashboard/Layout";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserContext, UserProvider } from "@/context/UserContext";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { HeroUIProvider } from "@heroui/react";
import Chatbot from "@/components/chatbot.tsx";
import { ChatbotProvider } from "@/context/ChatbotContext";
import { SurveyRequiredProvider } from '@/context/SurveyRequiredContext';
import { App as AntdApp, ConfigProvider } from "antd";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const getHighestRole = (roles: string[]) => {
    const roleHierarchy = ["Admin", "Manager", "Healthcare Staff", "Canteen Staff", "User"];
    for (const role of roleHierarchy) {
      if (roles.includes(role)) {
        return role;
      }
    }
    return "User";
  };

  useEffect(() => {
    // ...
  }, []);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <HeroUIProvider>
        <ConfigProvider>
          <AntdApp>
            <UserProvider>
              <SurveyRequiredProvider>
                <ChatbotProvider>
                  <UserContext.Consumer>
                    {(context) => {
                      const user = context?.user;

                      // Kiểm tra nếu đang ở trang login, recover password hoặc reset password
                      const isAuthPage = router.pathname === "/" || router.pathname.includes("/auth/recover-password") || router.pathname.includes("/auth/reset-password");

                      // Nếu chưa đăng nhập hoặc đang ở trang auth, không hiển thị Sidebar và Header
                      if (!user?.auth || isAuthPage) {
                        return (
                          <>
                            <main className="bg-white flex-1">
                              <Component {...pageProps} />
                            </main>
                            <Chatbot />
                          </>
                        );
                      }

                      // Nếu đã đăng nhập và không phải trang login
                      const highestRole = user?.role
                        ? getHighestRole(user.role)
                        : null;
                      return (
                        <>
                          <Head>
                            <title>FMCS</title>
                          </Head>
                          {highestRole === "Admin" ? (
                            <DashboardLayout>
                              <Component {...pageProps} />
                            </DashboardLayout>
                          ) : (
                            <DashboardLayout>
                              <Component {...pageProps} />
                            </DashboardLayout>
                          )}
                          <Chatbot />
                        </>
                      );
                    }}
                  </UserContext.Consumer>
                </ChatbotProvider>
              </SurveyRequiredProvider>
            </UserProvider>
          </AntdApp>
        </ConfigProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable={false}
          pauseOnHover
        />
      </HeroUIProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp;
