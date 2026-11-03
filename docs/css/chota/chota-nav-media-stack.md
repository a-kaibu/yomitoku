---
title: "狭い画面でナビゲーションを縦に積む"
description: "Chota の .nav は 480px 以下で flex-direction を column にし、ロゴやリンクを縦に積む。狭い画面で横並びが崩れるのを防ぐ、メディアクエリの書き方。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_nav.css
lines: [34, 46]
function: "\"@media screen and (max-width: 480px)\""
difficulty: 2
format: 2
tags: [レスポンシブ, レイアウト]
---
## ひとことで

Chota の `.nav` は、画面が 480px 以下になると、ナビゲーションを縦に積み直します。横に並べると入らない小さな画面のための指定です。

## コード

```css:line-numbers=34
@media screen and (max-width: 480px) {
  .nav,
  .nav > .container {
    flex-direction: column;
  }

  .nav-center,
  .nav-left,
  .nav-right {
    flex-wrap: wrap;
    justify-content: center;
  }
}
```

## 前提知識

- **flex-direction**: flex の並ぶ向きを決めるプロパティです。`row` は横、`column` は縦です。
- **メディアクエリ**: 画面の幅などの条件で、ルールを切り替える仕組みです。
- **flex-wrap**: 入りきらない項目を次の行に回すかどうかを決めます。

## 何をしているか

### 1. 狭い画面の条件を書く

```css:line-numbers=34
@media screen and (max-width: 480px) {
```

画面の幅が 480px 以下のときだけ、中のルールを適用します。

### 2. 縦に積む

```css:line-numbers=35
  .nav,
  .nav > .container {
    flex-direction: column;
  }
```

ナビゲーション全体と、その中の container を縦向きに変えます。

### 3. 中身を折り返して中央にそろえる

```css:line-numbers=40
  .nav-center,
  .nav-left,
  .nav-right {
    flex-wrap: wrap;
    justify-content: center;
  }
```

左・中央・右の各まとまりを、折り返せる形にして中央にそろえます。画面が狭くても、項目が崩れずに読めます。

## ここがすごい

PC 用の横並びと、スマホ用の縦並びを、同じ要素の上で切り替えています。HTML の構造を変えずに済みます。

画面が狭いときだけ縦に積むので、PC では横並び、スマホでは縦並びという二つの見た目を一つの書き方で作れます。画面の幅に合わせて切り替えるので、端末ごとの専用のクラスを用意する必要がありません。480px という境目は、一般的な小さな端末の幅に合わせた目安です。

## まとめ

メディアクエリと flex-direction を組み合わせると、画面の幅に応じてナビを積み直せます。
