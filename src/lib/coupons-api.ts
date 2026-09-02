import { readApiErrorMessage } from "@/lib/api-error";

export type CouponType = "PERCENT" | "FIXED_CENTS";

export type AdminCouponPlan = {
  id: string;
  slug: string;
  name: string;
};

export type AdminCouponRedemption = {
  id: string;
  createdAt: string;
  subscriptionId: string | null;
  user: { id: string; name: string | null; email: string } | null;
};

export type AdminCoupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  maxRedemptions: number | null;
  redeemedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  applicablePlans: AdminCouponPlan[];
  redemptions: AdminCouponRedemption[];
};

export type CouponPayload = {
  code: string;
  type: CouponType;
  value: number;
  maxRedemptions: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  planIds: string[];
};

export const ADMIN_COUPONS_QUERY_KEY = ["admin-coupons"] as const;

async function parseCoupon(res: Response, fallback: string): Promise<AdminCoupon> {
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, fallback));
  }
  return (await res.json()) as AdminCoupon;
}

export async function fetchAdminCoupons(): Promise<AdminCoupon[]> {
  const res = await fetch("/api/bff/admin/coupons", { credentials: "include" });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível carregar os cupons."),
    );
  }
  return (await res.json()) as AdminCoupon[];
}

export async function createAdminCoupon(
  dto: CouponPayload,
): Promise<AdminCoupon> {
  const res = await fetch("/api/bff/admin/coupons", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseCoupon(res, "Não foi possível criar o cupom.");
}

export async function updateAdminCoupon(
  id: string,
  dto: CouponPayload,
): Promise<AdminCoupon> {
  const res = await fetch(`/api/bff/admin/coupons/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseCoupon(res, "Não foi possível guardar o cupom.");
}

export async function deleteAdminCoupon(id: string): Promise<void> {
  const res = await fetch(`/api/bff/admin/coupons/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível apagar o cupom."),
    );
  }
}
