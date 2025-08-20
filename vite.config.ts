import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group vendor packages
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'vendor-forms';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            if (id.includes('wouter')) {
              return 'vendor-router';
            }
            return 'vendor-misc';
          }
          
          // Group feature chunks
          if (id.includes('/forms/') && (id.includes('modal') || id.includes('Modal'))) {
            return 'feature-modals';
          }
          if (id.includes('/dashboard/') || id.includes('dashboard.tsx')) {
            return 'feature-dashboard';
          }
          if (id.includes('super-admin') || id.includes('/admin/')) {
            return 'feature-admin';
          }
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1]?.split('.')[0];
            if (pageName && ['events', 'customers', 'venues', 'payments'].includes(pageName)) {
              return `page-${pageName}`;
            }
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js'
      }
    },
    chunkSizeWarningLimit: 500, // Warn for chunks > 500KB
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
