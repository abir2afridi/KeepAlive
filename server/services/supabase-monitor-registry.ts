import { supabaseAdmin } from '../supabase/server-client.js';

export type MonitorRow = {
  id: string;
  user_id: string;
  name: string;
  url: string;
  type: string;
  interval_seconds: number;
  status?: string | null;
  created_at?: string;
  last_pinged_at?: string | null;
  last_is_up?: number | boolean | null;
  last_response_time?: number | null;
  last_status_code?: number | null;
  last_error_message?: string | null;
};

class SupabaseMonitorRegistry {
  private monitors: MonitorRow[] = [];
  private started = false;
  private refreshInFlight: Promise<void> | null = null;

  private lastRefreshAt = 0;
  private backoffMs = 0;

  start() {
    if (this.started) return;
    this.started = true;

    const refreshLoop = async () => {
      try {
        await this.refresh();
      } catch {
        // refresh() already logs
      }
    };

    // Initial refresh (best-effort)
    refreshLoop();

    // Refresh every 60s
    setInterval(refreshLoop, 60_000).unref?.();
  }

  getAll() {
    return this.monitors;
  }

  touchLastPingedAt(monitorId: string, iso: string) {
    const idx = this.monitors.findIndex(m => m.id === monitorId);
    if (idx >= 0) {
      this.monitors[idx] = { ...this.monitors[idx], last_pinged_at: iso };
    }
  }

  async refresh() {
    if (this.refreshInFlight) return this.refreshInFlight;

    const now = Date.now();
    if (this.backoffMs > 0 && now - this.lastRefreshAt < this.backoffMs) {
      return;
    }

    this.refreshInFlight = (async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('monitors')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        this.monitors = (data || []) as MonitorRow[];
        this.lastRefreshAt = Date.now();
        this.backoffMs = 0;
        console.log(`[REGISTRY] ✅ Loaded monitors: ${this.monitors.length}`);
      } catch (err: any) {
        this.lastRefreshAt = Date.now();
        // exponential backoff up to 5 minutes
        this.backoffMs = this.backoffMs ? Math.min(this.backoffMs * 2, 300_000) : 15_000;
        console.warn(`[REGISTRY] ⚠️ Monitor refresh failed. Backing off for ${Math.round(this.backoffMs / 1000)}s`, err);
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }
}

export const MonitorRegistry = new SupabaseMonitorRegistry();
