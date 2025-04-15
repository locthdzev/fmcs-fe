import { useEffect, useState, createContext, ReactNode } from "react";
import jwtDecode from "jwt-decode"; // Fixed import
import Cookies from "js-cookie";
import router from "next/router";
import { getUserProfile } from "@/api/user";

interface User {
  email: string;
  userId: string;
  userName: string;
  role: string[];
  auth: boolean;
  imageURL?: string;
}

interface UserContextType {
  user: User;
  loginContext: (email: string, token: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>({
    email: "",
    userId: "",
    userName: "",
    role: [],
    auth: false,
  });

  // Hàm helper để lấy imageURL từ token với nhiều cách viết khác nhau
  const getImageUrlFromToken = (decoded: any): string | undefined => {
    return decoded.imageurl || decoded.imageUrl || decoded.ImageUrl || decoded.ImageURL || decoded.imageURL || undefined;
  };

  // Hàm để lấy thông tin chi tiết của người dùng từ API
  const fetchUserDetails = async () => {
    try {
      const userProfile = await getUserProfile();
      console.log("User profile from API:", userProfile);
      
      // Cập nhật thông tin người dùng với dữ liệu từ API
      setUser(prev => ({
        ...prev,
        // Giữ nguyên các thông tin đã có từ token
        imageURL: userProfile.imageURL || prev.imageURL, // Ưu tiên imageURL từ API
      }));
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  useEffect(() => {
    // localStorage.removeItem("token");
    // localStorage.removeItem("email");
    // localStorage.removeItem("role");

    const token = Cookies.get("token"); // Lấy token từ cookies
    if (token) {
      const decoded: any = jwtDecode(token);
      const roles =
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      console.log("User roles:", roles);
      console.log("Decoded token:", decoded); // Log token để kiểm tra
      
      const imageURL = getImageUrlFromToken(decoded);
      console.log("Image URL from token:", imageURL);
      
      setUser({
        email: decoded.email,
        userId: decoded.userid,
        userName: decoded.username,
        role: roles,
        auth: true,
        imageURL: imageURL,
      });

      // Sau khi set user từ token, lấy thêm thông tin chi tiết từ API
      fetchUserDetails();
    }
  }, []);

  const loginContext = (email: string, token: string) => {
    const decoded: any = jwtDecode(token);
    const roles =
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    console.log("User roles after login:", roles);
    console.log("Decoded token:", decoded); // Log token để kiểm tra
    
    const imageURL = getImageUrlFromToken(decoded);
    console.log("Image URL from token:", imageURL);
    
    setUser({
      email: decoded.email,
      userId: decoded.userid,
      userName: decoded.username,
      role: roles,
      auth: true,
      imageURL: imageURL,
    });

    // Lưu token vào cookie thay vì localStorage
    Cookies.set("token", token, { expires: 1 }); // expires: 1 là thời gian sống của cookie (1 ngày)
    Cookies.set("email", email, { expires: 1 });
    Cookies.set("role", JSON.stringify(roles), { expires: 1 });

    // Lấy thêm thông tin chi tiết từ API sau khi đăng nhập
    fetchUserDetails();
  };

  const logout = () => {
    const token = Cookies.get("token");
    const email = Cookies.get("email");
    const role = Cookies.get("role");

    if (token) Cookies.remove("token");
    if (email) Cookies.remove("email");
    if (role) Cookies.remove("role");

    setUser({
      email: "",
      userId: "",
      userName: "",
      role: [],
      auth: false,
      imageURL: undefined,
    });
    router.replace("/");
  };

  return (
    <UserContext.Provider value={{ user, loginContext, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
