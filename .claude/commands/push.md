# 変更をコミット＆プッシュ

実装が終わったら、このスキルで変更をまとめてコミット＆プッシュする。

## 手順

1. `git status` で変更ファイルを確認する
2. ログファイル（`*.log`）や一時ファイルはステージしない
3. 変更内容を把握して適切なコミットメッセージを作成する
   - 形式: `feat:` / `fix:` / `chore:` / `refactor:` などのプレフィックス
   - 内容: 何をなぜ変えたかを簡潔に（日本語可）
4. `git add` → `git commit` → `git push origin master` を実行する
5. プッシュ完了をユーザーに報告する

## 注意事項

- `.env*` や秘密情報を含むファイルは絶対にコミットしない
- `dev.log` などの一時ファイルはステージから除外する
- コミットメッセージの末尾には必ず Co-Authored-By を付ける:
  `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
