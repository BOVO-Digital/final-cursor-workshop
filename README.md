# final-cursor-workshop

Workshop **Cursor + n8n MCP** — créer, tester et maintenir des workflows sans quitter Cursor.

## Veille Tech Daily Digest

Workflow n8n quotidien (8h) qui agrège :

1. **Hacker News** (front page)
2. **Google News RSS** (tech / AI / software)
3. **Lobste.rs** RSS

Puis merge → heat score → filtre `score > 65` → résumé Gmail.

Fichier source SDK : [`veille-tech-workflow.ts`](./veille-tech-workflow.ts)

Workflow publié : `Q5JpfYGCTYXlpIY2`

## Cycle MCP n8n

`get_sdk_reference` → `search_nodes` → `get_node_types` → `validate_workflow` → `create_workflow_from_code` → `publish_workflow` → `prepare_test_pin_data` → `test_workflow` → `get_execution`
