// Test simple connectivity
export default async function handler(req: any, res: any) {
  try {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'API is reachable',
      env_check: {
        has_qonto_slug: !!process.env.QONTO_SLUG,
        has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
