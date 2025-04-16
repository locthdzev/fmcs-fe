import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwtDecode from "jwt-decode";

// Các trang có thể truy cập mà không cần xác thực
const publicRoutes = ["/", "/auth/recover-password", "/auth/reset-password"];

// Các trang tất cả người dùng đã đăng nhập có thể truy cập
const commonUserRoutes = [
  "/home",
  "/my-health-insurance",
  "/admin/documentation",
  "/admin/settings/general",
  "/admin/settings/security",
  "/survey/surveyUser",
  "/survey/details",
  "/my-schedule"
];

// Các trang chỉ dành cho Admin
const adminOnlyRoutes = [
  "/user",
  "/drug",
  "/drug-group",
  "/drug-order",
  "/drug-supplier",
  "/canteen-item",
  "/canteen-order",
  "/truck",
  "/appointment/management",
  "/appointment/manageforstaff",
  "/periodic-health-checkup",
  "/schedule",
  "/shift",
  "/batch-number",
  "/inventory-record",
  "/inventory-history",
  "/notification/management",
  "/survey/management",
  "/health-insurance",
  "/health-check-result",
  "/prescription",
  "/treatment-plan",
];

export function middleware(request: NextRequest) {
  // Lấy đường dẫn yêu cầu
  const path = request.nextUrl.pathname;
  console.log("Middleware checking path:", path);

  // Cho phép truy cập các trang công khai mà không cần token
  if (publicRoutes.includes(path)) {
    console.log("Public route, allowing access");
    return NextResponse.next();
  }

  // Kiểm tra token
  const token = request.cookies.get("token");
  console.log("Middleware is running, token:", token ? "exists" : "missing");

  if (!token) {
    // Nếu không có token, chuyển hướng về trang đăng nhập
    console.log("No token found, redirecting to login page");
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Kiểm tra xem đây có phải là đường dẫn dành cho mọi người dùng đã đăng nhập không
    const isCommonRoute = commonUserRoutes.some((route) => {
      // Khớp chính xác
      if (path === route) return true;

      // Đường dẫn bắt đầu bằng route + '/'
      if (route !== "/" && path.startsWith(`${route}/`)) return true;

      // Trường hợp đặc biệt cho survey details có chứa UUID
      if (
        route === "/survey/details" &&
        path.match(
          /^\/survey\/details\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
        )
      ) {
        return true;
      }

      return false;
    });

    if (isCommonRoute) {
      console.log("Common route accessible to all authenticated users");
      return NextResponse.next();
    }

    // Kiểm tra xem đường dẫn có phải là trang chỉ dành cho admin không
    const isAdminRoute = adminOnlyRoutes.some((route) => {
      if (path === route) return true;
      if (route !== "/" && path.startsWith(`${route}/`)) return true;
      return false;
    });

    // Nếu không phải trang admin-only, cho phép truy cập (có thể cấu hình thêm sau)
    if (!isAdminRoute) {
      return NextResponse.next();
    }

    // Nếu là trang admin, kiểm tra quyền
    const decoded: any = jwtDecode(token.value);

    // Xử lý trường role có thể là mảng hoặc chuỗi
    let roles =
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    // Chuyển đổi thành mảng nếu là chuỗi
    if (typeof roles === "string") {
      roles = [roles];
    } else if (!Array.isArray(roles)) {
      roles = [];
    }

    const isAdmin = roles.includes("Admin");

    console.log("User roles:", roles);
    console.log("Is admin:", isAdmin);

    // Nếu không phải admin và đang cố truy cập trang chỉ dành cho admin, chuyển hướng về trang home
    if (!isAdmin && isAdminRoute) {
      console.log(
        "Non-admin user trying to access admin-only route, redirecting to home"
      );
      return NextResponse.redirect(new URL("/home", request.url));
    }

    // Nếu là admin hoặc trang không cần quyền admin, tiếp tục
    console.log("Access granted, proceeding");
    return NextResponse.next();
  } catch (error) {
    console.error("Error in middleware:", error);
    // Nếu có lỗi khi giải mã token, chuyển hướng về trang đăng nhập
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  // Khớp tất cả các đường dẫn ngoại trừ API và tệp tĩnh
  matcher: ["/home", "/user", "/dashboard", "/admin", "/user/me", "/settings"], // Danh sách các route cần bảo vệ
};
