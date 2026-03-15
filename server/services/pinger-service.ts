import net from 'net';
import tls from 'tls';
import { Monitor } from '../types/monitor.js';

export interface PingExecutionResult {
  isUp: number;
  statusCode: number | null;
  responseTime: number;
  errorMessage: string | null;
}

function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  const p1 = parseInt(parts[0]);
  const p2 = parseInt(parts[1]);
  if (p1 === 10 || p1 === 127) return true;
  if (p1 === 192 && p2 === 168) return true;
  if (p1 === 172 && p2 >= 16 && p2 <= 31) return true;
  if (p1 === 169 && p2 === 254) return true;
  return false;
}

export class PingerService {
  static async execute(monitor: Monitor): Promise<PingExecutionResult> {
    const start = Date.now();
    try {
      if (monitor.type === 'TCP') {
        return await this.pingTCP(monitor, start);
      } else if (monitor.type === 'SSL') {
        return await this.pingSSL(monitor, start);
      } else if (monitor.type === 'Supabase') {
        return await this.pingSupabase(monitor, start);
      } else {
        return await this.pingHTTP(monitor, start);
      }
    } catch (error: any) {
      return {
        isUp: 0,
        statusCode: null,
        responseTime: Date.now() - start,
        errorMessage: error.message || 'Unknown error'
      };
    }
  }

  private static async pingHTTP(monitor: Monitor, start: number): Promise<PingExecutionResult> {
    const url = new URL(monitor.url);
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && (url.hostname === 'localhost' || isPrivateIP(url.hostname))) {
      throw new Error('SSRF: Private IP not allowed in production');
    }

    let headers: Record<string, string> = {};
    if (monitor.headers) {
      try {
        const parsed = typeof monitor.headers === 'string' ? JSON.parse(monitor.headers) : monitor.headers;
        if (parsed && typeof parsed === 'object') {
          Object.assign(headers, parsed);
        }
      } catch {}
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(monitor.url, {
        method: monitor.method || 'GET',
        headers,
        body: (monitor.method !== 'GET' && monitor.method !== 'HEAD') ? monitor.body : undefined,
        signal: controller.signal
      });

      let expected = monitor.expected_status || 200;
      
      // For Supabase monitors, prioritize 200 but allow 201/204 as successful
      if (monitor.type === 'Supabase' && !monitor.expected_status) {
        expected = [200, 201, 204];
      }

      const isUp = Array.isArray(expected) 
        ? expected.includes(res.status) ? 1 : 0
        : res.status === expected ? 1 : 0;
      
      return {
        isUp,
        statusCode: res.status,
        responseTime: Date.now() - start,
        errorMessage: isUp ? null : `Status ${res.status} (Expected ${expected})`
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private static async pingTCP(monitor: Monitor, start: number): Promise<PingExecutionResult> {
    const url = new URL(monitor.url);
    const port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
    
    return new Promise((resolve) => {
      const socket = net.createConnection(port, url.hostname);
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve({
          isUp: 1,
          statusCode: 200,
          responseTime: Date.now() - start,
          errorMessage: null
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          isUp: 0,
          statusCode: null,
          responseTime: Date.now() - start,
          errorMessage: 'TCP Timeout'
        });
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({
          isUp: 0,
          statusCode: null,
          responseTime: Date.now() - start,
          errorMessage: err.message
        });
      });
    });
  }

  private static async pingSSL(monitor: Monitor, start: number): Promise<PingExecutionResult> {
    const url = new URL(monitor.url);
    const hostname = url.hostname;
    const port = parseInt(url.port) || 443;

    return new Promise((resolve) => {
      const socket = tls.connect(port, hostname, { servername: hostname }, () => {
        const cert = socket.getPeerCertificate();
        socket.destroy();

        if (!cert || !cert.valid_to) {
          resolve({ isUp: 0, statusCode: null, responseTime: Date.now() - start, errorMessage: 'No SSL Certificate found' });
          return;
        }

        const validTo = new Date(cert.valid_to).getTime();
        const daysRemaining = (validTo - Date.now()) / (1000 * 60 * 60 * 24);

        if (daysRemaining < 0) {
          resolve({ isUp: 0, statusCode: null, responseTime: Date.now() - start, errorMessage: 'SSL Certificate expired' });
        } else {
          resolve({ isUp: 1, statusCode: 200, responseTime: Date.now() - start, errorMessage: `SSL Valid (${Math.floor(daysRemaining)} days left)` });
        }
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({ isUp: 0, statusCode: null, responseTime: Date.now() - start, errorMessage: `SSL Error: ${err.message}` });
      });
      
      socket.setTimeout(5000, () => socket.destroy());
    });
  }

  private static async pingSupabase(monitor: Monitor, start: number): Promise<PingExecutionResult> {
    // Supabase keep-alive is usually just a lightweight HTTP GET or a Database call.
    // For this platform, we'll treat it as a lightweight HTTP ping to the project URL.
    return this.pingHTTP(monitor, start);
  }
}
