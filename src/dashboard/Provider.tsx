import React from "react";
import { useRouter } from "next/router";

interface DashboardProviderProps {
  children: React.ReactNode;
}

interface ProviderValues {
  sidebarOpen?: boolean;
  openSidebar?: () => void;
  closeSidebar?: () => void;
  dropdownOpen?: boolean;
  toggleDropdown?: () => void;
  closeDropdown?: () => void;
}

// create new context
const Context = React.createContext<ProviderValues>({});

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const router = useRouter();

  const openSidebar = React.useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const closeSidebar = React.useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleDropdown = React.useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = React.useCallback(() => {
    setDropdownOpen(false);
  }, []);

  React.useEffect(() => {
    document.documentElement.style.overflow = "hidden";
  }, []);

  React.useEffect(() => {
    if (sidebarOpen) {
      router.events.on("routeChangeStart", () => setSidebarOpen(false));
    }

    return () => {
      if (sidebarOpen) {
        router.events.off("routeChangeStart", () => setSidebarOpen(false));
      }
    };
  }, [sidebarOpen, router]);

  return (
    <Context.Provider
      value={{
        sidebarOpen,
        openSidebar,
        closeSidebar,
        dropdownOpen,
        toggleDropdown,
        closeDropdown,
      }}
    >
      {children}
    </Context.Provider>
  );
}

// custom hook to consume all context values { sidebarOpen, openSidebar, closeSidebar }
export function useDashboardContext() {
  return React.useContext(Context);
}
