import React from "react";
import { TopBar } from "@/dashboard/topbar/TopBar";
import { Overlay } from "./Overlay";
import { Sidebar } from "./sidebar/Sidebar";
import { DashboardProvider } from "./Provider";
import { useSurveyRequired } from "@/context/SurveyRequiredContext";
import { SurveyRequiredModal } from "@/components/survey/SurveyRequiredModal";

interface LayoutProps {
  children: React.ReactNode;
}

const style = {
  container: "bg-gray-900 h-screen overflow-hidden relative",
  mainContainer:
    "flex flex-col h-screen pl-0 w-full lg:pl-20 lg:space-y-3 bg-white",
  main: "bg-white h-screen overflow-auto pb-36 pt-4 px-2 md:pb-8 md:pt-4 lg:pt-0 lg:px-4",
};

export function DashboardLayout(props: LayoutProps) {
  const { checkPendingSurveys } = useSurveyRequired();

  // Không cần kiểm tra khi chuyển route, vì chúng ta chỉ kiểm tra khi đăng nhập
  // và SurveyRequiredContext đã tự quản lý việc kiểm tra này

  return (
    <DashboardProvider>
      <div className={style.container}>
        <div className="flex items-start">
          <Overlay />
          <Sidebar mobileOrientation="end" />
          <div className={style.mainContainer}>
            <TopBar />
            <main className={style.main}>{props.children}</main>
          </div>
        </div>
        {/* Survey Required Modal - sẽ tự động hiển thị khi có pending surveys */}
        <SurveyRequiredModal onSuccess={checkPendingSurveys} />
      </div>
    </DashboardProvider>
  );
}
