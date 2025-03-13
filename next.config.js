/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['rc-util', '@ant-design/icons-svg', '@ant-design/icons', 'antd', 'rc-picker', 'rc-tree', 'rc-table'],
}

module.exports = nextConfig
