---
title: "長い単語で見出しがはみ出さないように折り返す"
description: "h1 から h6 に overflow-wrap と word-break を指定して、長い英数字の単語が見出しの枠からはみ出さないようにする。古いプロパティと新しいプロパティを並べて書く書き方。"
language: css
project: undefined
repo: https://github.com/oxalorg/sakura
license: MIT
copyright: "\"Copyright (c) 2016 Mitesh Shah\""
commit: "1eab9fd871abc74ec74d1a6f18ee56148f5a4b8f"
file: css/sakura.css
lines: [32, 42]
function: "\"h1, h2, h3, h4, h5, h6\""
difficulty: 2
format: 2
tags: [文字列処理, 防御的プログラミング]
---
## ひとことで

見出し（`h1` から `h6`）の文字が、枠からはみ出さないようにするルールです。長い英数字の単語やURL が見出しに含まれると、そのままでは右へ飛び出してしまいます。ここでは、単語の途中で折り返す指定を入れて、その問題を防いでいます。

## コード

```css:line-numbers=32
h1, h2, h3, h4, h5, h6 {
  line-height: 1.1;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  font-weight: 700;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  overflow-wrap: break-word;
  word-wrap: break-word;
  -ms-word-break: break-all;
  word-break: break-word;
}
```

## 前提知識

- **overflow-wrap**: 単語が箱の幅を超えるとき、その単語の途中で折り返すかどうかを決めるプロパティです。`break-word` は、はみ出すときだけ途中で折り返します。
- **word-break**: 単語の区切り方を決めるプロパティです。`break-word` は古い値で、新しい仕様では overflow-wrap に置き換えられつつあります。
- **ベンダー接頭辞**: `-ms-` などの、特定のブラウザ向けに付ける接頭辞です。古い Internet Explorer 向けの書き方が残っています。
- **見出しの見た目**: 見出しは、本文よりも文字が大きく太いので、はみ出しが目立ちやすい要素です。

## 何をしているか

### 1. 古い書き方と新しい書き方を並べる

```css:line-numbers=38
  overflow-wrap: break-word;
  word-wrap: break-word;
```

`overflow-wrap: break-word` と `word-wrap: break-word` は、同じ意味の指定です。`word-wrap` は `overflow-wrap` の古い名前なので、古いブラウザのために両方を書いています。

### 2. 単語の区切り方を決める

```css:line-numbers=40
  -ms-word-break: break-all;
  word-break: break-word;
```

`-ms-word-break: break-all` は、古い Internet Explorer 向けの指定です。`word-break: break-word` は、単語の区切りを緩めて、長い単語が右にはみ出さないようにします。

## ここがすごい

- 同じ目的の指定を、古い書き方と新しい書き方で並べて、ブラウザの違いを吸収しています。ファイルを読むと、どの時代の環境を想定したかがわかります。
- 対象を見出しの六つのタグだけにしているので、本文の文章の折り返しには影響しません。
- 素直に見出しの幅を固定して `overflow: hidden` を付けると、はみ出した文字が途中で見えなくなります。折り返しなら、文字は全部見えたまま残ります。
- 見出しは一行で書くことが多いので、長い単語を折り返す指定は、とくに役に立ちます。

## まとめ

- 長い単語は、折り返しの指定がないと見出しの枠からはみ出します。
- `overflow-wrap` は、はみ出すときに単語の途中で折り返す指定です。
- 古いブラウザの接頭辞を残すと、環境の差を吸収できます。
- 文字を隠すより、折り返す方が情報を失わずに済みます。
