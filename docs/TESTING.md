# Cycle de test n8n MCP

## Prérequis

1. Workflow créé (`create_workflow_from_code`)
2. **Toujours** `publish_workflow` avant de tester (sinon l'UI / MCP teste l'ancienne version)

## Étapes

```text
prepare_test_pin_data(workflowId)
  → générer pinData pour Schedule + Gmail (+ sources si besoin)
test_workflow(workflowId, pinData)
get_execution(workflowId, executionId, includeData=true)
```

## Scénarios de robustesse

| ID | Scénario | pinData | Attendu |
|----|----------|---------|---------|
| T1 | Happy path APIs réelles | Schedule + Gmail | IF true > 0, email préparé |
| T2 | Mix hot/cold contrôlé | 3 sources pinnées | 1 hot (score 90), 5 cold |
| T3 | Tous froids | titres sans keywords | IF true = 0, pas d'email |
| T4 | Sources vides | arrays `[]` | success, Merge skippé |
| T5 | Champs invalides | `points: "not-a-number"` | score fallback 30, pas de crash |

## Exemple pinData (T2)

```json
{
  "Every Day at 8am": [{ "json": { "timestamp": "2026-07-18T08:00:00.000Z" } }],
  "Hacker News": [{ "json": { "title": "OpenAI GPT LLM", "points": 200, "num_comments": 50, "objectID": "1", "url": "https://example.com" } }],
  "Google News RSS": [{ "json": { "title": "Local sports", "link": "https://news.google.com/x", "guid": "https://news.google.com/x" } }],
  "Lobste.rs": [{ "json": { "title": "Picnic", "guid": "https://lobste.rs/s/abc" } }],
  "Send Summary Email": [{ "json": { "id": "pin", "threadId": "t", "labelIds": ["SENT"] } }]
}
```

## Après correction

`update_workflow` → `publish_workflow` → `test_workflow` → `get_execution`
