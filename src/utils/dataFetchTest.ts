// Data Fetching Test Utility
import { supabase } from '../supabase/client';

export interface TestDataResult {
  testName: string;
  success: boolean;
  error?: string;
  data?: any;
  executionTime: number;
}

export class DataFetchTester {
  private static async runTest<T>(
    testName: string,
    testFn: () => Promise<T>
  ): Promise<TestDataResult> {
    const startTime = Date.now();
    try {
      const data = await testFn();
      const executionTime = Date.now() - startTime;
      return {
        testName,
        success: true,
        data,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        testName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime
      };
    }
  }

  static async testSupabaseConnection(): Promise<TestDataResult> {
    return this.runTest('Supabase Connection', async () => {
      const { data, error } = await supabase.from('users').select('count').single();
      if (error) throw error;
      return data;
    });
  }

  static async testUserSession(): Promise<TestDataResult> {
    return this.runTest('User Session', async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) throw new Error('No active session');
      return { userId: session.user.id, email: session.user.email };
    });
  }

  static async testUserRead(): Promise<TestDataResult> {
    return this.runTest('User Read Access', async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      if (!session) throw new Error('No active session');

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      return data;
    });
  }

  static async testMonitorsRead(): Promise<TestDataResult> {
    return this.runTest('Monitors Read Access', async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      if (!session) throw new Error('No active session');

      const { data, error } = await supabase
        .from('monitors')
        .select('*')
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      return { count: data.length, monitors: data };
    });
  }

  static async testPingsRead(): Promise<TestDataResult> {
    return this.runTest('Pings Read Access', async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      if (!session) throw new Error('No active session');

      // First get user's monitors
      const { data: monitors } = await supabase
        .from('monitors')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (!monitors || monitors.length === 0) {
        return { message: 'No monitors found for ping test' };
      }

      const { data, error } = await supabase
        .from('pings')
        .select('*')
        .eq('monitor_id', monitors[0].id)
        .limit(5);
      
      if (error) throw error;
      return { count: data.length, pings: data };
    });
  }

  static async testAlertChannelsRead(): Promise<TestDataResult> {
    return this.runTest('Alert Channels Read Access', async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      if (!session) throw new Error('No active session');

      const { data, error } = await supabase
        .from('alert_channels')
        .select('*')
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      return { count: data.length, channels: data };
    });
  }

  static async runAllTests(): Promise<TestDataResult[]> {
    const tests = [
      () => this.testSupabaseConnection(),
      () => this.testUserSession(),
      () => this.testUserRead(),
      () => this.testMonitorsRead(),
      () => this.testPingsRead(),
      () => this.testAlertChannelsRead()
    ];

    const results: TestDataResult[] = [];
    
    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
      } catch (error) {
        results.push({
          testName: 'Unknown Test',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          executionTime: 0
        });
      }
    }

    return results;
  }

  static generateTestReport(results: TestDataResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    let report = `=== Data Fetching Test Report ===\n`;
    report += `Total Tests: ${totalTests}\n`;
    report += `Passed: ${passedTests}\n`;
    report += `Failed: ${failedTests}\n`;
    report += `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;

    results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      report += `${status} ${result.testName} (${result.executionTime}ms)\n`;
      
      if (!result.success && result.error) {
        report += `   Error: ${result.error}\n`;
      }
      
      if (result.success && result.data) {
        if (typeof result.data === 'object' && result.data !== null) {
          if (Array.isArray(result.data)) {
            report += `   Data: Array with ${result.data.length} items\n`;
          } else if ('count' in result.data) {
            report += `   Data: Count = ${result.data.count}\n`;
          } else {
            report += `   Data: ${JSON.stringify(result.data).substring(0, 100)}...\n`;
          }
        } else {
          report += `   Data: ${result.data}\n`;
        }
      }
      report += '\n';
    });

    return report;
  }
}

// Export for use in browser console
declare global {
  interface Window {
    runDataFetchTests: () => Promise<TestDataResult[]>;
  }
}

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  window.runDataFetchTests = async (): Promise<TestDataResult[]> => {
    console.log('Running data fetching tests...');
    const results = await DataFetchTester.runAllTests();
    const report = DataFetchTester.generateTestReport(results);
    console.log(report);
    
    // Also store in localStorage for debugging
    localStorage.setItem('dataFetchTestResults', JSON.stringify(results));
    localStorage.setItem('dataFetchTestReport', report);
    
    return results;
  };
}
