import type { NextConfig } from 'next';

// GitLab Pages 部署时环境变量 GITLAB_CI 为 'true'
// 本地开发不会有这个变量，所以 basePath 只在 CI 构建时生效
const isGitLabPages = process.env.GITLAB_CI === 'true';

const nextConfig: NextConfig = {
  // 静态导出模式：生成纯 HTML/CSS/JS 文件到 out/ 目录
  // GitLab Pages 是静态托管，必须有此配置
  output: 'export',

  // GitLab Pages 子路径适配
  // 极狐 GitLab Pages 地址格式：https://用户名.jihulab.io/仓库名/
  // 需要把仓库名作为 basePath，否则静态资源路径全部 404
  ...(isGitLabPages && {
    basePath: '/Link2MD',
    assetPrefix: '/Link2MD/',
  }),

  // 静态导出时开启末尾斜杠，确保子路由能正确映射到对应 HTML 文件
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,
};

export default nextConfig;