---
title: "CSS 変数で吹き出しの色と大きさを一か所にまとめる"
description: "balloon.css の :root に色・角丸・文字サイズなどの値を変数として置き、吹き出し全体の見た目を一度に変えられるようにする設計。"
language: css
project: undefined
repo: https://github.com/kazzkiq/balloon.css
license: MIT
copyright: "\"Copyright (c) 2016 Claudio Holanda\""
commit: "8b8e034ab288feb160c365789a153ad1babdfcf9"
file: balloon.css
lines: [1, 6]
function: "\":root\""
difficulty: 1
format: 2
tags: [設計パターン, 可読性]
---
## ひとことで

吹き出し（ツールチップ）の背景色、文字色、角丸、文字の大きさ、表示位置のずれ量を、`:root` に CSS 変数として並べたルールです。個々のルールは `var(--balloon-color)` のように変数を読むだけになり、見た目を変えたいときは、この 5 行だけを書き換えれば済みます。

## コード

```css:line-numbers=1
:root {
  --balloon-border-radius: 2px;
  --balloon-color: rgba(16, 16, 16, 0.95);
  --balloon-text-color: #fff;
  --balloon-font-size: 12px;
  --balloon-move: 4px; }
```

## 前提知識

- **:root**: HTML 文書の一番上の要素（通常は `html`）を指す疑似クラスです。ここに置いた変数は、ページのどこからでも読めます。
- **CSS 変数（カスタムプロパティ）**: `--name: 値;` の形で名前を付けて、`var(--name)` で読み出せる仕組みです。値はあとから上書きできます。
- **rgba()**: 赤、緑、青、透明度を指定する色の書き方です。`0.95` は、ほぼ不透明という意味です。
- **move**: 吹き出しを要素からどれだけ離して出すかを表す値です。この変数は、位置のずれを決める計算で使われます。

## 何をしているか

### 1. 見た目の値を変数として並べる

```css:line-numbers=2
  --balloon-border-radius: 2px;
  --balloon-color: rgba(16, 16, 16, 0.95);
  --balloon-text-color: #fff;
  --balloon-font-size: 12px;
```

`--balloon-color` は背景色です。ほぼ黒の半透明にしているので、どんな背景の上でも文字が読みやすくなります。`--balloon-text-color` は文字色で、白です。`--balloon-font-size` は文字の大きさ、`--balloon-border-radius` は角の丸さを決めます。

### 2. 位置のずれも変数にする

```css:line-numbers=6
  --balloon-move: 4px; }
```

`--balloon-move` は吹き出しと要素の間の距離です。矢印の位置や吹き出し本体の位置を決めるとき、この値を使って少しずつずらします。数字を直接書くのではなく変数にしておくと、距離を一箇所で変えられます。

## ここがすごい

- 見た目を決める値が、すべて `:root` に集まっています。ルールの中には数字が残らず、読み手は「どこを直せばいいか」を迷いません。
- 変数は、ダークモードの切り替えなどで、別のスタイルシートや JavaScript から上書きできます。テーマを切り替える仕組みを、ライブラリ側が用意しなくても済みます。
- 素直に書くと、色や大きさの数字が十数か所に分かれて書かれます。変更のたびに見落としが起きやすくなります。
- 変数の名前がすべて `--balloon-` で始まっています。ほかの CSS の変数と衝突しにくく、どの部品の値かもすぐにわかります。

## まとめ

- `:root` に変数を置くと、ライブラリ全体の見た目を一か所で決められます。
- `var()` で読むだけにすると、値の変更が全体に反映されます。
- 名前に接頭辞を付けると、ほかの変数と混ざりにくくなります。
- 数字を変数にすると、意味のある名前で説明できます。
