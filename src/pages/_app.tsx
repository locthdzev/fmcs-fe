import Head from "next/head";
import "tailwindcss/tailwind.css";
import { AppProps } from "next/app";
import { DashboardLayout } from "@/dashboard/Layout";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserContext, UserProvider } from "@/context/UserContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { HeroUIProvider } from "@heroui/react";
import Chatbot from "@/components/chatbot.tsx";
import { ChatbotProvider } from "@/context/ChatbotContext";
import { SurveyRequiredProvider } from '@/context/SurveyRequiredContext';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const getHighestRole = (roles: string[]) => {
    const roleHierarchy = ["Admin", "Manager", "Staff", "User"];
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
        <UserProvider>
          <SurveyRequiredProvider>
            <ChatbotProvider>
              <UserContext.Consumer>
                {(context) => {
                  const user = context?.user;

                  // Kiểm tra nếu đang ở trang login
                  const isLoginPage = router.pathname === "/";

                  // Nếu chưa đăng nhập hoặc đang ở trang login, không hiển thị Sidebar và Header
                  if (!user?.auth || isLoginPage) {
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
        <ToastContainer
          position="top-right"
          autoClose={5000}
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
