import Link from "next/link";
import { UserContext } from "@/context/UserContext";
import router from "next/router";
import { FaChevronDown, FaCog, FaSignOutAlt, FaRandom } from "react-icons/fa";
import { useContext, useState, useRef, useEffect } from "react";
import { ProfileIcon } from "./icons/ProfileIcon";
import { SettingsProfileIcon } from "./icons/SettingsProfileIcon";
import { getUserProfile } from "@/api/user";

const style = {
  dropdownOpen:
    "absolute right-0 mt-2 bg-white rounded-lg p-2 z-50 w-[180px] shadow-lg",
  dropdownItem:
    "flex items-center text-sm py-2 px-4 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-800 hover:text-black",
  dropdownIcon: "mr-3 text-lg",
};

// Mảng đường dẫn tới các avatar tùy chỉnh
const AVATARS = [
  '/images/avatars-random/avatar1.svg',
  '/images/avatars-random/avatar2.svg',
  '/images/avatars-random/avatar3.svg',
  '/images/avatars-random/avatar4.svg',
  '/images/avatars-random/avatar5.svg',
  '/images/avatars-random/avatar6.svg',
  '/images/avatars-random/avatar7.svg',
  '/images/avatars-random/avatar8.svg',
  '/images/avatars-random/avatar9.svg',
  '/images/avatars-random/avatar10.svg',
];

// Đối tượng chứa các style cho avatar frame dựa trên role
interface AvatarFrame {
  ringColor: string;
  ringWidth: string;
  borderStyle: string;
  ringGradient: string;
  animation?: string;
}

type RoleType = "Admin" | "Manager" | "Healthcare Staff" | "Canteen Staff" | "User" | "default";

const AVATAR_FRAMES: Record<RoleType, AvatarFrame> = {
  "Admin": {
    ringColor: "ring-red-500",
    ringWidth: "ring-3",
    borderStyle: "border-2 border-white",
    animation: "animate-pulse", // Hiệu ứng nhấp nháy
    ringGradient: "bg-gradient-to-r from-red-500 to-orange-500"
  },
  "Manager": {
    ringColor: "ring-blue-500",
    ringWidth: "ring-3",
    borderStyle: "border-2 border-white",
    ringGradient: "bg-gradient-to-r from-blue-500 to-cyan-500"
  },
  "Healthcare Staff": {
    ringColor: "ring-green-500",
    ringWidth: "ring-3",
    borderStyle: "border-2 border-white",
    ringGradient: "bg-gradient-to-r from-green-500 to-emerald-500"
  },
  "Canteen Staff": {
    ringColor: "ring-amber-500",
    ringWidth: "ring-3",
    borderStyle: "border-2 border-white",
    ringGradient: "bg-gradient-to-r from-amber-500 to-yellow-400"
  },
  "User": {
    ringColor: "ring-purple-500",
    ringWidth: "ring-3",
    borderStyle: "border-2 border-white",
    ringGradient: "bg-gradient-to-r from-purple-500 to-pink-500"
  },
  "default": {
    ringColor: "ring-gray-200",
    ringWidth: "ring-2",
    borderStyle: "",
    ringGradient: ""
  }
};

const DropdownUser = () => {
  const userContext = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [profileImageURL, setProfileImageURL] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [randomSeed, setRandomSeed] = useState<number>(0); // Thêm state để lưu seed ngẫu nhiên
  const [useCustomAvatar, setUseCustomAvatar] = useState<boolean>(false); // State để theo dõi việc sử dụng avatar tùy chỉnh

  useEffect(() => {
    // Lấy thông tin chi tiết của người dùng từ API khi component được mount
    const fetchUserDetails = async () => {
      setIsLoading(true);
      try {
        const userProfile = await getUserProfile();
        console.log("User profile from API:", userProfile);
        if (userProfile.imageURL) {
          setProfileImageURL(userProfile.imageURL);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userContext?.user.auth) {
      fetchUserDetails();
    } else {
      setIsLoading(false);
    }
  }, [userContext?.user.auth]);

  const handleToggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    if (userContext) {
      userContext.logout();
      router.replace("/");
    }
  };

  const getHighestRole = (roles: string[]) => {
    const roleOrder = ["Admin", "Manager", "Healthcare Staff", "Canteen Staff", "User"];
    for (const role of roleOrder) {
      if (roles.includes(role)) {
        return role;
      }
    }
    return "";
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "text-red-600";
      case "Manager":
        return "text-blue-600";
      case "Healthcare Staff":
        return "text-green-600";
      case "Canteen Staff":
        return "text-amber-600";
      case "User":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  // Hàm để lấy khung avatar dựa trên role
  const getAvatarFrame = (role: string): AvatarFrame => {
    return (role in AVATAR_FRAMES) 
      ? AVATAR_FRAMES[role as RoleType] 
      : AVATAR_FRAMES["default"];
  };

  // Hàm để chọn avatar ngẫu nhiên mới
  const handleRandomAvatar = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn việc mở dropdown khi click vào nút random
    setRandomSeed(Math.floor(Math.random() * 1000000)); // Tạo số ngẫu nhiên mới
    setUseCustomAvatar(true); // Đánh dấu là sử dụng avatar tùy chỉnh
  };

  // Hàm để quay lại sử dụng ảnh thật
  const handleUseRealImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn việc mở dropdown khi click
    setUseCustomAvatar(false); // Đánh dấu là sử dụng ảnh thật
  };

  // Get avatar URL based on user role
  const getAvatarUrl = () => {
    const highestRole = getHighestRole(userContext?.user.role || []);
    
    // If user is Healthcare Staff and has an imageURL from profile API AND not choosing to use custom avatar
    if (highestRole === "Healthcare Staff" && profileImageURL && !useCustomAvatar) {
      return profileImageURL;
    }
    
    // Otherwise use one of our custom avatars
    // Sử dụng userId hoặc email để chọn ảnh cố định cho mỗi người dùng
    const userId = userContext?.user.userId || '';
    const email = userContext?.user.email || '';
    
    // Sử dụng userId làm seed chính, nếu không có thì dùng email
    const seedStr = userId || email || 'default';
    
    // Tính toán giá trị hash đơn giản từ chuỗi
    let hashValue = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hashValue = ((hashValue << 5) - hashValue) + seedStr.charCodeAt(i);
      hashValue = hashValue & hashValue; // Chuyển về số nguyên 32-bit
    }
    
    // Lấy giá trị tuyệt đối để đảm bảo không bị âm
    hashValue = Math.abs(hashValue);
    
    // Thêm randomSeed vào hashValue nếu người dùng đã click random
    if (randomSeed > 0) {
      hashValue = (hashValue + randomSeed) % 1000000;
    }
    
    // Chọn ảnh dựa trên hash và đảm bảo kết quả nhất quán
    const avatarIndex = hashValue % AVATARS.length;
    
    return AVATARS[avatarIndex];
  };

  // Mặc định hiển thị skeleton loader khi đang tải
  if (isLoading) {
    return (
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center gap-4">
          <div className="text-right lg:block">
            <div className="block h-5 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="block h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-3 w-3 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
        </div>
      </div>
    );
  }

  // Kiểm tra xem có đang hiển thị ảnh thật từ Healthcare Staff không
  const isUsingRealImage = getHighestRole(userContext?.user.role || []) === "Healthcare Staff" && profileImageURL && !useCustomAvatar;
  
  // Lấy role cao nhất của người dùng
  const highestRole = getHighestRole(userContext?.user.role || []);
  
  // Lấy thông tin frame cho avatar
  const avatarFrame = getAvatarFrame(highestRole);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        className="flex items-center gap-4 hover:opacity-90 transition-all duration-300"
      >
        <span className="text-right lg:block">
          <span className="block text-base font-medium text-black">
            {userContext?.user.userName || "Guest"}
          </span>
          <span className="block text-xs text-gray-600">
            {userContext?.user.email}
          </span>
          {userContext?.user.role && highestRole && highestRole !== "User" && (
            <span className={`block text-xs ${getRoleColor(highestRole)} font-semibold`}>
              {highestRole}
            </span>
          )}
        </span>
        <div className="relative block">
          {/* Custom avatar frame */}
          <div className={`relative p-0.5 rounded-full ${avatarFrame.ringGradient || "bg-white"} ${avatarFrame.animation || ""}`}>
            <div className={`overflow-hidden rounded-full ${avatarFrame.borderStyle} ${avatarFrame.ringColor} ${avatarFrame.ringWidth} hover:scale-105 transition-all duration-300`}>
              <img
                alt="User Avatar"
                src={getAvatarUrl()}
                className="h-10 w-10 rounded-full object-cover"
              />
            </div>
          </div>
          
          {/* Nút random avatar - hiển thị cho tất cả người dùng */}
          <button 
            onClick={handleRandomAvatar}
            className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors duration-200 z-10"
            title="Random Avatar"
          >
            <FaRandom size={10} className="text-gray-600" />
          </button>
          
          {/* Nút quay lại dùng ảnh thật - chỉ hiển thị cho Healthcare Staff đang dùng avatar tùy chỉnh */}
          {getHighestRole(userContext?.user.role || []) === "Healthcare Staff" && profileImageURL && useCustomAvatar && (
            <button 
              onClick={handleUseRealImage}
              className="absolute -bottom-1 -left-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors duration-200 z-10"
              title="Use Real Image"
            >
              <img src={profileImageURL} className="w-3 h-3 rounded-full object-cover" />
            </button>
          )}
        </div>
        <FaChevronDown
          className={`hidden fill-current text-black sm:block transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={12}
        />
      </button>

      {isOpen && (
        <div className={style.dropdownOpen}>
          <ul className="flex flex-col">
            <li>
              <Link href="/my-profile" className={style.dropdownItem}>
                <ProfileIcon />
                <span className="ml-3">My Profile</span>
              </Link>
            </li>
            <li>
              <Link href="/settings" className={style.dropdownItem}>
                <SettingsProfileIcon />
                <span className="ml-3">Settings</span>
              </Link>
            </li>
          </ul>
          <hr className="my-2" />
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center text-sm text-red-600 py-2 px-4 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <FaSignOutAlt className="mr-3 text-lg text-red-500" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownUser;
