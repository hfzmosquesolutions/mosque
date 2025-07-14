import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Exclude the old directory from compilation
  webpack: (config, { isServer }) => {
    // Exclude the old project directory
    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: /Sistem Pengurusan Masjid Digital/,
    });

    // Optimize chunk splitting for better performance
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          layout: {
            test: /[\\/]src[\\/]components[\\/]layout[\\/]/,
            name: 'layout',
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
