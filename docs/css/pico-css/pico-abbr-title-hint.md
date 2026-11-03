---
title: "説明つきの略語に点線の下線と help カーソルを付ける"
description: "abbr 要素の title 属性がある場合に、点線の下線を付け、カーソルを help の形にする。マウスを乗せると説明が読めることを、見た目で知らせる書き方。"
language: css
project: undefined
repo: https://github.com/picocss/pico
license: MIT
copyright: "\"Copyright (c) 2019-2024 Pico\""
commit: "a07563ddc856e6ed31a740e33b0397814227d469"
file: css/pico.css
lines: [887, 891]
function: "\"abbr[title]\""
difficulty: 1
format: 2
tags: [可読性, 移植性]
---
## ひとことで

`title` 属性を持つ `abbr`（略語）に、点線の下線を付け、マウスカーソルを「？」の形にするルールです。ブラウザはこの属性がある略語の上に、説明を小さな箱で表示します。その説明があることを、見た目でも伝えるための指定です。

## コード

```css:line-numbers=887
abbr[title] {
  border-bottom: 1px dotted;
  text-decoration: none;
  cursor: help;
}
```

## 前提知識

- **abbr 要素**: 略語を表す HTML 要素です。`title` 属性に正式な名前や説明を入れると、マウスを乗せたときに表示されます。
- **border-bottom**: 要素の下の枠線です。`1px dotted` は、細い点線です。
- **text-decoration: none**: 文字の下線など、装飾をなくす指定です。ここでは下線を枠線で代用するため、既定の下線を消しています。
- **cursor: help**: マウスカーソルを、説明を表す形にする値です。

## 何をしているか

### 1. 下線を点線の枠線にする

```css:line-numbers=888
  border-bottom: 1px dotted;
  text-decoration: none;
```

`border-bottom: 1px dotted` で、文字の下に細い点線を引きます。`text-decoration: none` は、ブラウザ既定の下線を消します。下線を枠線で描くことで、点線の見た目を細かく調整できます。

### 2. カーソルで説明の存在を示す

```css:line-numbers=890
  cursor: help;
```

`cursor: help` は、マウスを乗せると「？」の形のカーソルになります。ここでは、説明の表示があることを、マウスの動きでも示しています。

## ここがすごい

- `title` の有無だけで決まるので、説明のない略語には何も付きません。HTML の書き方に応じて、見た目が変わります。
- 点線の下線とカーソルの形の二つで、説明があることを二重に伝えています。
- 素直に `abbr { text-decoration: underline dotted; }` と書くと、説明のない略語にも下線が付きます。属性で絞ると、本当に説明のある語だけが目立ちます。
- 下線を枠線で描いているので、行の高さや文字の位置が変わりにくくなります。

## まとめ

- 属性で対象を絞ると、説明のある略語だけを目立たせられます。
- 点線の枠線とカーソルの形で、説明があることを示せます。
- 既定の下線を消すと、見た目を細かく調整できます。
