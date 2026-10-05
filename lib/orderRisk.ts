// [NEW FILE] ফাইলের পাথ: lib/orderRisk.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order, OrderRisk, OrderRiskFactor, OrderRiskLevel } from '@/types';

interface RiskRow {
  order_id: string;
  score: number;
  level: string;
  hard_limit: boolean | null;
  reasons: unknown;
  breakdown: unknown;
  ip_city: string | null;
  scored_at: string;
}

function asLevel(v: string): OrderRiskLevel {
  return v === 'green' || v === 'yellow' ? v : 'red';
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function asFactors(v: unknown): OrderRiskFactor[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (f): f is OrderRiskFactor =>
      !!f && typeof f === 'object' && typeof (f as OrderRiskFactor).key === 'string' && typeof (f as OrderRiskFactor).points === 'number'
  );
}

/**
 * অর্ডারগুলোর ট্রাস্ট স্কোর `order_risk` টেবিল থেকে এনে `order.risk`-এ বসায় (in-place)।
 * কখনো throw করে না — টেবিল না পাওয়া বা কুয়েরি ব্যর্থ হলে অর্ডার-লিস্ট আগের মতোই লোড হয়, শুধু ব্যাজ থাকে না।
 */
export async function attachOrderRisk(supabase: SupabaseClient, orders: Order[]): Promise<void> {
  try {
    const ids = orders.map((o) => o.id).filter(Boolean);
    if (ids.length === 0) return;
    const { data, error } = await supabase
      .from('order_risk')
      .select('order_id, score, level, hard_limit, reasons, breakdown, ip_city, scored_at')
      .in('order_id', ids);
    if (error || !data) return;
    const byId = new Map<string, OrderRisk>();
    for (const r of data as RiskRow[]) {
      byId.set(r.order_id, {
        score: Number(r.score) || 0,
        level: asLevel(r.level),
        hard_limit: !!r.hard_limit,
        reasons: asStringArray(r.reasons),
        breakdown: asFactors(r.breakdown),
        ip_city: r.ip_city || null,
        scored_at: r.scored_at,
      });
    }
    for (const o of orders) {
      const risk = byId.get(o.id);
      if (risk) o.risk = risk;
    }
  } catch {
    // ব্যাজ ছাড়াই চলবে
  }
}
