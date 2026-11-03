---
title: "見出しの下の補足文だけ色を薄くする"
description: "hgroup の最後の子要素だけを、文字色を薄くし、フォントの太さを解除して小さく表示する。見出しと説明文を一つの囲みで書くときの、補足文の見た目を決めるルール。"
language: css
project: undefined
repo: https://github.com/picocss/pico
license: MIT
copyright: "\"Copyright (c) 2019-2024 Pico\""
commit: "a07563ddc856e6ed31a740e33b0397814227d469"
file: css/pico.css
lines: [847, 851]
function: "\"hgroup > *:not(:first-child):last-child\""
difficulty: 2
format: 2
tags: [設計パターン, 可読性]
---
## ひとことで

`hgroup` 要素の中で、最初の子ではなく、かつ最後の子である要素だけに、補足文のスタイルを当てるルールです。`hgroup` は見出しと説明文をまとめる HTML 要素です。説明文の部分だけ色を薄くし、太さを本文のものに戻すことで、見出しとの差を付けています。

## コード

```css:line-numbers=847
hgroup > *:not(:first-child):last-child {
  --pico-color: var(--pico-muted-color);
  --pico-font-weight: unset;
  font-size: 1rem;
}
```

## 前提知識

- **hgroup 要素**: 見出し（h1 など）と、その副題になる文を一つにまとめるための HTML 要素です。
- **:not()**: 括弧の中の条件に一致しない要素を選ぶ疑似クラスです。`:not(:first-child)` は、最初の子以外を選びます。
- **:last-child**: 親の中で最後に置かれた子要素を選ぶ疑似クラスです。
- **--pico-muted-color**: Pico が用意している、控えめな文字色の変数です。

## 何をしているか

### 1. 最初の見出しを除いて、最後の子を選ぶ

```css:line-numbers=847
hgroup > *:not(:first-child):last-child {
```

`:not(:first-child):last-child` を組み合わせると、子要素が二つ以上あるときの最後の子だけに一致します。見出しを最初の子に置き、副題を最後の子に置く形に合わせた選び方です。

### 2. 色と太さを変える

```css:line-numbers=848
  --pico-color: var(--pico-muted-color);
  --pico-font-weight: unset;
  font-size: 1rem;
```

`--pico-color` を控えめな文字色に上書きし、`--pico-font-weight` を `unset` にして、親の太さの指定を解除しています。`font-size: 1rem` で、本文の大きさに近づけています。

## ここがすごい

- 見出しの HTML の書き方だけで、補足文の見た目が決まります。CSS のクラスを付ける必要がありません。
- 変数を上書きして色と太さを変えるので、テーマの色の仕組みをそのまま使えます。
- 素直に `p.subtitle` のようなクラスを付けると、HTML を書く人が毎回クラスを覚えておく必要があります。構造で決まる書き方の方が、書き忘れがありません。
- `:not(:first-child):last-child` の組み合わせは、一つだけの子の場合には当たりません。この条件で、見出しだけの `hgroup` が補足文の見た目にならないようにしています。

## まとめ

- `:not()` と `:last-child` を組み合わせると、子要素の位置で対象を決められます。
- 変数を上書きすると、テーマの色を保ったまま、部品の色だけを変えられます。
- HTML の構造に合わせた選び方は、クラスを増やさずに済みます。
- 一つだけの要素には当たらない条件は、見出しだけの場合の見た目を守ります。
