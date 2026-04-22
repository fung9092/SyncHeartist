const https = require('https');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env' });

async function debugOpenRouter() {
  console.log("=== 1. Testing OpenRouter Models ===");
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log("No OPENROUTER_API_KEY found.");
    return;
  }
  
  const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const models = JSON.parse(data).data;
          console.log(`Successfully fetched ${models.length} models from OpenRouter.`);
          
          // Let's find some free vision models or good fallback models
          const freeVisionModels = models.filter(m => m.id.includes('free') && (m.id.includes('vision') || m.architecture?.vision));
          console.log("\nFree Vision Models:");
          freeVisionModels.slice(0, 3).forEach(m => console.log(`- ${m.id}`));
          
          // Fallback good models
          const geminiModels = models.filter(m => m.id.includes('gemini-2.5-flash'));
          console.log("\nGemini Flash Models:");
          geminiModels.forEach(m => console.log(`- ${m.id}`));
          
          console.log("\nProposing to use 'google/gemini-2.5-flash' or 'google/gemini-2.5-flash:free'");
        } catch (e) {
          console.error("Failed to parse OpenRouter response:", e);
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      console.error("OpenRouter request failed:", e);
      resolve();
    });
    req.end();
  });
}

async function debugR2() {
  console.log("\n=== 2. Testing Cloudflare R2 ===");
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.log("Missing R2 configuration in .env.");
    return;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: 'debug-upload-test.txt',
    Body: 'This is a debug test.',
    ContentType: 'text/plain',
  });

  try {
    const res = await client.send(command);
    console.log("✅ Success! R2 Upload worked. HTTP Status:", res.$metadata.httpStatusCode);
  } catch (error) {
    console.error("❌ Failed to upload to R2:", error.name, error.message);
    console.error("If it says AccessDenied, it means the API Token generated does not have Object Read & Write permission or isn't applied to this bucket.");
  }
}

async function run() {
  await debugOpenRouter();
  await debugR2();
}

run();
