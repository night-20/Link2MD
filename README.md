# Link2MD

将任意网页文章一键转换为干净的 Markdown 格式，并内置多模型 AI 文章分析 Agent。

## 功能特性

- **网页转 Markdown**：输入 URL，自动爬取正文内容并转换为标准 Markdown
- **实时预览**：Markdown 编辑器与渲染预览双栏显示
- **一键复制 / 下载**：将转换结果直接复制到剪贴板或下载为 `.md` 文件
- **多平台适配**：目前仅支持微信公众号、CSDN、掘金、牛客平台内容
- **AI 文章分析 Agent**：侧边栏集成多模型 AI，对已爬取的 Markdown 进行专业分析

### 支持的 AI 提供商

| 提供商 | 模型 | 获取 API Key |
|--------|------|-------------|
| Google Gemini | 2.0 Flash / 2.0 Pro / 1.5 Pro | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| OpenAI | GPT-4o / GPT-4o mini / GPT-4 Turbo / o3-mini | [platform.openai.com](https://platform.openai.com/api-keys) |
| Anthropic Claude | 3.5 Sonnet / 3.5 Haiku / Opus 4.5 / Sonnet 4.5 | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| DeepSeek | V3 / R1 | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| 智谱 GLM | GLM-4-Flash（**免费**）/ GLM-4-Air / GLM-4 / GLM-4-Plus | [bigmodel.cn](https://bigmodel.cn/usercenter/apikeys) |

> API Key 仅在本地会话中使用，不会被存储或上传。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)

## 使用流程

1. 在主页输入框粘贴文章 URL，点击**转换**
2. 右侧实时预览转换结果，可编辑、复制或下载
3. 点击左上角 **☰** 打开 AI Agent 侧边栏
4. 选择 AI 提供商和模型，填写 API Key，点击**启动 Agent**
5. 点击**一键分析**，Agent 自动读取已爬取的 Markdown 进行深度分析

## 技术栈

- [Next.js 16](https://nextjs.org) — 全栈框架
- [Turndown](https://github.com/mixmark-io/turndown) — HTML → Markdown 转换
- [react-markdown](https://github.com/remarkjs/react-markdown) — Markdown 渲染
- [lucide-react](https://lucide.dev) — 图标库

## 部署

推荐使用 [Vercel](https://vercel.com) 一键部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
