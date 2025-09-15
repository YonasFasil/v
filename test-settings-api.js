const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testSettingsAPI() {
  try {
    const tenantResult = await pool.query("SELECT id FROM tenants LIMIT 1");
    const tenantId = tenantResult.rows[0].id;

    // Clear existing settings
    await pool.query("DELETE FROM settings WHERE tenant_id = $1", [tenantId]);

    // Insert test nested settings data as if coming from the frontend
    const testSettingsData = {
      business: {
        companyName: "Test Venue Company",
        companyEmail: "test@venue.com",
        timezone: "America/New_York",
        currency: "USD"
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false
      }
    };

    // Simulate what the API does - flatten the object
    const flattenObject = (obj, prefix = "") => {
      const flattened = {};
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          Object.assign(flattened, flattenObject(value, newKey));
        } else {
          flattened[newKey] = typeof value === "object" ? JSON.stringify(value) : value;
        }
      }
      return flattened;
    };

    const flattenedData = flattenObject(testSettingsData);
    console.log("Flattened data:", flattenedData);

    // Insert the flattened data
    for (const [key, value] of Object.entries(flattenedData)) {
      await pool.query(`
        INSERT INTO settings (tenant_id, key, value)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id, key)
        DO UPDATE SET value = $3
      `, [tenantId, key, value]);
    }

    // Now test reading back
    const settings = await pool.query("SELECT * FROM settings WHERE tenant_id = $1", [tenantId]);
    console.log("Stored settings:", settings.rows);

    // Test the unflatten function
    const unflattenObject = (obj) => {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        const keys = key.split(".");
        let current = result;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!(keys[i] in current)) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        try {
          current[keys[keys.length - 1]] = JSON.parse(value);
        } catch {
          current[keys[keys.length - 1]] = value;
        }
      }
      return result;
    };

    const flatSettings = {};
    settings.rows.forEach(setting => {
      flatSettings[setting.key] = setting.value;
    });

    const reconstructed = unflattenObject(flatSettings);
    console.log("Reconstructed settings:", JSON.stringify(reconstructed, null, 2));

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

testSettingsAPI();
