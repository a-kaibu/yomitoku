---
title: "動きを減らす設定の人には浮き上がりのアニメーションを出さない"
description: "Bootstrap の .hover-lift は prefers-reduced-motion: no-preference の media query の中でだけ transition を付ける。動きの苦手な人の画面では、浮き上がりが瞬時に変わり、アニメーションが起きない。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [495, 499]
function: "\"@media (prefers-reduced-motion: no-preference)\""
difficulty: 3
format: 2
tags: [アクセシビリティ, アニメーション]
---
## ひとことで

`prefers-reduced-motion` という利用者の設定に応じて、アニメーションを付けるかどうかを決めるルールです。`no-preference` は「動きを減らす設定がない」という意味です。その場合だけ、`hover-lift` に `transition` を付けます。動きを減らす設定の人には、ホバーの変化が一瞬で切り替わります。

## コード

```css:line-numbers=495
  @media (prefers-reduced-motion: no-preference) {
    .hover-lift {
      transition: transform var(--bs-hover-lift-transition-duration) var(--bs-hover-lift-transition-timing), box-shadow var(--bs-hover-lift-transition-duration) var(--bs-hover-lift-transition-timing);
    }
  }
```

## 前提知識

- **prefers-reduced-motion**: OS の設定で「動きを減らす」を選んだ人に、CSS で伝わる条件です。前庭の不調を持つ人などが、画面の動きで気分が悪くなることを防ぐためのものです。
- **no-preference**: 動きを減らす設定がないことを表す値です。
- **transition**: 値の変化を、時間をかけてなめらかにする指定です。
- **media query**: 画面やユーザーの設定に応じて、CSS を切り替える仕組みです。

## 何をしているか

### 1. 設定がないときだけ transition を付ける

```css:line-numbers=495
  @media (prefers-reduced-motion: no-preference) {
    .hover-lift {
```

`@media (prefers-reduced-motion: no-preference)` の中で、`.hover-lift` に `transition` を付けます。この条件は、動きを減らす設定がない人の画面でだけ成り立ちます。

### 2. 動きを付ける対象

```css:line-numbers=497
      transition: transform var(--bs-hover-lift-transition-duration) var(--bs-hover-lift-transition-timing), box-shadow var(--bs-hover-lift-transition-duration) var(--bs-hover-lift-transition-timing);
    }
```

`transition` の中では、`transform`（移動）と `box-shadow`（影）の変化を、先ほどの変数の時間と速さで動かします。設定がある人は、この宣言が読まれないので、変化が瞬時に起きます。

## ここがすごい

- 利用者の OS の設定を、CSS の条件として直接読んでいます。JavaScript で設定を調べる必要がありません。
- 動きを「減らす」ではなく「付けるかどうか」で書いているので、設定がない人にだけ動きを提供するという、控えめな書き方です。
- 素直にすべての人に動きを付けると、画面の揺れで不快になる人がいます。media query で分けることで、その人たちへの配慮ができます。
- 変化の内容は、ホバーの指定とは別の場所に書かれています。動きを消すのも、この一か所だけの変更で済みます。

## まとめ

- `prefers-reduced-motion` で、利用者の動きの設定に応じて CSS を変えられます。
- `no-preference` の中だけに transition を書くと、動きが苦手な人には変化が瞬時になります。
- 動きは「あると良いもの」として扱い、必要な人の画面からは外します。
