import { workflow, node, trigger, merge, ifElse, expr, newCredential } from '@n8n/workflow-sdk';

const schedule = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Every Day at 8am',
    parameters: {
      rule: {
        interval: [
          {
            field: 'days',
            daysInterval: 1,
            triggerAtHour: 8,
            triggerAtMinute: 0,
          },
        ],
      },
    },
  },
  output: [{}],
});

const hackerNews = node({
  type: 'n8n-nodes-base.hackerNews',
  version: 1,
  config: {
    name: 'Hacker News',
    parameters: {
      resource: 'all',
      operation: 'getAll',
      returnAll: false,
      limit: 30,
      additionalFields: {
        tags: ['front_page'],
      },
    },
    executeOnce: true,
  },
  output: [
    {
      objectID: '123',
      title: 'Example HN Story',
      url: 'https://example.com',
      author: 'user',
      created_at: '2025-01-01T08:00:00.000Z',
      num_comments: 42,
      points: 100,
    },
  ],
});

const googleNews = node({
  type: 'n8n-nodes-base.rssFeedRead',
  version: 1.2,
  config: {
    name: 'Google News RSS',
    parameters: {
      url: 'https://news.google.com/rss/search?q=technology+OR+AI+OR+software+when:1d&hl=en-US&gl=US&ceid=US:en',
    },
    executeOnce: true,
  },
  output: [{ title: 'Example News', link: 'https://news.google.com/rss/articles/abc', contentSnippet: 'Summary...', isoDate: '2025-01-01T08:00:00.000Z' }],
});

const lobsters = node({
  type: 'n8n-nodes-base.rssFeedRead',
  version: 1.2,
  config: {
    name: 'Lobste.rs',
    parameters: {
      url: 'https://lobste.rs/rss',
    },
    executeOnce: true,
  },
  output: [{ title: 'Example Lobsters', link: 'https://example.com', guid: 'https://lobste.rs/s/abc', contentSnippet: 'Summary...', isoDate: '2025-01-01T08:00:00.000Z' }],
});

const allArticles = merge({
  version: 3.2,
  config: {
    name: 'All Articles',
    parameters: {
      mode: 'append',
      numberInputs: 3,
    },
  },
});

const scoreArticles = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Score Articles',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const scored = items.map((item) => {\n  const title = String(item.json.title || '');\n  const url = String(item.json.url || item.json.link || '');\n  const link = String(item.json.link || item.json.url || '');\n  const guid = String(item.json.guid || '');\n  let source = 'RSS';\n  if (guid.includes('lobste.rs') || link.includes('lobste.rs')) source = 'Lobsters';\n  else if (link.includes('news.google.com') || guid.includes('news.google.com')) source = 'GoogleNews';\n  else if (item.json.objectID || item.json.points !== undefined) source = 'HackerNews';\n  let score = 30;\n  const keywords = ['ai','llm','gpt','rust','python','javascript','typescript','react','go','open source','startup','security','privacy','cloud','database','kernel','linux','performance','wasm','gpu','neural','deep learning','llama','openai','anthropic','claude','cursor','devtools'];\n  const lower = title.toLowerCase();\n  for (const kw of keywords) {\n    if (lower.includes(kw)) score += 5;\n  }\n  const points = Number(item.json.points);\n  const comments = Number(item.json.num_comments);\n  if (Number.isFinite(points) && points > 0) score += Math.min(points / 2, 20);\n  if (Number.isFinite(comments) && comments > 0) score += Math.min(comments, 15);\n  score = Math.min(Math.round(score), 100);\n  if (!Number.isFinite(score)) score = 30;\n  return {\n    json: {\n      title,\n      url,\n      source,\n      score,\n      isHot: score > 65,\n      author: String(item.json.author || item.json.creator || ''),\n      summary: String(item.json.contentSnippet || ''),\n      published: String(item.json.isoDate || item.json.created_at || ''),\n    },\n  };\n});\nreturn scored;",
    },
  },
  output: [{ title: 'Test Article', url: 'https://example.com', source: 'HackerNews', score: 75, isHot: true, author: 'user', summary: '...', published: '2025-01-01T08:00:00.000Z' }],
});

const filterHot = ifElse({
  version: 2.3,
  config: {
    name: 'Hot Score > 65?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            id: 'is-hot',
            leftValue: expr('{{ $json.isHot }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
        combinator: 'and',
      },
      looseTypeValidation: true,
    },
  },
});

const prepareEmail = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Email',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const articles = items.map(i => i.json);\nconst count = articles.length;\nconst date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });\nlet html = '<h2>Daily Tech Digest - ' + date + '</h2>';\nhtml += '<p><strong>' + count + '</strong> hot articles found (score > 65):</p><hr/>';\nfor (const a of articles) {\n  html += '<div>';\n  html += '<h3><a href=\"' + a.url + '\">' + a.title + '</a></h3>';\n  html += '<p>Source: <strong>' + a.source + '</strong> | Score: <strong>' + a.score + '/100</strong>';\n  if (a.author) html += ' | Author: ' + a.author;\n  html += '</p>';\n  if (a.summary) {\n    const snip = a.summary.substring(0, 200) + (a.summary.length > 200 ? '...' : '');\n    html += '<p>' + snip + '</p>';\n  }\n  html += '</div>';\n}\nhtml += '<hr/><p>Generated automatically by n8n veille tech workflow.</p>';\nreturn [{\n  json: {\n    sendTo: 'kpessou@yahoo.com',\n    subject: 'Daily Tech Digest - ' + date + ' (' + count + ' articles)',\n    message: html,\n  },\n}];",
    },
  },
  output: [{ sendTo: 'kpessou@yahoo.com', subject: 'Daily Tech Digest', message: '<h2>Digest</h2>' }],
});

const sendEmail = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send Summary Email',
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: expr('{{ $json.sendTo }}'),
      subject: expr('{{ $json.subject }}'),
      emailType: 'html',
      message: expr('{{ $json.message }}'),
    },
    credentials: {
      gmailOAuth2: newCredential('Gmail OAuth2'),
    },
    executeOnce: true,
  },
  output: [{ id: 'msg123', threadId: 'thread123' }],
});

export default workflow('veille-tech', 'Veille Tech Daily Digest')
  .add(schedule)
  .to(hackerNews.to(allArticles.input(0)))
  .add(schedule)
  .to(googleNews.to(allArticles.input(1)))
  .add(schedule)
  .to(lobsters.to(allArticles.input(2)))
  .add(allArticles)
  .to(scoreArticles)
  .to(filterHot
    .onTrue(prepareEmail.to(sendEmail))
  );
