import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const docsRoot = path.resolve(__dirname, '..', '..', 'docs');
const projectRoot = path.resolve(__dirname, '.');
const portalBuildRoot = path.resolve(__dirname, '..', 'aiga-portal-react', 'build');

function resolveWithinRoot(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  const rel = path.relative(resolvedRoot, resolvedPath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return null;
  }
  return resolvedPath;
}

function getRequestPath(req) {
  try {
    return decodeURIComponent((req.url || '').split('?')[0]);
  } catch {
    return null;
  }
}

function rejectBadRequest(res) {
  res.statusCode = 400;
  res.end('Bad request');
}

function isInvalidPath(value) {
  return !value || value.includes('\0');
}

function getMimeType(filePath, mimeTypes, fallback = 'application/octet-stream') {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || fallback;
}

function sendFile(res, filePath, mimeTypes, fallbackType = 'application/octet-stream') {
  const contentType = getMimeType(filePath, mimeTypes, fallbackType);
  res.setHeader('Content-Type', contentType);
  if (contentType.startsWith('image/') || contentType === 'application/pdf') {
    res.end(fs.readFileSync(filePath));
    return;
  }
  res.end(fs.readFileSync(filePath, 'utf-8'));
}

// Plugin to serve markdown/mdx content files and static assets
function serveContent() {
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.md': 'text/plain; charset=utf-8',
    '.mdx': 'text/plain; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
  };

  return {
    name: 'serve-content',
    configureServer(server) {
      // Register BEFORE Vite's internal middleware (no return wrapper)
      server.middlewares.use((req, res, next) => {
//  build under /portal/* when available.
        if (req.url?.startsWith('/portal')) {
          const portalPath = getRequestPath(req);
          if (isInvalidPath(portalPath)) {
            rejectBadRequest(res);
            return;
          }

          // /portal and /portal/ should resolve to portal index.
          const relPortalPath = portalPath === '/portal' || portalPath === '/portal/'
            ? 'index.html'
            : portalPath.replace(/^\/portal\/?/, '');
          const targetPath = resolveWithinRoot(portalBuildRoot, relPortalPath);

          if (targetPath && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
            sendFile(res, targetPath, mimeTypes);
            return;
          }
        }

        // Serve content files (md, mdx, images, etc.)
        if (req.url?.startsWith('/content/')) {
          const contentPath = getRequestPath(req);
          if (isInvalidPath(contentPath)) {
            rejectBadRequest(res);
            return;
          }
          const relPath = contentPath.replace('/content/', '');
          const relPathNoDocsPrefix = relPath.startsWith('docs/') ? relPath.slice(5) : relPath;
 
          const candidates = [
            resolveWithinRoot(projectRoot, relPath),
            resolveWithinRoot(docsRoot, relPath),
            resolveWithinRoot(docsRoot, relPathNoDocsPrefix),
          ].filter(Boolean);
          for (const filePath of candidates) {
            if (fs.existsSync(filePath)) {
              sendFile(res, filePath, mimeTypes);
              return;
            }
          }

          const ext = path.extname(relPath).toLowerCase();
          if (ext && mimeTypes[ext]?.startsWith('image/')) {
            const filename = path.basename(relPath);
            const assetsFallback = path.join(docsRoot, 'assets', filename);
            if (fs.existsSync(assetsFallback)) {
              sendFile(res, assetsFallback, mimeTypes);
              return;
            }
          }
          // File not found under /content/ — return 404 so DocPage can handle it
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        
        // Serve images directly from docs directory
        if (req.url?.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
          const rawImgPath = getRequestPath(req);
          if (isInvalidPath(rawImgPath)) {
            rejectBadRequest(res);
            return;
          }
          const normalizedImgPath = rawImgPath.startsWith('/docs/')
            ? rawImgPath.slice('/docs/'.length)
            : rawImgPath.replace(/^\//, '');
          const imgPath = resolveWithinRoot(docsRoot, normalizedImgPath);
          if (imgPath && fs.existsSync(imgPath)) {
            sendFile(res, imgPath, mimeTypes, 'image/jpeg');
            return;
          }
        }
        
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    serveContent(),
    react(),
  ],

  base: process.env.VITE_BASE_URL ?? '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  appType: 'spa',
  server: {
    port: 8003,
  },
});