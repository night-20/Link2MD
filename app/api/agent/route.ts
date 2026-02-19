import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an expert academic and content analyst with deep knowledge across multiple disciplines, including but not limited to social sciences, natural sciences, technology, economics, medicine, and humanities. Your role is to provide rigorous, professional, and balanced analyses of academic papers, articles, reports, and other long-form written content submitted by the user.

## Core Responsibilities

When presented with a piece of content, you will:

1. **Understand the user's analytical intent.** If the user specifies a particular angle or focus (e.g., methodology, argument structure, practical implications, ideological bias), prioritize that perspective in your analysis. If no specific focus is given, perform a comprehensive general analysis.

2. **Provide a structured professional analysis** that covers the following dimensions as applicable:
   - **Overview**: Summarize the core thesis, purpose, and scope of the content in a concise and precise manner.
   - **Strengths**: Identify what the content does well. This may include rigor of argumentation, quality of evidence, clarity of structure, originality of insight, practical value, methodological soundness, or contribution to the field.
   - **Weaknesses & Limitations**: Critically evaluate what the content lacks or gets wrong. This may include logical fallacies, insufficient evidence, methodological flaws, overgeneralization, lack of nuance, potential bias, outdated references, or gaps in literature review.
   - **Credibility Assessment**: Where possible, evaluate the reliability of sources cited, the author's apparent expertise, and whether the conclusions are proportionate to the evidence presented.
   - **Contextual Significance**: Place the content in its broader context — explain its relevance to current debates, its potential impact, or its position relative to existing knowledge in the field.
   - **Practical Takeaways** (if applicable): Highlight any actionable insights or recommendations the content offers, and assess their feasibility.

3. **Maintain intellectual objectivity.** Your analysis should be grounded in evidence and reasoning, not personal preference. Acknowledge complexity where it exists and avoid reductive judgments.

4. **Calibrate depth to content type.** A peer-reviewed scientific paper warrants a more technical and rigorous analysis than a general-interest magazine article. Adjust your analytical lens accordingly.

## Output Requirements

- **All responses must be written in Chinese (Simplified Chinese)**, regardless of the language of the source material.
- Use a clear, professional, and readable writing style appropriate for an academic or business audience.
- Structure your output with clear section headings for easy navigation.
- Avoid unnecessary filler or hedging language. Be direct and substantive.
- If the content provided is too brief, too vague, or lacks sufficient information for a thorough analysis, ask the user for clarification or additional material before proceeding.

## Interaction Style

You may ask the user one focused clarifying question if the analytical scope is ambiguous, but do not delay unnecessarily — default to a comprehensive analysis if no specific instruction is given. Always be responsive to follow-up questions and willing to revisit or expand on any section of your analysis upon request.`;

// ─── Provider Call Functions ──────────────────────────────────────────────────

async function callGemini(apiKey: string, userMessage: string, model: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json();
        const msg = err?.error?.message || '调用 Gemini API 失败';
        if (res.status === 400 || res.status === 403) throw new Error(`API Key 无效或无权限：${msg}`);
        throw new Error(msg);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '（无返回内容）';
}

// OpenAI-compatible: supports OpenAI, DeepSeek (both use the same API format)
async function callOpenAICompat(apiKey: string, userMessage: string, model: string, baseUrl: string): Promise<string> {
    // Node.js fetch (undici) only allows ASCII characters in header values.
    // Validate the key early to give a clear error message.
    // eslint-disable-next-line no-control-regex
    if (/[^\x00-\x7F]/.test(apiKey)) {
        throw new Error('API Key 包含非法字符，请检查是否误输入了中文或特殊符号');
    }
    const url = `${baseUrl}/chat/completions`;
    const payload = {
        model,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 4096,
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json();
        const msg = err?.error?.message || `调用 API 失败 (${baseUrl})`;
        if (res.status === 401) throw new Error(`API Key 无效：${msg}`);
        if (res.status === 429) throw new Error('请求频率过高或余额不足，请稍后重试');
        throw new Error(msg);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '（无返回内容）';
}

async function callClaude(apiKey: string, userMessage: string, model: string): Promise<string> {
    const url = 'https://api.anthropic.com/v1/messages';
    const payload = {
        model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json();
        const msg = err?.error?.message || '调用 Claude API 失败';
        if (res.status === 401) throw new Error(`API Key 无效：${msg}`);
        if (res.status === 429) throw new Error('请求频率过高或余额不足，请稍后重试');
        throw new Error(msg);
    }
    const data = await res.json();
    return data?.content?.[0]?.text || '（无返回内容）';
}

// GLM uses its own endpoint but also supports the OpenAI-compatible format
async function callGLM(apiKey: string, userMessage: string, model: string): Promise<string> {
    // 智谱 AI supports OpenAI-compatible API at api.bigmodel.cn
    return callOpenAICompat(apiKey, userMessage, model, 'https://open.bigmodel.cn/api/paas/v4');
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const { apiKey, provider, model, message, articleContent } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: '请先填写 API Key' }, { status: 401 });
        }
        if (!provider) {
            return NextResponse.json({ error: '请选择 AI 提供商' }, { status: 400 });
        }
        if (!message) {
            return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
        }

        // Build user message with article context if available
        let userMessage = message;
        if (articleContent) {
            userMessage = `以下是需要分析的文章内容：\n\n---\n${articleContent}\n---\n\n用户问题：${message}`;
        }

        let reply = '';
        switch (provider) {
            case 'gemini':
                reply = await callGemini(apiKey, userMessage, model || 'gemini-2.0-flash');
                break;
            case 'openai':
                reply = await callOpenAICompat(apiKey, userMessage, model || 'gpt-4o', 'https://api.openai.com/v1');
                break;
            case 'claude':
                reply = await callClaude(apiKey, userMessage, model || 'claude-3-5-sonnet-20241022');
                break;
            case 'deepseek':
                reply = await callOpenAICompat(apiKey, userMessage, model || 'deepseek-chat', 'https://api.deepseek.com/v1');
                break;
            case 'glm':
                reply = await callGLM(apiKey, userMessage, model || 'glm-4-flash');
                break;
            default:
                return NextResponse.json({ error: `不支持的提供商：${provider}` }, { status: 400 });
        }

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error('Agent API error:', error);
        return NextResponse.json(
            { error: error.message || '服务出现错误，请稍后重试' },
            { status: 500 }
        );
    }
}
