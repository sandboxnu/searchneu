/* eslint-disable */
const withPlugins = require('next-compose-plugins');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withPlugins(
  [
    [withBundleAnalyzer],
    // your other plugins here
  ],
  {
    webpack(config) {
      // Support svg import as react component
      config.module.rules.push({
        test: /\.svg$/,
        issuer: {
          test: /\.(js|ts)x?$/,
        },
        use: ['@svgr/webpack'],
      });

      config.module.rules.push({
        test: /\.ya?ml$/,
        use: 'js-yaml-loader',
      });

      return config;
    },
    async redirects() {
      return [
        {
          source: '/',
          destination: '/NEU',
          permanent: true,
        },
        // Temporary redirects for when our website is down (due to AWS migration)
        {
          source: '/NEU/:slug*',
          destination: '/down',
          permanent: false,
        },
        {
          source: '/CPS/:slug*',
          destination: '/down',
          permanent: false,
        },
        {
          source: '/LAW/:slug*',
          destination: '/down',
          permanent: false,
        },
      ];
    },
    async rewrites() {
      return [
        {
          source: '/sitemap.xml',
          destination: '/api/sitemap.xml',
        },
        {
          source: '/graphql',
          destination: 'https://api.searchneu.com',
        },
      ];
    },
  }
);
