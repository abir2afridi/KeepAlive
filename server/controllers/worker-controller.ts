import crypto from 'crypto';
import { redisCache } from '../redis-cache.js';
import { PingerService } from '../services/pinger-service.js';
import { Monitor, MonitorStatus } from '../types/monitor.js';
import { decrypt } from '../crypto.js';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '../supabase/server-client.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withBackoff<T>(fn: () => Promise<T>, opts?: { label?: string; maxRetries?: number; baseDelayMs?: number }) {
  const label = opts?.label || 'op';
  const maxRetries = opts?.maxRetries ?? 4;
  const baseDelayMs = opts?.baseDelayMs ?? 300;

  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const delay = Math.min(5000, baseDelayMs * Math.pow(2, attempt));
      console.warn(`[WORKER] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass'
  }
});

export class WorkerController {
  static async processPing(monitor: Monitor) {
    const result = await PingerService.execute(monitor);
    
    // Status update object
    const statusUpdate: MonitorStatus = {
      id: monitor.id,
      last_is_up: result.isUp,
      last_response_time: result.responseTime,
      last_status_code: result.statusCode,
      last_error_message: result.errorMessage,
      last_pinged_at: new Date().toISOString()
    };

    // 1. Update Real-time Redis Status
    await redisCache.setMonitorStatus(monitor.id, statusUpdate);

    // 2. Buffer for Batch Write
    await redisCache.pushPingResult(monitor.id, {
      ...statusUpdate,
      created_at: statusUpdate.last_pinged_at,
      interval_seconds: (monitor as any).interval_seconds || (monitor as any).interval || 60
    });

    // 2b. Persist status and metadata to Supabase (don't block pipeline)
    try {
      const isUpBool = Boolean(statusUpdate.last_is_up);
      await withBackoff(
        () => supabaseAdmin
          .from('monitors')
          .update({
            last_is_up: isUpBool,
            last_pinged_at: statusUpdate.last_pinged_at,
            last_response_time: statusUpdate.last_response_time,
            last_status_code: statusUpdate.last_status_code,
            last_error_message: statusUpdate.last_error_message
          })
          .eq('id', monitor.id) as any,
        { label: 'update monitor metadata' }
      );
      
      // Also log to ping_logs
      await withBackoff(
        () => supabaseAdmin
          .from('ping_logs')
          .insert({
            monitor_id: monitor.id,
            status_code: statusUpdate.last_status_code,
            response_time: statusUpdate.last_response_time,
            is_up: isUpBool,
            created_at: statusUpdate.last_pinged_at,
          }) as any,
        { label: 'insert ping_logs' }
      );
    } catch (e) {
      console.warn('[WORKER] Supabase update failed (continuing):', e);
    }

    // 3. Failure Detection (3-Strike Rule)
    // We store failure count in Redis to stay stateless in workers
    const failKey = `fail_count:${monitor.id}`;
    let currentFails = parseInt(await redisCache.get(failKey) || '0');

    if (result.isUp === 0) {
      currentFails++;
      await redisCache.set(failKey, currentFails.toString(), 3600);
    } else {
      currentFails = 0;
      await redisCache.del(failKey);
    }

    // Determine finalized status
    const isDownConfirmed = currentFails >= 3;
    const isUpConfirmed = result.isUp === 1;

    // 4. Handle State Changes (Incidents & Alerts)
    const prevIsUp = monitor.last_is_up; // Last known status from DB

    if (isDownConfirmed && prevIsUp !== 0) {
      await this.handleDown(monitor, result);
    } else if (isUpConfirmed && prevIsUp === 0) {
      await this.handleUp(monitor, result);
    }
  }

  private static async handleDown(monitor: Monitor, result: any) {
    console.log(`[INCIDENT] Monitor ${monitor.id} is confirmed DOWN after 3 failures.`);
    
    // 1. Alerting
    await this.triggerAlerts(monitor, false, result.errorMessage);

    // 1b. Incident create (best-effort)
    try {
      await withBackoff(
        () => supabaseAdmin
          .from('incidents')
          .insert({
            project_id: (monitor as any).project_id ?? null,
            monitor_id: monitor.id,
            status: 'open',
            reason: result.errorMessage || monitor.last_error_message || null,
            started_at: new Date().toISOString(),
          }) as any,
        { label: 'insert incident' }
      );
    } catch (e) {
      console.warn('[INCIDENT] create failed (continuing):', e);
    }

    // 2. Database (Status update)
    try {
      await withBackoff(
        () => supabaseAdmin
          .from('monitors')
          .update({ status: 'down' })
          .eq('id', monitor.id) as any,
        { label: 'update monitor down' }
      );
      if ((monitor as any).user_id) await redisCache.clearUserMonitors((monitor as any).user_id);
    } catch (e) {
      console.error('[WORKER] Failed to notify monitor status (down):', e);
    }
  }

  private static async handleUp(monitor: Monitor, result: any) {
    console.log(`[RECOVERY] Monitor ${monitor.id} recovered.`);
    
    // 1. Alerting
    await this.triggerAlerts(monitor, true);

    // 1b. Incident resolve (best-effort)
    try {
      await withBackoff(
        () => supabaseAdmin
          .from('incidents')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('monitor_id', monitor.id)
          .eq('status', 'open') as any,
        { label: 'resolve incident' }
      );
    } catch (e) {
      console.warn('[INCIDENT] resolve failed (continuing):', e);
    }

    // 2. Database (Status update)
    try {
      await withBackoff(
        () => supabaseAdmin
          .from('monitors')
          .update({ status: 'up' })
          .eq('id', monitor.id) as any,
        { label: 'update monitor up' }
      );
      if ((monitor as any).user_id) await redisCache.clearUserMonitors((monitor as any).user_id);
    } catch (e) {
      console.error('[WORKER] Failed to update monitor status (up):', e);
    }
  }

  private static async triggerAlerts(monitor: Monitor, isUp: boolean, currentError?: string) {
    try {
      const { data: channels, error } = await supabaseAdmin
        .from('alert_channels')
        .select('*')
        .eq('monitor_id', monitor.id);
      if (error) throw error;
      const status = isUp ? 'RECOVERY' : 'DOWN';
      const errorText = currentError || monitor.last_error_message || 'N/A';
      const message = `🔔 ${status}: ${monitor.name} is ${isUp ? 'back online' : 'down'}.\nURL: ${monitor.url}\nError: ${errorText}`;

      for (const ch of (channels || [])) {
        try {
          const destination = ch.type === 'email' ? ch.target : decrypt(ch.target);
          if (ch.type === 'webhook') {
            await fetch(destination, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ content: message }) });
          } else if (ch.type === 'email') {
            await transporter.sendMail({ from: '"Uptime Monitor" <alerts@keepalive.io>', to: destination, subject: `[${status}] ${monitor.name}`, text: message });
          } else if (ch.type === 'slack') {
            await fetch(destination, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ text: message }) });
          } else if (ch.type === 'discord') {
            await fetch(destination, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ content: message }) });
          } else if (ch.type === 'telegram') {
             // Basic telegram bot integration if destination is "token:chatId"
             const [token, chatId] = destination.split(':');
             if (token && chatId) {
               await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { 
                 method: 'POST', 
                 headers: {'Content-Type': 'application/json'}, 
                 body: JSON.stringify({ chat_id: chatId, text: message }) 
               });
             }
          }
        } catch (e) {
          console.error(`[ALERT] Failed to send ${ch.type} alert:`, e);
        }
      }
    } catch (e) {
      console.error('[ALERT] Trigger error:', e);
    }
  }
}
