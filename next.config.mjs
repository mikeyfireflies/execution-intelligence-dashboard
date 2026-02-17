/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@notionhq/client'],
  turbopack: {
    root: '/Users/michaelglennbaybay/Fireflies.AI OS/execution-dashboard',
  },
  devIndicators: {
    appIsrStatus: true,
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
};

export default nextConfig;
