# CLAUDE.md

このリポジトリの共通エージェント指示は [AGENTS.md](AGENTS.md) に集約しています。Claude Code で作業する場合も、まず `AGENTS.md` を読んでその内容に従ってください。

## Claude Code 固有の補足

- `.claude/commands/` には Claude Code 用のカスタムコマンドがあります。
  - `/migrate`: Prisma マイグレーション作成時の手順
  - `/server-action`: Server Action 作成時のチェックリスト
- `.claude/skills/` は Claude Code 専用です。Codex では自動的には使われません。
- タスクの切れ目では、必要に応じて `/rename <task-name>` でセッション名を付け、`/clear` でコンテキストを整理してください。

共通のドキュメント一覧、主要コマンド、コーディング原則、テナント分離ルールは [AGENTS.md](AGENTS.md) を更新してください。
