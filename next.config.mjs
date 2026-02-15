/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@notionhq/client'],
  devIndicators: {
    appIsrStatus: true,
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
};

export default nextConfig;
