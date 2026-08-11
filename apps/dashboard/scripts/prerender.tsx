import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LandingPage } from '../src/pages/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

async function prerender() {
  console.log('🚀 Starting SSG Prerendering for static pages...');

  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  const template = fs.readFileSync(indexPath, 'utf-8');

  // Define SSG pages and their corresponding React component
  const pages: Array<{ route: string; component: React.ReactNode; outPath: string }> = [
    {
      route: '/',
      component: <LandingPage />,
      outPath: path.join(distDir, 'index.html'),
    },
    {
      route: '/dashboard/login',
      component: null, // SPA Shell
      outPath: path.join(distDir, 'dashboard/login/index.html'),
    },
    {
      route: '/dashboard',
      component: null, // SPA Shell
      outPath: path.join(distDir, 'dashboard/index.html'),
    },
    {
      route: '/dashboard/key/list',
      component: null, // SPA Shell
      outPath: path.join(distDir, 'dashboard/key/list/index.html'),
    },
    {
      route: '/dashboard/key/generator',
      component: null, // SPA Shell
      outPath: path.join(distDir, 'dashboard/key/generator/index.html'),
    },
    {
      route: '/dashboard/interview',
      component: null, // SPA Shell
      outPath: path.join(distDir, 'dashboard/interview/index.html'),
    },
    {
      route: '/dashboard/interview/detail',
      component: null, // SPA Shell
      outPath: path.join(distDir, 'dashboard/interview/detail/index.html'),
    },
    {
      route: '/dashboard/settings/upstreams',
      component: null, // SPA Shell
      outPath: path.join(distDir, 'dashboard/settings/upstreams/index.html'),
    },
    {
      route: '/dashboard/settings/system',
      component: null, // SPA Shell
      outPath: path.join(distDir, 'dashboard/settings/system/index.html'),
    },
  ];

  for (const page of pages) {
    let htmlContent = template;

    if (page.component) {
      // 1. SSG: Render React component directly to static HTML string via ReactDOMServer
      const renderedMarkup = ReactDOMServer.renderToString(page.component);
      // Inject rendered HTML into <div id="root">
      htmlContent = htmlContent.replace('<div id="root"></div>', `<div id="root">${renderedMarkup}</div>`);
      console.log(`  ✓ SSG Prerendered: ${page.route} -> ${path.relative(distDir, page.outPath)}`);
    } else {
      // 2. SPA Shell: Preserve empty <div id="root"></div> for client-side React Router hydration
      console.log(`  ✓ SPA Shell Generated: ${page.route} -> ${path.relative(distDir, page.outPath)}`);
    }

    // Ensure target directory exists
    const dir = path.dirname(page.outPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(page.outPath, htmlContent, 'utf-8');
  }

  console.log('✨ SSG Prerendering and SPA Multi-Path shell generation complete!');
}

prerender().catch((err) => {
  console.error('❌ Prerender script failed:', err);
  process.exit(1);
});
