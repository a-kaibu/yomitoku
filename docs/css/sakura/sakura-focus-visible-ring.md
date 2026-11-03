---
title: "キーボード操作のときだけ太い枠線を出す"
description: "button や input に :focus-visible を指定して、キーボードでフォーカスしたときだけ実線の太い枠を出す。マウスのクリックでは枠を出さない、見た目と操作の両立。"
language: css
project: undefined
repo: https://github.com/oxalorg/sakura
license: MIT
copyright: "\"Copyright (c) 2016 Mitesh Shah\""
commit: "1eab9fd871abc74ec74d1a6f18ee56148f5a4b8f"
file: css/sakura.css
lines: [211, 218]
function: "\".button:focus-visible, button:focus-visible\""
difficulty: 2
format: 2
tags: [防御的プログラミング, 移植性]
---
## ひとことで

ボタンや入力欄に、`:focus-visible` でキーボード操作のときだけ太い枠線を出すルールです。マウスでクリックしたときは、枠線が出ません。キーボードで移動する人には、いまどこにフォーカスがあるかを、はっきり示します。

## コード

```css:line-numbers=211
.button:focus-visible, button:focus-visible,
input[type=submit]:focus-visible,
input[type=reset]:focus-visible,
input[type=button]:focus-visible,
input[type=file]:focus-visible {
  outline-style: solid;
  outline-width: 2px;
}
```

## 前提知識

- **:focus-visible**: キーボードの操作などで、フォーカスが見えるべき場合にだけ一致する疑似クラスです。マウスのクリックでは一致しないことが多いです。
- **outline**: 要素の外側に描かれる枠線です。`border` と違って、箱の大きさは変えません。
- **outline-style: solid**: 枠線の線の種類を実線にする指定です。
- **フォーカス**: キーボードの Tab キーなどで、操作の対象になっている要素のことです。

## 何をしているか

### 1. キーボードでフォーカスされたときの枠

```css:line-numbers=211
.button:focus-visible, button:focus-visible,
input[type=submit]:focus-visible,
input[type=reset]:focus-visible,
input[type=button]:focus-visible,
input[type=file]:focus-visible {
```

ボタンと、各種の `input` が `:focus-visible` になったときに、対象のセレクタが一致します。マウスのクリックでは、ブラウザが多くの場合にこの条件を満たさないので、余計な枠が出ません。

### 2. 枠線の種類と太さ

```css:line-numbers=216
  outline-style: solid;
  outline-width: 2px;
```

`outline-style: solid` で実線にし、`outline-width: 2px` で太さを 2px にします。既定の枠より見分けやすい太さに決めています。

## ここがすごい

- `:focus` ではなく `:focus-visible` を使うことで、マウスの利用者には余計な枠が出ず、キーボードの利用者には枠が出ます。両方の利用者に配慮した書き方です。
- 枠を `outline` で描くので、ボタンの大きさや位置は変わりません。レイアウトに影響しない強調になっています。
- 素直に `:focus { outline: none; }` とすると、キーボードの利用者がどこを操作しているか見えなくなります。ここでは、枠を消さずに、見え方だけを変えています。
- `:focus-visible` を対象にしているので、ボタンの種類ごとに同じ規則が当たるよう、セレクタが揃えられています。

## まとめ

- `:focus-visible` は、キーボード操作のときだけ一致する疑似クラスです。
- `outline` は箱の大きさを変えずに、強調の枠を描けます。
- フォーカスの枠を消さないことは、キーボードで操作する人への基本の配慮です。
- マウスとキーボードの両方の利用を考えて、枠の出し方を分けられます。
