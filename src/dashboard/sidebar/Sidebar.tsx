import css from "../style.module.css";
import { SidebarItems } from "./SidebarItems";
import { SidebarHeader } from "./SidebarHeader";
import { useDashboardContext } from "../Provider";

interface SidebarProps {
  mobileOrientation: "start" | "end";
}

const style = {
  mobileOrientation: {
    start: "left-0 ",
    end: "right-0 lg:left-0",
  },
  container: "pb-32 lg:pb-12",
  close: "duration-700 ease-out hidden transition-all lg:w-24",
  open: "absolute duration-500 ease-in transition-all w-9/12 z-40 sm:w-6/12 md:w-72",
  default:
    "h-screen overflow-y-auto text-orange-500 top-0 lg:absolute bg-gradient-to-b from-white via-gray-200 to-orange-300 lg:block lg:z-40 rounded-r-2xl shadow-lg shadow-gray-500/50",
};

export function Sidebar(props: SidebarProps) {
  const { sidebarOpen } = useDashboardContext();
  return (
    <aside
      className={`${style.default} 
        ${style.mobileOrientation[props.mobileOrientation]} 
        ${sidebarOpen ? style.open : style.close} ${css.scrollbar}`}
    >
      <div className={style.container}>
        <SidebarHeader />
        <SidebarItems />
      </div>
    </aside>
  );
}
