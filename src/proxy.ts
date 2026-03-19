import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE_NAME = "access_token";
const PUBLIC_ROUTES = ["/"] as const;

type CheckTokenResponse = {
  valid: boolean;
  user?: {
    permissions?: Record<string, string[]>;
  };
};

const isPathWithinRoute = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

const isPublicRoute = (pathname: string) =>
  PUBLIC_ROUTES.some((route) => isPathWithinRoute(pathname, route));

async function getSessionInfo(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  enabledRoutes: string[];
}> {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    return {
      isAuthenticated: false,
      enabledRoutes: [],
    };
  }

  try {
    const checkTokenUrl = new URL("/auth/check-token", request.url);
    const response = await fetch(checkTokenUrl, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        isAuthenticated: false,
        enabledRoutes: [],
      };
    }

    const data = (await response.json()) as CheckTokenResponse;
    const enabledRoutes = Object.keys(data.user?.permissions ?? {});

    return {
      isAuthenticated: true,
      enabledRoutes,
    };
  } catch {
    return {
      isAuthenticated: false,
      enabledRoutes: [],
    };
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    const sessionInfo = await getSessionInfo(request);

    if (sessionInfo.isAuthenticated) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  }

  const sessionInfo = await getSessionInfo(request);

  if (!sessionInfo.isAuthenticated) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const hasRouteAccess = sessionInfo.enabledRoutes.some((route) =>
    isPathWithinRoute(pathname, route),
  );

  if (!hasRouteAccess && !isPathWithinRoute(pathname, "/dashboard")) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|auth|areas|workplaces|employees|projects|reasons-for-request|personnel-requisitions|.*\\..*).*)",
  ],
};
