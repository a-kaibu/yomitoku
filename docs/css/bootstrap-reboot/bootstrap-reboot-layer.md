---
title: "@layer で既定のリセットを優先度の低い層に入れる"
description: "Bootstrap の Reboot は CSS の cascade layer「reboot」の中にリセットを書く。層の中のルールは層の外の指定より弱いので、利用者は !important を使わずに上書きできる。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-reboot.css
lines: [493, 498]
function: "\"@layer reboot\""
difficulty: 3
format: 2
tags: [設計パターン, 移植性]
---
## ひとことで

Bootstrap のリセット（Reboot）を、`@layer reboot { … }` という CSS の「カスケードレイヤー」の中に入れています。レイヤーの中に書かれた指定は、レイヤーの外側に書かれた指定よりも弱いと扱われます。そのため、利用者が自分の CSS を書くだけで、Bootstrap のリセットを上書きできます。

## コード

```css:line-numbers=493
@layer reboot {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
```

## 前提知識

- **カスケード**: 同じ要素に複数のルールが当たったとき、どれを採用するかを決める CSS の仕組みです。詳細度、書いた順番、重要度などで決まります。
- **cascade layer（@layer）**: ルールをまとまりとして名前を付けて分ける仕組みです。`@layer reboot { … }` のように書きます。
- **層の優先順位**: 後から宣言された層ほど強く、層の外にある通常の指定は、どの名前付きの層よりも強いと扱われます。
- **セレクタ `*`**: ページ内のすべての要素に一致するセレクタです。

## 何をしているか

### 1. 層の中に全体のリセットを置く

```css:line-numbers=493
@layer reboot {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
```

`@layer reboot` の中に、`box-sizing` を全要素に当てる指定が書かれています。この指定は層の中にあるので、利用者が層の外に書いた指定が、必ず勝ちます。

## ここがすごい

- 上書きのたびに `!important` を書く必要がなくなります。`!important` が増えると、あとから上書きするのがさらに難しくなるため、この仕組みは大きな利点です。
- リセットと見た目の指定を、層で分けて管理できます。ライブラリの土台が、利用者の書いた CSS の邪魔をしません。
- 素直に、リセットを層の外に書くと、利用者は詳細度を上げるか `!important` を使うしかありません。層に入れるだけで、その競争が起きなくなります。
- 古いブラウザでは層が使えないことがあります。Bootstrap は、そうした環境では従来どおり層の外と同じ優先度で働く、という前提で書かれています。

## まとめ

- `@layer` は、ルールを優先度の違う層に分けて書く仕組みです。
- 層の中の指定は、層の外の指定より弱いと扱われます。
- 上書きのために `!important` を使わずに済むので、ライブラリの土台として安全です。
