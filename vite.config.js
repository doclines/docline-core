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
        // Serve AIGA Portal static build under /portal/* when available.
        if (req.url?.startsWith('/portal')) {
          let portalPath;
          try {
            portalPath = decodeURIComponent(req.url.split('?')[0]);
          } catch {
            res.statusCode = 400;
            res.end('Bad request');
            return;
          }
          if (portalPath.includes('\0')) {
            res.statusCode = 400;
            res.end('Bad request');
            return;
          }

          // /portal and /portal/ should resolve to portal index.
          const relPortalPath = portalPath === '/portal' || portalPath === '/portal/'
            ? 'index.html'
            : portalPath.replace(/^\/portal\/?/, '');
          const targetPath = resolveWithinRoot(portalBuildRoot, relPortalPath);

          if (targetPath && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
            const ext = path.extname(targetPath).toLowerCase();
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.end(fs.readFileSync(targetPath));
            return;
          }

          // If the portal root is requested and build exists, serve index fallback.
          const portalIndexPath = path.join(portalBuildRoot, 'index.html');
          if ((portalPath === '/portal' || portalPath === '/portal/') && fs.existsSync(portalIndexPath)) {
            res.setHeader('Content-Type', mimeTypes['.html']);
            res.end(fs.readFileSync(portalIndexPath, 'utf-8'));
            return;
          }
        }

        // Serve content files (md, mdx, images, etc.)
        if (req.url?.startsWith('/content/')) {
          let relPath;
          try {
            relPath = decodeURIComponent(req.url.replace('/content/', '').split('?')[0]);
          } catch {
            res.statusCode = 400;
            res.end('Bad request');
            return;
          }
          if (relPath.includes('\0')) {
            res.statusCode = 400;
            res.end('Bad request');
            return;
          }
          const relPathNoDocsPrefix = relPath.startsWith('docs/') ? relPath.slice(5) : relPath;
          // Try project root first (for introduction.mdx)
          // Then try docs/ folder (for files referenced without docs/ prefix)
          const candidates = [
            resolveWithinRoot(projectRoot, relPath),
            resolveWithinRoot(docsRoot, relPath),
            resolveWithinRoot(docsRoot, relPathNoDocsPrefix),
          ].filter(Boolean);
          for (const filePath of candidates) {
            if (fs.existsSync(filePath)) {
              const ext = path.extname(filePath).toLowerCase();
              const contentType = mimeTypes[ext] || 'application/octet-stream';
              res.setHeader('Content-Type', contentType);
              if (contentType.startsWith('image/') || contentType === 'application/pdf') {
                res.end(fs.readFileSync(filePath));
              } else {
                res.end(fs.readFileSync(filePath, 'utf-8'));
              }
              return;
            }
          }
          // Fallback for images: search docs/assets/ by filename.
          // This handles docs where relative image paths have an incorrect depth.
          const ext = path.extname(relPath).toLowerCase();
          if (ext && mimeTypes[ext]?.startsWith('image/')) {
            const filename = path.basename(relPath);
            const assetsFallback = path.join(docsRoot, 'assets', filename);
            if (fs.existsSync(assetsFallback)) {
              const contentType = mimeTypes[ext];
              res.setHeader('Content-Type', contentType);
              res.end(fs.readFileSync(assetsFallback));
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
          let rawImgPath;
          try {
            rawImgPath = decodeURIComponent(req.url.split('?')[0]);
          } catch {
            res.statusCode = 400;
            res.end('Bad request');
            return;
          }
          if (rawImgPath.includes('\0')) {
            res.statusCode = 400;
            res.end('Bad request');
            return;
          }
          const normalizedImgPath = rawImgPath.startsWith('/docs/')
            ? rawImgPath.slice('/docs/'.length)
            : rawImgPath.replace(/^\//, '');
          const imgPath = resolveWithinRoot(docsRoot, normalizedImgPath);
          if (imgPath && fs.existsSync(imgPath)) {
            const ext = path.extname(imgPath).toLowerCase();
            const contentType = mimeTypes[ext] || 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.end(fs.readFileSync(imgPath));
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
  // VITE_BASE_URL lets GitHub Actions set the correct sub-path for project repos
  // e.g. /my-repo/  — defaults to / for local dev and custom domains
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