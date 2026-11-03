---
title: "長い単語を枠の中で折り返す .text-break"
description: "Bootstrap の .text-break は word-wrap と word-break に break-word を指定し、枠からはみ出す長い英数字や URL を途中で折り返す。古い指定と新しい指定を並べて書く書き方。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [2623, 2626]
function: "\".text-break\""
difficulty: 1
format: 2
tags: [文字列処理, 移植性]
---
## ひとことで

`text-break` クラスを付けた要素で、枠を超える長い単語を途中で折り返すユーティリティです。長い URL やファイル名、英数字の並びが、枠からはみ出して画面を壊すのを防ぎます。

## コード

```css:line-numbers=2623
  .text-break {
    word-wrap: break-word;
    word-break: break-word;
  }
```

## 前提知識

- **word-wrap（overflow-wrap）**: 単語が枠を超えるとき、途中で折り返してよいかを決めるプロパティです。新しい名前は `overflow-wrap` です。
- **word-break**: 文字の区切り方を決めるプロパティです。`break-word` は古い値で、新しい仕様では `overflow-wrap` に置き換えられつつあります。
- **break-word**: 単語が枠を超えるときだけ、途中で折り返す値です。
- **はみ出し**: 中身が枠を超えて、隣の要素や画面の外に出ることです。

## 何をしているか

### 1. 単語の途中で折り返す

```css:line-numbers=2624
    word-wrap: break-word;
    word-break: break-word;
```

`word-wrap: break-word` と `word-break: break-word` の二つを並べています。`word-wrap` は古い名前、`word-break` は別の古い値です。どちらのブラウザでも、長い単語が枠の中で折り返されるように、両方を書いています。

## ここがすごい

- 古い名前と新しい名前を並べて、ブラウザの違いを吸収しています。Bootstrap が幅広い環境を想定していることが、この一行からも読み取れます。
- 一つのクラスで、長い単語の扱いを決められます。文章の中で必要な場所だけに付ければよいので、全体の折り返しに影響しません。
- 素直に `word-break: break-all` にすると、通常の単語も途中で切れてしまいます。`break-word` は、はみ出すときだけ切るので、読みやすさが保たれます。
- 長い URL の表示などでよく使われます。見た目の崩れを、一つのクラスで防げます。

## まとめ

- 長い単語は、枠からはみ出すと画面を壊します。
- `break-word` は、はみ出すときだけ単語を途中で折り返します。
- 古い指定と新しい指定を並べると、ブラウザの差を減らせます。
