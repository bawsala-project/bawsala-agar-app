import { describe, it, expect, vi, beforeEach } from "vitest";

const signInWithOtp = vi.fn();
const rpc = vi.fn();

vi.mock("next/headers", () => ({
  headers: () => new Headers({ origin: "https://bawsala.test" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { signInWithOtp }, rpc }),
}));

import { signInWithOtpAction } from "@/actions/auth";
import { linkGuestCasesToUser } from "@/lib/auth/link";

describe("signInWithOtpAction", () => {
  beforeEach(() => {
    signInWithOtp.mockReset();
  });

  it("rejects an invalid email without calling Supabase", async () => {
    const result = await signInWithOtpAction("not-an-email");

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("sends the link with a callback that returns to the current flow", async () => {
    signInWithOtp.mockResolvedValue({ error: null });

    const result = await signInWithOtpAction("buyer@example.com", "/case/abc/checkout");

    expect(result).toEqual({ success: true });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "buyer@example.com",
      options: {
        emailRedirectTo: "https://bawsala.test/auth/callback?next=%2Fcase%2Fabc%2Fcheckout",
      },
    });
  });

  it("falls back to the dashboard for unsafe next paths", async () => {
    signInWithOtp.mockResolvedValue({ error: null });

    await signInWithOtpAction("buyer@example.com", "//evil.example.com");

    expect(signInWithOtp.mock.calls[0][0].options.emailRedirectTo).toContain("next=%2Fdashboard");
  });

  it("returns an Arabic error when sending fails", async () => {
    signInWithOtp.mockResolvedValue({ error: new Error("rate limited") });

    const result = await signInWithOtpAction("buyer@example.com");

    expect(result.success).toBe(false);
    expect(result.error).toBe("تعذر إرسال رابط الدخول. حاول مرة أخرى.");
  });
});

describe("linkGuestCasesToUser", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("returns the number of linked cases", async () => {
    rpc.mockResolvedValue({ data: 2, error: null });

    const result = await linkGuestCasesToUser("user-permanent");

    expect(rpc).toHaveBeenCalledWith("link_guest_cases_to_user", { target_user_id: "user-permanent" });
    expect(result).toEqual({ linked: 2 });
  });

  it("surfaces database errors without claiming any link", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Only guest sessions can be linked" } });

    const result = await linkGuestCasesToUser("user-permanent");

    expect(result).toEqual({ linked: 0, error: "Only guest sessions can be linked" });
  });
});
