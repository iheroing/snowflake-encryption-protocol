import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { snowflakeDevelopmentApi } from './dev/snowApiPlugin';

const TAILWIND_ENTRY = '/snowflake-tailwind.css';
const RESOLVED_TAILWIND_ENTRY = path.resolve(__dirname, '.snowflake-tailwind.css');

function snowflakeTailwindEntry(): Plugin {
  return {
    name: 'snowflake-tailwind-entry',
    enforce: 'pre',
    resolveId(id) {
      const [pathname, query] = id.split('?', 2);
      if (pathname === TAILWIND_ENTRY || pathname === RESOLVED_TAILWIND_ENTRY) {
        return query ? `${RESOLVED_TAILWIND_ENTRY}?${query}` : RESOLVED_TAILWIND_ENTRY;
      }
    },
    load(id) {
      if (id.split('?', 1)[0] !== RESOLVED_TAILWIND_ENTRY) return;

      return String.raw`
        @import "tailwindcss" source(none);
        @source "./index.html";
        @source "./index.tsx";
        @source "./App.tsx";
        @source "./components/AfterglowView.tsx";
        @source "./components/ComposeView.tsx";
        @source "./components/Icon.tsx";
        @source "./components/LandingView.tsx";
        @source "./components/LanguageToggleButton.tsx";
        @source "./components/ReceiveView.tsx";
        @source "./components/RevealView.tsx";
        @source "./components/ShareReadyView.tsx";
        @source "./components/SnowflakeGalleryView.tsx";
        @source "./components/SoundToggleButton.tsx";

        @theme {
          --color-primary: #38dafa;
          --color-background-dark: #090b11;
          --color-aurora-purple: #cb73fc;
          --color-aurora-emerald: #50fa7b;
          --color-aurora-blue: #8be9fd;
          --color-glacial: #d1dce3;
          --font-display: ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif;
          --font-serif: ui-serif, "Iowan Old Style", "Songti SC", STSong, "Times New Roman", serif;
          --font-noto: ui-serif, "Songti SC", STSong, serif;
        }

        @layer base {
          body {
            background-color: var(--color-background-dark);
            color: white;
            font-family: var(--font-display);
          }
        }

        @utility crystal-glow {
          box-shadow: 0 0 50px 10px rgb(56 218 250 / 15%);
        }

        @utility aurora-glow {
          background: radial-gradient(circle at center, rgb(80 250 123 / 15%) 0%, rgb(189 147 249 / 15%) 30%, rgb(139 233 253 / 10%) 60%, transparent 80%);
          filter: blur(60px);
        }

        @utility stardust-bg {
          background-image:
            radial-gradient(1px 1px at 20px 30px, #fff, transparent),
            radial-gradient(1px 1px at 40px 70px, #fff, transparent),
            radial-gradient(2px 2px at 50px 160px, #38dafa, transparent);
          background-repeat: repeat;
          background-size: 200px 200px;
        }

      `;
    },
  };
}

export default defineConfig({
  base: '/snowflake/',
  server: {
    port: 3000,
    host: '127.0.0.1',
    watch: {
      ignored: ['**/.vercel/**'],
    },
  },
  plugins: [snowflakeDevelopmentApi(), snowflakeTailwindEntry(), tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
