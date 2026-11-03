---
title: "main 要素を必ずブロックとして表示する"
description: "normalize.css は main を display: block にし、古い IE などで要素が既定でインラインとして扱われる問題を防ぐ。本文の領域を、どのブラウザでも一つの箱として扱う指定。"
language: css
project: undefined
repo: https://github.com/necolas/normalize.css
license: MIT
copyright: "\"Copyright © Nicolas Gallagher and Jonathan Neal\""
commit: "fc091cce1534909334c1911709a39c22d406977b"
file: normalize.css
lines: [31, 33]
function: "\"main\""
difficulty: 1
format: 2
tags: [レイアウト, 移植性]
---
## ひとことで

normalize.css は、本文の領域を表す `main` 要素を、ブロックの箱として表示します。古いブラウザで既定の表示が違っていたため、その差を消すための指定です。

## コード

```css:line-numbers=31
main {
  display: block;
}
```

## 前提知識

- **main 要素**: ページの中心になる内容を囲む HTML の要素です。一つのページに一つだけ置くのが決まりです。
- **display: block**: 要素を行全体の箱にする指定です。前後で改行され、幅を持てます。
- **インライン**: 文字と同じ行に並ぶ表示の種類です。main を既定でインラインにしてしまうと、レイアウトの幅が取れません。

## 何をしているか

### 1. ブロックとして表示する

```css:line-numbers=32
  display: block;
```

main の表示を block にします。本文が一行の箱として、前後の要素と上下に並びます。

## ここがすごい

HTML5 の新しい要素に対しても、古いブラウザの表示の差を、一つのルールで埋めています。main を使うだけで、支援技術にも本文の位置が伝わります。

main を block にしておくと、その中の見出しや段落を、通常の文書の流れとして配置できます。また、支援技術は main を本文の入り口として扱うため、正しく表示されることが、読み上げの利便性にもつながります。normalize は、表示の差を消すことで、要素の意味と見た目を一致させています。

## まとめ

main を block にする一行は、本文の箱の土台を、どのブラウザでも同じに保つための指定です。
