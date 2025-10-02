import { headers } from "next/headers";

export async function getClientInfo() {
  const headersList = headers();
  
  // Get IP address from various possible headers
  const xForwardedFor = (await headersList).get("x-forwarded-for");
  const xRealIp = (await headersList).get("x-real-ip");
  const cfConnectingIp = (await headersList).get("cf-connecting-ip");
  
  const ipAddress = xForwardedFor?.split(",")[0] || 
                   xRealIp || 
                   cfConnectingIp || 
                   "unknown";
  
  const userAgent = (await headersList).get("user-agent") || "unknown";
  
  return {
    ipAddress,
    userAgent,
  };
}

// For use in API routes where headers are available on the request
export function getClientInfoFromRequest(request: Request) {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  
  const ipAddress = xForwardedFor?.split(",")[0] || 
                   xRealIp || 
                   cfConnectingIp || 
                   "unknown";
  
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  return {
    ipAddress,
    userAgent,
  };
}