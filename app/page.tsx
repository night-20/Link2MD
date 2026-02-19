
"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Download, Loader2, ArrowRight } from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!url) return;
    setIsLoading(true);
    setError('');
    setMarkdown('');
    setTitle('');

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '解析失败');
      }

      setMarkdown(data.content);
      setTitle(data.title || '文章');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    // You could add a toast here
    alert('Markdown 已复制到剪贴板！');
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[\\/:*?"<>|]/g, '_') || '文章'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen py-10 px-4 md:px-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#d97757]">Link2MD</h1>
          <p className="text-gray-500 font-medium tracking-wide">
            一键将网络文章转换为干净的 Markdown 格式。
          </p>
        </div>

        {/* Input Area */}
        <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="在此粘贴链接 (支持微信公众号, CSDN, 掘金, 牛客网)..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d97757]/20 focus:border-[#d97757] transition-all bg-white font-medium"
            disabled={isLoading}
          />
          <button
            onClick={handleParse}
            disabled={isLoading || !url}
            className="px-6 py-3 rounded-xl bg-[#d97757] text-white font-semibold shadow-md hover:bg-[#c56b4d] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                正在解析...
              </>
            ) : (
              <>
                开始转换
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 max-w-3xl mx-auto text-center font-medium">
            {error}
          </div>
        )}

        {/* Content Area */}
        {markdown && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[70vh]">
            {/* Editor / Source */}
            <div className="flex flex-col gap-2 h-full">
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Markdown 源码</span>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="p-2 text-gray-500 hover:text-[#d97757] transition-colors" title="复制到剪贴板">
                    <Copy className="w-5 h-5" />
                  </button>
                  <button onClick={handleDownload} className="p-2 text-gray-500 hover:text-[#d97757] transition-colors" title="下载 .md 文件">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="flex-1 w-full p-4 rounded-xl border border-gray-200 bg-white shadow-sm font-mono text-sm focus:outline-none focus:border-[#d97757] resize-none"
              />
            </div>

            {/* Preview */}
            <div className="flex flex-col gap-2 h-full">
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">预览</span>
              </div>
              <div className="flex-1 w-full p-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-y-auto prose prose-stone max-w-none prose-img:rounded-lg prose-headings:font-serif prose-a:text-[#d97757]">
                <ReactMarkdown>{markdown}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
