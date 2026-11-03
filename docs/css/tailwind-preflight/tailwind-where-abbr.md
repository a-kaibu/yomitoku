---
title: "where() で詳細度ゼロにした略語の下線"
description: "abbr:where([title]) で title 属性の付いた略語だけに点線の下線を引く。where() を使って詳細度を 0 にし、利用者が後から簡単に上書きできるようにする。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [69, 72]
function: "\"abbr:where([title])\""
difficulty: 2
format: 2
tags: [可読性, 設計パターン]
---
## ひとことで

`title` 属性を持つ `abbr`（略語）要素に、点線の下線を付けるルールです。セレクタに `:where()` を使っているのが特徴で、このセレクタの詳細度はゼロになります。つまり、利用者が普通のセレクタで書いた指定が、必ずこのルールより優先されます。

## コード

```css:line-numbers=69
abbr:where([title]) {
  -webkit-text-decoration: underline dotted;
  text-decoration: underline dotted;
}
```

## 前提知識

- **abbr 要素**: 略語を表す HTML 要素です。`title` 属性に正式な名前を入れると、マウスを乗せたときに説明が出ます。
- **text-decoration**: 文字の下線や上線などを決めるプロパティです。`underline dotted` は、点線の下線を表します。
- **詳細度（specificity）**: CSS の指定がどれだけ優先されるかを表す数値です。クラス名は 1 点、要素名は 0.01 点のように考えられています（細かい比較は仕様にあります）。
- **:where()**: 括弧の中のセレクタの詳細度を、無視できるほど小さくするための疑似クラスです。ここでは `[title]` を条件にしても、詳細度は増えません。
- **-webkit-text-decoration**: 接頭辞付きの指定です。古い WebKit 系のブラウザ向けに、同じ指定を重ねて書いています。

## 何をしているか

### 1. title 属性のある abbr だけを対象にする

```css:line-numbers=69
abbr:where([title]) {
  -webkit-text-decoration: underline dotted;
  text-decoration: underline dotted;
}
```

`abbr:where([title])` は、`title` 属性を持つ `abbr` 要素だけに一致します。`:where()` によって、この条件の詳細度は 0 になります。

コメントにあるように、Chrome、Edge、Safari では、下線の描き方が違うことがあります。そこで `-webkit-text-decoration` と `text-decoration` を両方書いて、同じ見た目にそろえています。

## ここがすごい

- `:where()` を使うのが、この行の一番のポイントです。もし `abbr[title]` と書くと、属性セレクタの分だけ詳細度が上がり、利用者が `abbr` に別の色を付けても上書きできなくなります。
- `title` の有無で対象を絞るので、説明のない `abbr` には下線が付きません。見た目で、説明があるかどうかが一目でわかります。
- 素直に `abbr { text-decoration: underline dotted; }` と書くと、すべての `abbr` に下線が付きます。title がない場合も含めてしまうので、見た目の意図が伝わりにくくなります。
- 接頭辞付きの指定を併記することで、古いブラウザでも同じ下線が描かれます。

## まとめ

- `:where()` は、括弧の中の条件を詳細度ゼロで扱うための疑似クラスです。
- 属性で対象を絞ると、説明の付いた略語だけに下線を付けられます。
- 詳細度が低いので、利用者の指定が優先されやすくなります。
- 接頭辞付きの指定を並べて、ブラウザごとの差を減らします。
