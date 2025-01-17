import { useEffect, useState, createContext, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from 'js-cookie';

interface User {
  email: string;
  userId: string;
  userName: string;
  role: string[];
  auth: boolean;
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

  useEffect(() => {
    // localStorage.removeItem("token");
    // localStorage.removeItem("email");
    // localStorage.removeItem("role");


    const token = Cookies.get("token"); // Lấy token từ cookies
    if (token) {
      const decoded: any = jwtDecode(token);
      setUser({
        email: decoded.email,
        userId: decoded.userid,
        userName: decoded.username,
        role: decoded[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ],
        auth: true,
      });
    }
  }, []);

  const loginContext = (email: string, token: string) => {
    const decoded: any = jwtDecode(token);
    setUser({
      email: decoded.email,
      userId: decoded.userid,
      userName: decoded.username,
      role: decoded[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ],
      auth: true,
    });

    // Lưu token vào cookie thay vì localStorage
    Cookies.set("token", token, { expires: 1 }); // expires: 1 là thời gian sống của cookie (1 ngày)
    Cookies.set("email", email, { expires: 1 });
    Cookies.set("role", JSON.stringify(decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]), { expires: 1 });
  };

  const logout = () => {
    Cookies.remove("token"); // Xóa token khỏi cookies
    Cookies.remove("email");
    Cookies.remove("role");
    setUser({
      email: "",
      userId: "",
      userName: "",
      role: [],
      auth: false,
    });
  };

  return (
    <UserContext.Provider value={{ user, loginContext, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
