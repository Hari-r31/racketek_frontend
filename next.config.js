/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL,
      // process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    NEXT_PUBLIC_RAZORPAY_KEY_ID:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  },
};

module.exports = nextConfig;
