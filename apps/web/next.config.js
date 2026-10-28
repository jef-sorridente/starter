/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@app/shared", "@app/ui"],
  // Lint roda como etapa própria (`pnpm lint`, no CI e no pre-commit)
  // com a config compartilhada de @app/config — o `next build` não
  // precisa repetir.
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
};

module.exports = nextConfig;
