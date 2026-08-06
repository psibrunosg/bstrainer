import { describe, it, expect, vi, beforeEach } from "vitest";
import { getClientExceptionAlerts } from "./trainer-alerts";
import * as clientsMod from "./clients";
import * as sessionsMod from "./sessions";
import * as supabaseMod from "../supabase/client";

vi.mock("./clients");
vi.mock("./sessions");
vi.mock("../supabase/client");

describe("getClientExceptionAlerts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns demo alerts when no active clients or real exceptions exist", async () => {
    vi.spyOn(clientsMod, "listClientLinks").mockResolvedValue([]);
    
    const result = await getClientExceptionAlerts();
    expect(result.isDemo).toBe(true);
    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.alerts[0]!.type).toBe("inactive");
  });

  it("detects critical inactivity (>3 days or never trained) for active client", async () => {
    vi.spyOn(clientsMod, "listClientLinks").mockResolvedValue([
      { id: "1", status: "active", client_id: "client-a", name: "Ana Souza", invite_email: "ana@test.com" },
    ]);
    vi.spyOn(sessionsMod, "loadSessions").mockResolvedValue([]);
    
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    } as any;
    vi.spyOn(supabaseMod, "createClient").mockReturnValue(mockSupabase);

    const result = await getClientExceptionAlerts();
    expect(result.isDemo).toBe(false);
    
    const inactiveAlert = result.alerts.find((a) => a.type === "inactive");
    expect(inactiveAlert).toBeDefined();
    expect(inactiveAlert?.title).toContain("Ausência Crítica");
    expect(inactiveAlert?.severity).toBe("high");
  });
});
