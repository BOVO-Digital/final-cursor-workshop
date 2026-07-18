# Scoring rules

Base score: **30**

## Source boost
- HackerNews: no base boost (uses points/comments)
- GoogleNews: **+15**
- Lobsters: **+12**

## Keywords (+5 each)
ai, llm, gpt, rust, python, javascript, typescript, react, go, open source, startup, security, privacy, cloud, database, kernel, linux, performance, wasm, gpu, neural, deep learning, llama, openai, anthropic, claude, cursor, devtools

## Engagement (HN)
- points: `min(points/2, 20)`
- comments: `min(comments, 15)`

## Hot threshold
`isHot = score > 65`
