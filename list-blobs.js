const { list } = require('@vercel/blob');
require('dotenv').config({ path: '.env.development' });

async function main() {
  try {
    const { blobs } = await list({ prefix: 'test/' });
    console.log(JSON.stringify(blobs.map(b => b.url)));
  } catch (error) {
    console.error("Error listing blobs:", error);
  }
}

main();
