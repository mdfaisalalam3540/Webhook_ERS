// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite Configuration
 * Vite is a modern frontend build tool that provides fast development server and optimized builds
 * This configuration customizes the development server and build process
 */

// Export configuration function
export default defineConfig({
  // React plugin for JSX transformation and hot reload
  plugins: [
    react({
      // Enable Fast Refresh for better development experience
      fastRefresh: true,

      // Babel configuration for JSX
      babel: {
        plugins: [
          // You can add additional Babel plugins here if needed
        ],
      },
    }),
  ],

  // Development server configuration
  server: {
    port: 5173, // Development server port
    host: true, // Listen on all network interfaces
    open: true, // Automatically open browser when server starts

    // Proxy configuration for API calls (avoids CORS issues in development)
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Backend server
        changeOrigin: true,
        secure: false,
        // You can add rewrite rules if needed
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },

    // CORS configuration for development
    cors: true,

    // HTTPS configuration (optional)
    // https: {
    //   key: fs.readFileSync('path/to/key.pem'),
    //   cert: fs.readFileSync('path/to/cert.pem'),
    // },
  },

  // Preview server configuration (for testing production build)
  preview: {
    port: 4173,
    host: true,
  },

  // Build configuration
  build: {
    // Output directory for built files
    outDir: "dist",

    // Sourcemap generation (useful for debugging production builds)
    sourcemap: true,

    // Minification settings
    minify: "esbuild", // Uses esbuild for fast minification

    // Chunking strategy for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          "vendor-ui": ["lucide-react"],
          "vendor-utils": ["axios"],
        },

        // File naming strategy for better caching
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },

    // Bundle size warnings
    chunkSizeWarningLimit: 1000, // 1000KB

    // Asset handling
    assetsInlineLimit: 4096, // 4KB - files smaller than this will be inlined as base64
  },

  // Environment variables configuration
  define: {
    // Define global constants
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  // CSS configuration
  css: {
    // CSS modules configuration
    modules: {
      scopeBehaviour: "local", // or 'global'
    },

    // Preprocessor configuration (if using SASS/Less)
    preprocessorOptions: {
      // scss: {
      //   additionalData: `@import "./src/styles/variables.scss";`
      // }
    },

    // PostCSS configuration (if needed)
    // postcss: require('./postcss.config.js'),
  },

  // Resolve configuration
  resolve: {
    // Alias configuration for easier imports
    alias: {
      "@": "/src",
      "@components": "/src/components",
      "@pages": "/src/pages",
      "@utils": "/src/utils",
      "@assets": "/src/assets",
    },

    // File extensions to try when importing
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  },

  // Optimize dependencies configuration
  optimizeDeps: {
    // Include dependencies that should be pre-bundled
    include: ["react", "react-dom", "react-router-dom", "axios"],

    // Exclude dependencies from pre-bundling
    exclude: [],
  },

  // Logging level
  logLevel: "info", // 'info', 'warn', 'error', 'silent'

  // Environment mode
  mode: process.env.NODE_ENV || "development",
});

// Note: For TypeScript support, you would also need:
// - Install @vitejs/plugin-react with npm install -D @vitejs/plugin-react
// - Create a tsconfig.json file
// - Change file extensions from .jsx to .tsx
