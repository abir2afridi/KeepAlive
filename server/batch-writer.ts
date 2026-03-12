/**
 * Batch Writer — Flushes ping buffers from Redis → Supabase
 */
import { redisCache } from './redis-cache.js';
import { supabaseAdmin } from './supabase/server-client.js';

const FLUSH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_BATCH_SIZE = 500; // Supabase insert chunk size

/**
 * Flush all buffered ping results from Redis to Supabase.
 * Groups pings by monitor and writes them in chunks.
 */
async function flushPingBuffers() {
  try {
    const monitorIds = await redisCache.getBufferedMonitorIds();
    
    if (monitorIds.length === 0) return;
    
    console.log(`[BATCH] Flushing ping buffers for ${monitorIds.length} monitors...`);
    
    let totalWritten = 0;
    
    for (const monitorId of monitorIds) {
      const pings = await redisCache.drainPingBuffer(monitorId);
      
      if (pings.length === 0) continue;
      
      // Write pings in Supabase chunks
      for (let i = 0; i < pings.length; i += MAX_BATCH_SIZE) {
        const chunk = pings.slice(i, i + MAX_BATCH_SIZE);

        const rows = chunk.map((ping: any) => ({
          monitor_id: monitorId,
          status_code: ping.status_code ?? null,
          response_time: ping.response_time ?? null,
          is_up: Boolean(ping.is_up),
          created_at: ping.created_at,
        }));

        const { error } = await supabaseAdmin.from('ping_logs').insert(rows);
        if (error) {
          console.error(`[BATCH] Failed to insert pings for monitor ${monitorId}:`, error);
          break;
        }
        totalWritten += chunk.length;
      }
      
      // Update the monitor's latest status in Supabase (just 1 write per monitor)
      const latestPing = pings[pings.length - 1];
      const intervalSeconds = latestPing.interval_seconds || latestPing.interval || 60;
      
      try {
        const { error } = await supabaseAdmin
          .from('monitors')
          .update({
            last_pinged_at: latestPing.created_at,
            last_is_up: latestPing.is_up,
            last_response_time: latestPing.response_time,
            last_status_code: latestPing.status_code,
            last_error_message: latestPing.error_message || null,
            status: Boolean(latestPing.is_up) ? 'up' : 'down',
          })
          .eq('id', monitorId);
        if (error) {
          console.error(`[BATCH] Failed to update monitor ${monitorId}:`, error);
        }
      } catch (e: any) {
        console.error(`[BATCH] Failed to update monitor ${monitorId}:`, e.message);
      }
    }
    
    console.log(`[BATCH] ✅ Flushed ${totalWritten} pings for ${monitorIds.length} monitors.`);
  } catch (err) {
    console.error('[BATCH] ❌ Flush failed:', err);
  }
}

/**
 * Compute hourly aggregate statistics (optional).
 * Placeholder for future pre-aggregation into a separate table.
 */
async function computeHourlyStats() {
  try {
    // intentionally left minimal
  } catch (err) {
    console.error('[HOURLY] ❌ Stats computation failed:', err);
  }
}

/**
 * Clean up old raw ping logs (older than 48 hours) from Supabase.
 */
async function cleanOldPings() {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    // best-effort; avoid expensive deletes in dev
    await supabaseAdmin.from('ping_logs').delete().lt('created_at', cutoff);
  } catch (err) {
    console.error('[CLEANUP] ❌ Failed:', err);
  }
}

// ─── Start Batch Writer ────────────────────────────────────────────────────────

export function startBatchWriter() {
  console.log('[BATCH] 📝 Batch writer started (flushes every 5 min).');
  
  // Flush pings every 5 minutes
  setInterval(flushPingBuffers, FLUSH_INTERVAL);
  
  // Compute hourly stats at the top of each hour
  const msUntilNextHour = (60 - new Date().getMinutes()) * 60 * 1000;
  setTimeout(() => {
    computeHourlyStats(); // Run immediately at the hour
    setInterval(computeHourlyStats, 60 * 60 * 1000); // Then every hour
  }, msUntilNextHour);
  
  // Clean old pings every 12 hours
  setInterval(cleanOldPings, 12 * 60 * 60 * 1000);
  
  // Initial flush after 30 seconds (catch anything from before restart)
  setTimeout(flushPingBuffers, 30 * 1000);
}
