---
title: "フォームの入力欄を幅いっぱいの箱にする"
description: "Chota は input・select・textarea を display: block と width: 100% にそろえ、チェックボックスやボタンを除いた入力欄だけに枠と余白を付ける。フォームの見た目の土台。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_form.css
lines: [11, 23]
function: "\"input:not(...), select, textarea\""
difficulty: 2
format: 2
tags: [フォーム, レイアウト]
---
## ひとことで

Chota の入力欄のルールは、テキスト入力・選択・複数行入力をそろえて、幅いっぱいの箱にします。チェックボックスやボタンは、この指定から外しています。

## コード

```css:line-numbers=11
input:not([type="checkbox"], [type="radio"], [type="submit"], [type="color"], [type="button"], [type="reset"]),
select,
textarea,
textarea[type="text"] {
  font-family: inherit;
  padding: 0.8rem 1rem;
  border-radius: 4px;
  border: 1px solid var(--color-lightGrey);
  font-size: 1em;
  transition: all 0.2s ease;
  display: block;
  width: 100%;
}
```

## 前提知識

- **input**: 文字や数値などを入力する欄です。`type` の属性で種類が決まります。
- **:not()**: 条件に当てはまらない要素を選ぶ疑似クラスです。
- **display: block**: 要素を一行全体の箱にする指定です。前後で改行されます。
- **width: 100%**: 親の幅いっぱいに広げる指定です。

## 何をしているか

### 1. 対象を選ぶ

```css:line-numbers=11
input:not([type="checkbox"], [type="radio"], [type="submit"], [type="color"], [type="button"], [type="reset"]),
select,
textarea,
textarea[type="text"] {
```

チェックボックス、ラジオ、ボタンなどを除いた input と、select と textarea を選びます。

### 2. 箱として整える

```css:line-numbers=15
  font-family: inherit;
  padding: 0.8rem 1rem;
  border-radius: 4px;
  border: 1px solid var(--color-lightGrey);
  font-size: 1em;
  transition: all 0.2s ease;
  display: block;
  width: 100%;
```

フォント、余白、角丸、枠線を決めて、幅を親いっぱいにします。入力欄の見た目が、どの画面でも同じになります。

## ここがすごい

`:not()` で除外する対象を一行に書くので、種類が増えても、ルールを追加するだけで済みます。

入力欄を幅いっぱいにすると、ラベルと欄が縦に並ぶ、読みやすいフォームになります。チェックボックスやラジオは、幅を持たせると見た目が崩れやすいため、除外するのが自然です。:not() で除く対象を明示しておけば、新しい入力の種類を後から足すときも、どこを直せばよいか迷いません。

## まとめ

`:not()` で入力欄の種類を絞ると、フォームの見た目を一度にそろえられます。
