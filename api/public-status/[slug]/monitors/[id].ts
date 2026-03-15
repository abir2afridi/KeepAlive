import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, id } = req.query;

  try {
    // First verify the status page exists
    const { data: statusPage, error: statusError } = await supabase
      .from('status_pages')
      .select('id')
      .eq('slug', slug)
      .single();

    if (statusError || !statusPage) {
      return res.status(404).json({ error: 'Status page not found' });
    }

    // Get specific monitor for this status page
    const { data: monitor, error: monitorError } = await supabase
      .from('monitors')
      .select('*')
      .eq('id', id)
      .eq('status_page_id', statusPage.id)
      .single();

    if (monitorError || !monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    // Get recent pings for this monitor
    const { data: recentPings, error: pingsError } = await supabase
      .from('pings')
      .select('*')
      .eq('monitor_id', id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (pingsError) {
      console.error('Pings fetch error:', pingsError);
      // Don't fail the whole request if pings fail
    }

    return res.status(200).json({
      monitor,
      recent_pings: recentPings || []
    });
  } catch (error: any) {
    console.error('Public monitor details API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
