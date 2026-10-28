/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@app/shared", "@app/ui"],
  // Lint roda como etapa própria (`pnpm lint`, no CI e no pre-commit)
  // com a config compartilhada de @app/config — o `next build` não
  // precisa repetir (e o lint embutido do Next 14 não entende ESLint 9).
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
};

module.exports = nextConfig;
