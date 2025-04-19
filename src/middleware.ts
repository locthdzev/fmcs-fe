import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwtDecode from "jwt-decode";

// Các trang có thể truy cập mà không cần xác thực
const publicRoutes = ["/", "/auth/recover-password", "/auth/reset-password"];

// Danh sách route được phép cho từng vai trò
const roleRoutes = {
  Admin: [
    "/my-profile",
    "/home",
    "/statistics/user",
    "/statistics/treatment-plan",
    "/statistics/drug",
    "/statistics/survey",
    "/user",
    "/drug",
    "/drug-group",
    "/drug-order",
    "/drug-supplier",
    "/batch-number",
    "/inventory-record",
    "/inventory-record/history",
    "/appointment",
    "/survey",
    "/health-check-result",
    "/health-check-result/pending",
    "/health-check-result/follow-up",
    "/health-check-result/no-follow-up",
    "/health-check-result/adjustment",
    "/health-check-result/soft-deleted",
    "/health-check-result/history",
    "/prescription",
    "/prescription/history",
    "/treatment-plan",
    "/treatment-plan/history",
    "/periodic-health-checkup",
    "/health-insurance",
    "/health-insurance/initial",
    "/health-insurance/expired-update",
    "/health-insurance/soft-deleted",
    "/health-insurance/verification",
    "/health-insurance/no-insurance",
    "/health-insurance/update-requests",
    "/health-insurance/history",
    "/shift",
    "/schedule",
    "/notification",
    "/canteen-item",
    "/canteen-order",
    "/delivery-truck",
    "/schedule-appointment",
    "/my-appointment",
    "/my-health-check",
    "/my-health-insurance",
    "/settings",
    "/documentation",
  ],
  Manager: [
    "/my-profile",
    "/home",
    "/statistics/user",
    "/statistics/treatment-plan",
    "/statistics/drug",
    "/statistics/survey",
    "/user",
    "/drug",
    "/drug-group",
    "/drug-order",
    "/drug-supplier",
    "/batch-number",
    "/inventory-record",
    "/inventory-record/history",
    "/appointment",
    "/survey",
    "/health-check-result",
    "/health-check-result/pending",
    "/health-check-result/follow-up",
    "/health-check-result/no-follow-up",
    "/health-check-result/adjustment",
    "/health-check-result/soft-deleted",
    "/health-check-result/history",
    "/prescription",
    "/prescription/history",
    "/treatment-plan",
    "/treatment-plan/history",
    "/periodic-health-checkup",
    "/health-insurance",
    "/health-insurance/initial",
    "/health-insurance/expired-update",
    "/health-insurance/soft-deleted",
    "/health-insurance/verification",
    "/health-insurance/no-insurance",
    "/health-insurance/update-requests",
    "/health-insurance/history",
    "/shift",
    "/schedule",
    "/notification",
    "/canteen-item",
    "/canteen-order",
    "/delivery-truck",
    "/schedule-appointment",
    "/my-appointment",
    "/my-health-check",
    "/my-health-insurance",
    "/settings",
    "/documentation",
  ],
  "Healthcare Staff": [
    "/my-profile",
    "/home",
    "/statistics/treatment-plan",
    "/statistics/drug",
    "/drug",
    "/drug-group",
    "/drug-order",
    "/drug-supplier",
    "/batch-number",
    "/inventory-record",
    "/inventory-record/history",
    "/health-check-result",
    "/health-check-result/pending",
    "/health-check-result/follow-up",
    "/health-check-result/no-follow-up",
    "/health-check-result/adjustment",
    "/health-check-result/soft-deleted",
    "/health-check-result/history",
    "/prescription",
    "/prescription/history",
    "/treatment-plan",
    "/treatment-plan/history",
    "/periodic-health-checkup",
    "/health-insurance",
    "/health-insurance/initial",
    "/health-insurance/expired-update",
    "/health-insurance/soft-deleted",
    "/health-insurance/verification",
    "/health-insurance/no-insurance",
    "/health-insurance/update-requests",
    "/health-insurance/history",
    "/notification",
    "/canteen-item",
    "/canteen-order",
    "/delivery-truck",
    "/schedule-appointment",
    "/my-assigned-appointment",
    "/my-appointment",
    "/my-assigned-survey",
    "/my-health-check",
    "/my-periodic-checkup",
    "/my-health-insurance",
    "/my-schedule",
    "/settings",
    "/documentation",
  ],
  "Canteen Staff": [
    "/my-profile",
    "/home",
    "/canteen-item",
    "/canteen-order",
    "/delivery-truck",
    "/settings",
    "/documentation",
  ],
  User: [
    "/my-profile",
    "/home",
    "/schedule-appointment",
    "/my-appointment",
    "/my-submitted-survey",
    "/my-health-check",
    "/my-periodic-checkup",
    "/my-health-insurance",
    "/settings",
    "/documentation",
  ],
};

export function middleware(request: NextRequest) {
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
    console.log("No token found, redirecting to login page");
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Kiểm tra quyền dựa trên vai trò
    const decoded: any = jwtDecode(token.value);
    let roles =
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    if (typeof roles === "string") {
      roles = [roles];
    } else if (!Array.isArray(roles)) {
      roles = [];
    }

    console.log("User roles:", roles);

    const isAllowed = roles.some((role: string) =>
      roleRoutes[role as keyof typeof roleRoutes]?.some(
        (route: string) => path === route || path.startsWith(`${route}/`)
      )
    );

    if (!isAllowed) {
      console.log("User not authorized for this route, redirecting to home");
      return NextResponse.redirect(new URL("/home", request.url));
    }

    console.log("Access granted, proceeding");
    return NextResponse.next();
  } catch (error) {
    console.error("Error in middleware:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: [
    "/my-profile",
    "/home",
    "/statistics/:path*",
    "/user",
    "/drug/:path*",
    "/inventory-record/:path*",
    "/appointment",
    "/survey",
    "/health-check-result/:path*",
    "/prescription/:path*",
    "/treatment-plan/:path*",
    "/periodic-health-checkup",
    "/health-insurance/:path*",
    "/shift",
    "/schedule",
    "/notification",
    "/canteen-item",
    "/canteen-order",
    "/delivery-truck",
    "/schedule-appointment",
    "/my-assigned-appointment",
    "/my-appointment",
    "/my-submitted-survey",
    "/my-assigned-survey",
    "/my-health-check",
    "/my-periodic-checkup",
    "/my-health-insurance",
    "/my-schedule",
    "/settings",
    "/documentation",
  ],
};
