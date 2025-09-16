const { put } = require('@vercel/blob');

module.exports = async (request, response) => {
  const { searchParams } = new URL(request.url, `https://${request.headers.host}`);
  const filename = searchParams.get('filename');

  if (!filename) {
    return response.status(400).json({ error: 'No filename provided.' });
  }

  try {
    const blob = await put(filename, request, {
      access: 'public',
      addRandomSuffix: true, // This is the definitive fix
    });

    return response.status(200).json(blob);
  } catch (error) {
    console.error('Upload error:', error);
    return response.status(500).json({ error: 'Failed to upload file.' });
  }
};