import { NextRequest } from 'next/server';

/**
 * 从请求中获取客户端 IP 地址
 * @param request Next.js 请求对象
 * @returns 客户端 IP 地址，如果无法获取则返回 'unknown'
 */
export function getClientIp(request: NextRequest): string {
  // 优先从 x-forwarded-for header 读取（可能包含多个 IP，取第一个）
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for 格式: "client, proxy1, proxy2"
    return forwardedFor.split(',')[0].trim();
  }

  // 回退到 x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // 最终回退到 'unknown'
  return 'unknown';
}
