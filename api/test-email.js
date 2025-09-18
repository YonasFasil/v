export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Simple test without nodemailer first
    console.log('Test email endpoint called');
    console.log('Method:', req.method);
    console.log('Body:', req.body);

    const { testEmail } = req.body || {};

    // Check environment variables
    const provider = process.env.GLOBAL_EMAIL_PROVIDER;
    const email = process.env.GLOBAL_EMAIL_ADDRESS;
    const password = process.env.GLOBAL_EMAIL_PASSWORD;

    console.log('Environment check:', {
      hasProvider: !!provider,
      hasEmail: !!email,
      hasPassword: !!password
    });

    return res.status(200).json({
      success: true,
      message: 'Email test endpoint is working',
      testEmail: testEmail || 'No email provided',
      config: {
        provider: provider || 'Not set',
        email: email || 'Not set',
        passwordSet: !!password
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
}