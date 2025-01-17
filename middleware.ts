import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Lấy token từ cookie
  const token = request.cookies.get('token');

  if (!token) {
    // Nếu không có token, chuyển hướng về trang login
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Nếu có token, tiếp tục xử lý request
  return NextResponse.next();
}

export const config = {
  matcher: ['/home', '/dashboard', '/admin', '/profile', '/settings'], // Danh sách các route cần bảo vệ
};
