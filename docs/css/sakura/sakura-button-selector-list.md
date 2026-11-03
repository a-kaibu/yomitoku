---
title: "ボタンと入力欄の見た目を一つのセレクタにまとめる"
description: "button と input[type=submit] など、ボタンになる要素を一つのセレクタ群にまとめて、背景色・文字色・角丸・枠線を同じ値で当てる。フォームの見た目を揃える書き方。"
language: css
project: undefined
repo: https://github.com/oxalorg/sakura
license: MIT
copyright: "\"Copyright (c) 2016 Mitesh Shah\""
commit: "1eab9fd871abc74ec74d1a6f18ee56148f5a4b8f"
file: css/sakura.css
lines: [176, 192]
function: "\".button, button, input[type=submit], input[type=reset], input[type=button], input[type=file]::file-selector-button\""
difficulty: 2
format: 2
tags: [設計パターン, 移植性]
---
## ひとことで

`.button` のクラスを持つ要素と、`button`、そして `input` の `submit`・`reset`・`button`・ファイル選択の各タイプを、一つのルールでまとめて同じ見た目にするものです。背景色、文字色、角丸、枠線、カーソルの形を、すべての種類で揃えています。

## コード

```css:line-numbers=176
.button, button,
input[type=submit],
input[type=reset],
input[type=button],
input[type=file]::file-selector-button {
  display: inline-block;
  padding: 5px 10px;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  background-color: #1d7484;
  color: #f9f9f9;
  border-radius: 1px;
  border: 1px solid #1d7484;
  cursor: pointer;
  box-sizing: border-box;
}
```

## 前提知識

- **セレクタのリスト**: カンマで区切って、複数のセレクタに同じ宣言を当てる書き方です。
- **input の type 属性**: `<input type="submit">` のように、入力欄の種類を決める属性です。見た目はボタンでも、HTML の要素は `input` です。
- **::file-selector-button**: ファイル選択のボタン部分を表す疑似要素です。
- **box-sizing: border-box**: 幅に padding と border を含める指定です。

## 何をしているか

### 1. ボタンになる要素を並べる

```css:line-numbers=176
.button, button,
input[type=submit],
input[type=reset],
input[type=button],
input[type=file]::file-selector-button {
```

`.button`、`button`、`input[type=submit]`、`input[type=reset]`、`input[type=button]`、そしてファイル選択の疑似要素を並べています。どれも「押せるもの」として同じ見た目になります。`.button` のクラスを付けた `a` 要素なども、同じ見た目にできます。

### 2. 同じ見た目を当てる

```css:line-numbers=181
  display: inline-block;
  padding: 5px 10px;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  background-color: #1d7484;
  color: #f9f9f9;
  border-radius: 1px;
  border: 1px solid #1d7484;
  cursor: pointer;
  box-sizing: border-box;
```

`display: inline-block` でボタンを行の中に置き、`padding: 5px 10px` で周りの余白を作ります。背景色は `#1d7484` の青緑、文字色は白に近い色です。`border-radius: 1px` で、角をわずかに丸くしています。`box-sizing: border-box` で、幅に余白と枠線を含めます。

## ここがすごい

- 見た目を一度に決められるので、ボタンの種類が増えても、色や余白がずれません。
- `input` の種類を一つずつ書いているので、どの要素がボタンとして扱われるかが明確です。
- 素直に、`button` と `input` を別々に書くと、同じ値を二度書くことになります。まとめると、変更の手間が減ります。
- ファイル選択ボタンの疑似要素まで含めているのは、フォームの中で見た目が違って見えるのを防ぐ細かな配慮です。

## まとめ

- 押せる要素を一つのセレクタにまとめると、見た目を揃えやすくなります。
- `input` の type 属性で、ボタンの種類を区別できます。
- `display: inline-block` と `padding` で、ボタンの大きさを決めます。
- 疑似要素も含めると、ブラウザの部品まで同じ見た目になります。
