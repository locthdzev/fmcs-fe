import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Lấy token từ cookie
  const token = request.cookies.get("token");
  console.log("Middleware is running, token:", token);

  if (!token) {
    // Nếu không có token, chuyển hướng về trang login
    console.log("No token found, redirecting to login page");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Nếu có token, tiếp tục xử lý request
  console.log("Token found, proceeding to next middleware");
  return NextResponse.next();
}

export const config = {
  matcher: ["/home", "/dashboard", "/admin", "/profile", "/settings"], // Danh sách các route cần bảo vệ
};
