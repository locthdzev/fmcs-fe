import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from 'jsonwebtoken';

interface DecodedToken {
  email: string;
  roles: string[];
  exp: number;
  iat: number;
}

export function middleware(request: NextRequest) {
  // Get token from cookie
  const token = request.cookies.get("token");
  console.log("Middleware is running, token:", token);

  if (!token) {
    // If no token, redirect to login page
    console.log("No token found, redirecting to login page");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check if we're accessing the home page and need to redirect to role-specific home
  if (request.nextUrl.pathname === "/home") {
    try {
      // Decode token to get user roles
      const decoded = jwt.decode(token.value) as DecodedToken | null;
      
      if (decoded && decoded.roles) {
        // Redirect based on highest priority role
        if (decoded.roles.includes("Admin")) {
          return NextResponse.redirect(new URL("/home/admin", request.url));
        } else if (decoded.roles.includes("Manager")) {
          return NextResponse.redirect(new URL("/home/manager", request.url));
        } else if (decoded.roles.includes("Staff")) {
          return NextResponse.redirect(new URL("/home/staff", request.url));
        } else if (decoded.roles.includes("User")) {
          return NextResponse.redirect(new URL("/home/user", request.url));
        }
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      // Continue to default home page if there's an error
    }
  }

  // If there's token, proceed to next middleware
  console.log("Token found, proceeding to next middleware");
  return NextResponse.next();
}

export const config = {
  matcher: ["/home", "/dashboard", "/admin", "/user/me", "/settings", "/home/:path*"], // List of routes to protect
};
