export async function enforceRLSTenantIsolation(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next();
  }

  const pool = getRLSPool();
  const client = await pool.connect();

  const cleanup = async () => {
    try {
      await client.query('RESET app.current_tenant');
      await client.query('RESET app.user_role');
    } catch (e) {
      // Ignore errors during cleanup
    }
    client.release();
    console.log('🔓 Released RLS tenant context connection');
  };

  res.on('finish', cleanup);
  res.on('close', cleanup);

  try {
    const tenantId = req.user.tenantId || req.tenant?.id || null;
    const userRole = req.user.role;

    console.log(`🔒 Setting RLS context: tenant=${tenantId || 'NULL'}, role=${userRole}`);

    if (tenantId) {
      await client.query('SET LOCAL app.current_tenant = $1', [tenantId]);
    } else {
      await client.query("SET LOCAL app.current_tenant = ''");
    }
    await client.query('SET LOCAL app.user_role = $1', [userRole]);

    (req as any).rlsClient = client;
    next();
  } catch (sessionError: any) {
    console.error('❌ Failed to set RLS session variables:', sessionError);
    cleanup();
    return res.status(500).json({ 
      error: 'Database tenant isolation setup failed',
      message: sessionError.message 
    });
  }
}