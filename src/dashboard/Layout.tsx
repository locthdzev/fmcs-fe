import React, { useEffect, useRef } from "react";
import { TopBar } from "@/dashboard/topbar/TopBar";
import { Overlay } from "./Overlay";
import { Sidebar } from "./sidebar/Sidebar";
import { DashboardProvider } from "./Provider";
import { useSurveyRequired } from "@/context/SurveyRequiredContext";
import { useRouter } from "next/router";

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
  const { redirectToSurveyIfRequired, checkPendingSurveys, hasPendingSurveys } = useSurveyRequired();
  const router = useRouter();
  const isNavigatingRef = useRef(false);

  // Check survey status only when component mounts and when user changes
  // Not on every route change
  useEffect(() => {
    const checkInitialSurveyRequirement = async () => {
      // Only check on mount, not on every route change
      await checkPendingSurveys();
    };
    
    checkInitialSurveyRequirement();
  }, [checkPendingSurveys]);

  // Add router event listeners, but optimize to prevent excessive API calls
  useEffect(() => {
    // Check before starting navigation
    const handleRouteChangeStart = async (url: string) => {
      // Prevent multiple route changes from triggering multiple checks
      if (isNavigatingRef.current) return;
      
      // Block navigation if URL is not an allowed page
      const isAllowedUrl = url.includes('/survey/surveyUser') || 
                          url.includes('/survey/details/') || 
                          url.includes('/auth/login');
      
      if (hasPendingSurveys && !isAllowedUrl) {
        isNavigatingRef.current = true;
        router.events.emit('routeChangeError');
        // Cancel current navigation and redirect to survey page
        router.push('/survey/surveyUser');
        throw new Error('Route change aborted. Survey completion is required.');
      }
    };

    // Check after navigation is complete, but with debounce
    const handleRouteChangeComplete = async () => {
      isNavigatingRef.current = false;
      
      // Only redirect if necessary, don't call checkPendingSurveys again
      // because the context already has throttling
      if (hasPendingSurveys) {
        await redirectToSurveyIfRequired();
      }
    };

    // Register events
    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      // Unregister events on unmount
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router, hasPendingSurveys, redirectToSurveyIfRequired]);

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
      </div>
    </DashboardProvider>
  );
}
