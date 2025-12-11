const OPENROUTER_KEY = "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";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function suggestContinuation(contextLines) {
  const prompt = buildPrompt(contextLines);
  const body = {
    model: "deepseek/deepseek-chat-v3-0324:free",
    messages: [
      {
        role: "system",
        content: "你是一名擅长中文 Galgame 对白的编剧助手，需要根据上下文续写 1 句自然的对白。只能返回一句纯文本对白，不要备注角色名，不要加入说明。"
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 80,
    temperature: 0.8,
    top_p: 0.9
  };
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + OPENROUTER_KEY
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      return null;
    }
    const json = await res.json();
    const choice = json.choices && json.choices[0];
    if (!choice) return null;
    const text = choice.message && choice.message.content;
    if (typeof text !== "string") return null;
    return text.trim();
  } catch (e) {
    return null;
  }
}

function buildPrompt(lines) {
  const joined = lines
    .slice(-6)
    .map(l => l.speakerName + "：" + l.text)
    .join("\n");
  return "以下是 Galgame 场景中的最近几句对白，请续写下一句自然的对白（不需要带角色名）：\n\n" + joined + "\n\n续写：";
}
