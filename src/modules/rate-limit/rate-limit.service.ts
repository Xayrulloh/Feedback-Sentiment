import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import Redis from 'ioredis';
import {
  type HttpMethodType,
  type RateLimitRuleType,
  StoredRuleSchema,
  type StoredRuleType,
} from 'src/utils/zod.schemas';

@Injectable()
export class RateLimitService {
  private readonly redis: Redis;
  private readonly logger = new Logger(RateLimitService.name);

  private readonly RULES_IDX = 'rl:rules:index';

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'redis',
      port: +(process.env.REDIS_PORT ?? 6379),
    });
  }

  private ruleKey(endpoint: string, method?: string) {
    const ep =
      endpoint === '/' ? '/' : endpoint.split('?')[0].replace(/\/+$/, '');
    return `rl:rule:${(method ?? 'ALL').toUpperCase()}:${ep}`;
  }
  private cntKey(method: string, endpoint: string, subject: string) {
    return `rl:cnt:${method.toUpperCase()}:${endpoint}:${subject}`;
  }

  async upsertRule(rule: RateLimitRuleType): Promise<void> {
    if (rule.limit <= 0 || rule.windowSeconds <= 0) {
      throw new Error('limit and windowSeconds must be > 0');
    }
    const key = this.ruleKey(rule.endpoint, rule.method);
    await this.redis.hset(key, {
      endpoint: rule.endpoint,
      method: (rule.method ?? 'ALL').toUpperCase(),
      limit: String(rule.limit),
      windowSeconds: String(rule.windowSeconds),
    });
    await this.redis.sadd(this.RULES_IDX, key);
  }

  async deleteRule(endpoint: string, method?: string): Promise<void> {
    const key = this.ruleKey(endpoint, method);
    await this.redis.del(key);
    await this.redis.srem(this.RULES_IDX, key);
  }

  async listRules(): Promise<RateLimitRuleType[]> {
    const keys = await this.redis.smembers(this.RULES_IDX);
    if (!keys.length) return [];

    const multi = this.redis.multi();
    keys.forEach((k) => multi.hgetall(k));
    const res = await multi.exec();

    const rows = (res ?? [])
      .map(([, v]) => {
        const parsed = StoredRuleSchema.safeParse(v);
        return parsed.success ? parsed.data : null;
      })
      .filter(Boolean) as StoredRuleType[];

    return rows.map((r) => ({
      endpoint: r.endpoint,
      method: r.method as HttpMethodType,
      limit: Number(r.limit),
      windowSeconds: Number(r.windowSeconds),
    }));
  }

  async findRule(
    method: string,
    path: string,
  ): Promise<RateLimitRuleType | null> {
    const all = await this.listRules();
    const normalized = path.split('?')[0].replace(/\/+$/, '') || '/';
    const m = method.toUpperCase();

    const matches = all.filter((r) => {
      const rMethod = (r.method ?? 'ALL').toUpperCase();
      const ep = r.endpoint === '/' ? '/' : r.endpoint.replace(/\/+$/, '');
      const isPrefix = ep.endsWith('/*');
      const base = isPrefix ? ep.slice(0, -1) : ep;
      const endpointMatches = isPrefix
        ? normalized.startsWith(base.slice(0, -1))
        : normalized === ep;
      const methodMatches = rMethod === 'ALL' || rMethod === m;

      return endpointMatches && methodMatches;
    });

    if (!matches.length) return null;

    matches.sort((a, b) => b.endpoint.length - a.endpoint.length);

    return matches[0];
  }

  // ------- enforcement (fixed window) -------
  async enforce(rule: RateLimitRuleType, subject: string) {
    const methodTag = (rule.method ?? 'ALL').toUpperCase();
    const ep = rule.endpoint === '/' ? '/' : rule.endpoint.replace(/\/+$/, '');
    const key = this.cntKey(methodTag, ep, subject);

    const used = await this.redis.incr(key);
    if (used === 1) {
      await this.redis.expire(key, rule.windowSeconds);
    }

    const allowed = used <= rule.limit;
    const remaining = Math.max(0, rule.limit - used);

    if (used > rule.limit * 5) {
      this.logger.warn(
        `Suspicious rate: subject=${subject} ${methodTag} ${ep} used=${used}`,
      );
      //  emit WebSocket event if you have a gateway
    }

    return { allowed, used, remaining };
  }

  // this is for middleware
  // subjectFromReq(req: Request) {
  //   const anyReq = req as any;
  //   return anyReq.user?.id ?? req.ip ?? 'unknown';
  // }
  normalizePath(req: Request) {
    const u = req.originalUrl || req.url;
    return u.split('?')[0].replace(/\/+$/, '') || '/';
  }
}
