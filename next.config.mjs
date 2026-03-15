/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      'zod/v3': 'zod',
      'zod/v4-mini': 'zod-v4-mini',
      'zod/v4': 'zod-v4-mini',
    },
  },
  serverExternalPackages: ['@modelcontextprotocol/sdk'],
  webpack: (config, { isServer, webpack }) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^zod\/v3$/, 'zod'),
      new webpack.NormalModuleReplacementPlugin(/^zod\/v4-mini$/, 'zod-v4-mini'),
      new webpack.NormalModuleReplacementPlugin(/^zod\/v4$/, 'zod-v4-mini')
    );
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'zod/v3': false,
        'zod/v4-mini': false,
        'zod/v4': false,
      };
    }
    return config;
  },
};

export default nextConfig;