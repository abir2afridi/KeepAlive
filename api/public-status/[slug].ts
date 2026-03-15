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

  const { slug } = req.query;

  try {
    // Get status page by slug
    const { data: statusPage, error: statusError } = await supabase
      .from('status_pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (statusError || !statusPage) {
      return res.status(404).json({ error: 'Status page not found' });
    }

    // Get monitors for this status page
    const { data: monitors, error: monitorsError } = await supabase
      .from('monitors')
      .select('*')
      .eq('status_page_id', statusPage.id)
      .order('name', { ascending: true });

    if (monitorsError) {
      console.error('Monitors fetch error:', monitorsError);
      return res.status(500).json({ error: 'Failed to fetch monitors' });
    }

    return res.status(200).json({
      status_page: statusPage,
      monitors: monitors || []
    });
  } catch (error: any) {
    console.error('Public status API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
