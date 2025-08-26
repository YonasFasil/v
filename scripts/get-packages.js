const { default: fetch } = require('node-fetch');

async function getPackages() {
  try {
    const response = await fetch('http://localhost:5006/api/public/packages');
    if (response.ok) {
      const packages = await response.json();
      console.log('📦 Available packages:');
      packages.forEach((pkg, idx) => {
        console.log(`${idx + 1}. ${pkg.name} (${pkg.id})`);
        console.log(`   Price: $${pkg.price}/${pkg.billingInterval}`);
        console.log(`   Features: ${pkg.features ? pkg.features.slice(0, 3).join(', ') + (pkg.features.length > 3 ? '...' : '') : 'None'}`);
        console.log('');
      });
      
      if (packages.length > 0) {
        console.log(`✅ Use package ID: ${packages[0].id} for testing`);
        return packages[0].id;
      }
    } else {
      console.log('❌ Failed to get packages:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  return null;
}

getPackages();