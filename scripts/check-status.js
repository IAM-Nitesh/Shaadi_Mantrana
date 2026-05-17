#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Dynamically load .env if present at root
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

const RENDER_API_KEY = process.env.RENDER_API_KEY;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

if (!RENDER_API_KEY && !VERCEL_TOKEN) {
  console.log('⚠️ Warning: Neither RENDER_API_KEY nor VERCEL_TOKEN environment variables are set.');
  console.log('To run this status check, please set them in your environment, e.g.:');
  console.log('  export RENDER_API_KEY="your_render_api_key"');
  console.log('  export VERCEL_TOKEN="your_vercel_token"');
  console.log('Or add them to a local .env file at the project root.\n');
}

async function fetchRenderStatus() {
  console.log('\n🔮 Fetching Render Deployment Status...');
  if (!RENDER_API_KEY) {
    console.log('⚠️ Skipping Render status check: RENDER_API_KEY is not set.');
    return;
  }
  try {
    const servicesRes = await fetch('https://api.render.com/v1/services?limit=20', {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!servicesRes.ok) {
      throw new Error(`Failed to list services: ${servicesRes.status} ${servicesRes.statusText}`);
    }

    const services = await servicesRes.json();
    if (!services || services.length === 0) {
      console.log('⚠️ No Render services found.');
      return;
    }

    for (const item of services) {
      const service = item.service;
      console.log(`\n🖥️  Service: \x1b[36m${service.name}\x1b[0m (${service.type})`);
      console.log(`   URL: \x1b[4m${service.serviceDetails?.url || 'N/A'}\x1b[0m`);
      console.log(`   Repo: ${service.repo}`);

      // Fetch latest deploys
      const deploysRes = await fetch(`https://api.render.com/v1/services/${service.id}/deploys?limit=3`, {
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      if (deploysRes.ok) {
        const deploys = await deploysRes.json();
        if (deploys && deploys.length > 0) {
          console.log('   Deploys:');
          deploys.forEach((d, idx) => {
            const deploy = d.deploy;
            let statusColor = '\x1b[33m'; // Yellow
            if (deploy.status === 'live') statusColor = '\x1b[32m'; // Green
            if (deploy.status?.includes('failed')) statusColor = '\x1b[31m'; // Red

            console.log(`     ${idx + 1}. [${deploy.id.substring(0, 8)}] Status: ${statusColor}${deploy.status.toUpperCase()}\x1b[0m`);
            console.log(`        Triggered by: ${deploy.commit?.message || 'Manual/Hook'} (${deploy.commit?.id?.substring(0, 7) || 'N/A'})`);
            console.log(`        Updated: ${new Date(deploy.updatedAt).toLocaleString()}`);
          });
        } else {
          console.log('   No deployments found for this service.');
        }
      } else {
        console.log(`   ⚠️ Could not fetch deploys: ${deploysRes.statusText}`);
      }
    }
  } catch (err) {
    console.error(`❌ Render Error: ${err.message}`);
  }
}

async function fetchVercelStatus() {
  console.log('\n⚡ Fetching Vercel Deployment Status...');
  if (!VERCEL_TOKEN) {
    console.log('⚠️ Skipping Vercel status check: VERCEL_TOKEN is not set.');
    return;
  }
  try {
    const res = await fetch('https://api.vercel.com/v6/deployments?limit=5', {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to list deployments: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const deployments = data.deployments;

    if (!deployments || deployments.length === 0) {
      console.log('⚠️ No Vercel deployments found.');
      return;
    }

    deployments.forEach((d, idx) => {
      let statusColor = '\x1b[33m'; // Yellow
      if (d.state === 'READY') statusColor = '\x1b[32m'; // Green
      if (d.state === 'ERROR' || d.state === 'CANCELED') statusColor = '\x1b[31m'; // Red

      console.log(`\n📌 Project: \x1b[36m${d.name}\x1b[0m (Deployment #${idx + 1})`);
      console.log(`   URL: \x1b[4mhttps://${d.url}\x1b[0m`);
      console.log(`   State: ${statusColor}${d.state}\x1b[0m`);
      console.log(`   Creator: ${d.creator?.username}`);
      console.log(`   Commit: ${d.meta?.githubCommitMessage || 'N/A'} (${d.meta?.githubCommitSha?.substring(0, 7) || 'N/A'})`);
      console.log(`   Created: ${new Date(d.created).toLocaleString()}`);
    });
  } catch (err) {
    console.error(`❌ Vercel Error: ${err.message}`);
  }
}

async function main() {
  console.log('🚀 ========================================== 🚀');
  console.log('🔥   SHAADI MANTRANA BUILD WATCHDOG ACTIVATED   🔥');
  console.log('🚀 ========================================== 🚀');
  await fetchRenderStatus();
  console.log('\n----------------------------------------------');
  await fetchVercelStatus();
  console.log('\n🚀 ========================================== 🚀\n');
}

main();
