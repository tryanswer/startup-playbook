interface RateLimitConfig {
  windowMs: number;      // 时间窗口（毫秒）
  maxRequests: number;   // 窗口内最大请求数
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// 存储每个 identifier 的请求时间戳
const requestLog = new Map<string, number[]>();

// 每 60 秒清理过期条目防止内存泄漏
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of requestLog.entries()) {
    // 保留最近 5 分钟内的记录（足够覆盖所有可能的窗口）
    const recentTimestamps = timestamps.filter(ts => now - ts < 5 * 60 * 1000);
    if (recentTimestamps.length === 0) {
      requestLog.delete(key);
    } else {
      requestLog.set(key, recentTimestamps);
    }
  }
}, 60 * 1000);

export function createRateLimiter(config: RateLimitConfig): (identifier: string) => RateLimitResult {
  return function checkRateLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // 获取该 identifier 的请求历史
    let timestamps = requestLog.get(identifier) || [];

    // 过滤出当前窗口内的请求
    timestamps = timestamps.filter(ts => ts > windowStart);

    // 检查是否超过限制
    const allowed = timestamps.length < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - timestamps.length);

    // 计算重置时间（窗口结束时间）
    const resetAt = timestamps.length > 0 
      ? timestamps[0] + config.windowMs 
      : now + config.windowMs;

    // 如果允许，记录当前请求
    if (allowed) {
      timestamps.push(now);
      requestLog.set(identifier, timestamps);
    }

    return {
      allowed,
      remaining,
      resetAt,
    };
  };
}

// 预配置的速率限制器
// 验证是重操作：10 requests per 60 seconds
export const validateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
});

// 聊天频率更高：30 requests per 60 seconds
export const agentLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
});
