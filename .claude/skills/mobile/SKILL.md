---
name: mobile
description: モバイルファーストUI実装チェックリスト。本アプリはスマホ利用が主体のため、UIコンポーネントの新規作成・変更・レビューを行うときに必ず読む。
---

# モバイルファースト実装ガイドライン

## 大前提

**本アプリはスマートフォンからの利用が主体。**
実装時は常にモバイル（幅375px〜）で使えるかを最初に想定する。
PCでも動けばよいが、モバイル体験を犠牲にしてはいけない。

## チェックリスト

### レイアウト
- `sm:` `lg:` の前に、プレフィックスなし（モバイル）のスタイルが正しいか確認する
- グリッドは `grid-cols-1` から始め、画面幅で増やす（`sm:grid-cols-2 lg:grid-cols-3`）
- フレックス横並びをモバイルで使う場合、折り返し（`flex-wrap`）かスクロール（`overflow-x-auto`）を必ず用意する
- `justify-center` 単体は小画面で見切れる → `justify-start lg:justify-center overflow-y-auto`

### タップ操作
- タップターゲットは最低44px（`min-h-[44px]` or `py-3` 以上）
- ホバー（`hover:`）だけで操作できる機能はモバイルで使えないため、タップ＝クリックで完結させる
- ドロップダウン・ポップアップは画面端でクリッピングされないか確認する

### テキスト・フォント
- モバイルで `text-xs` が小さすぎないか確認する（本文は `text-sm` 以上が望ましい）
- `whitespace-nowrap` を使う場合は横スクロールの逃げ道があるか確認する

### 外部コンテンツ・iframe
- 外部サイト埋め込み（iframe）はデスクトップ幅前提のことが多い
- コンテナを `overflow-x-auto` にして、iframe に `minWidth` を明示する
  ```tsx
  <div className="overflow-x-auto">
    <iframe style={{ minWidth: '900px', width: '100%' }} ... />
  </div>
  ```
- カレンダーグリッド・日程調整テーブルも同様に `overflow-x-auto` + `min-w-[350px]`

### ナビゲーション
- タブ・サブナビは `overflow-x-auto scrollbar-none` で横スクロール対応にする
- 各アイテムに `shrink-0` + `whitespace-nowrap` を付けて潰れないようにする

### スクロールバー非表示ユーティリティ（globals.css 登録済み）
```css
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
```

## 実装後の自己確認

1. 幅375pxのスマホで開いたとき、横にはみ出す要素はないか？
2. ボタン・リンクをタップしやすいサイズか？
3. テキストが読みやすいフォントサイズか？
4. モーダル・ポップアップが画面に収まるか？
