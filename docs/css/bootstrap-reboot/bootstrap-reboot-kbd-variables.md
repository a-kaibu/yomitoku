---
title: "kbd の見た目を CSS 変数の組で決める"
description: "Bootstrap の kbd は、余白、文字の大きさ、色、背景、角丸を --bs-kbd-* の変数に分けて持ち、そのあとで実際の宣言に使う。キーの見た目をテーマごとに差し替えやすくする設計。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-reboot.css
lines: [686, 698]
function: "kbd"
difficulty: 2
format: 2
tags: [設計パターン, 可読性]
---
## ひとことで

キーボードの入力を表す `kbd` の見た目を、いくつかの CSS 変数で組み立てるルールです。余白、文字の大きさ、文字色、背景色、角丸を、`--bs-kbd-*` という変数として先に宣言し、後の `padding` や `background-color` がそれを読みます。

## コード

```css:line-numbers=686
  kbd {
    --bs-kbd-padding-y: 0.125rem;
    --bs-kbd-padding-x: var(--bs-spacer-1);
    --bs-kbd-font-size: var(--bs-font-size-xs);
    --bs-kbd-color: var(--bs-bg-body);
    --bs-kbd-bg: var(--bs-fg-2);
    --bs-kbd-border-radius: var(--bs-radius-3);
    padding: var(--bs-kbd-padding-y) var(--bs-kbd-padding-x);
    font-size: var(--bs-kbd-font-size);
    color: var(--bs-kbd-color);
    background-color: var(--bs-kbd-bg);
    border-radius: var(--bs-kbd-border-radius);
  }
```

## 前提知識

- **kbd 要素**: キーボードのキーの入力を表す HTML 要素です。
- **CSS 変数（カスタムプロパティ）**: `--name: 値;` の形で宣言し、`var(--name)` で読み出す仕組みです。同じ要素の中で宣言して、その要素の中で使うこともできます。
- **var() の参照**: 変数の値を、別の宣言の中で使うことです。
- **border-radius**: 要素の角の丸さです。

## 何をしているか

### 1. 変数を宣言する

```css:line-numbers=687
    --bs-kbd-padding-y: 0.125rem;
    --bs-kbd-padding-x: var(--bs-spacer-1);
    --bs-kbd-font-size: var(--bs-font-size-xs);
    --bs-kbd-color: var(--bs-bg-body);
    --bs-kbd-bg: var(--bs-fg-2);
    --bs-kbd-border-radius: var(--bs-radius-3);
```

ここで、キーの余白、文字の大きさ、文字色、背景色、角丸を、名前付きの変数にしています。値は、Bootstrap の全体の変数（`--bs-spacer`、`--bs-font-size-xs` など）から取っているので、テーマ全体の設定に連動します。

### 2. 宣言で変数を使う

```css:line-numbers=693
    padding: var(--bs-kbd-padding-y) var(--bs-kbd-padding-x);
    font-size: var(--bs-kbd-font-size);
    color: var(--bs-kbd-color);
    background-color: var(--bs-kbd-bg);
    border-radius: var(--bs-kbd-border-radius);
```

`padding`、`font-size`、`color`、`background-color`、`border-radius` は、先ほどの変数を読みます。見た目を変えたいときは、変数だけを上書きすればよく、宣言の書き換えは不要です。

## ここがすごい

- 「値の宣言」と「値の使用」を分けているので、読み手はどこを変えればよいかが一目でわかります。
- 変数の名前が `--bs-kbd-*` で揃っていて、この部品専用の調整点だと示しています。
- 素直に、数字を各プロパティに直接書くと、キーの見た目を変えるときに五つのプロパティを探して直すことになります。
- 変数を要素の中で宣言しても、子要素に伝わります。そのため、同じ kbd の中の kbd（次のルール）にも、この変数を使えます。

## まとめ

- 部品の見た目は、変数の組で決めると調整しやすくなります。
- 宣言と使用を分けると、どこを変えればよいかが明確になります。
- 変数の名前に部品名を付けると、ほかの変数と混ざりません。
