---
title: "左・中央・右の並びを flex で分ける"
description: "Chota の .nav-left・.nav-center・.nav-right は、どれも flex: 1 で幅を三等分し、justify-content で中の項目を左・中央・右に寄せる。ヘッダーの三分割の作り方。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_nav.css
lines: [15, 20]
function: "\".nav-center, .nav-left, .nav-right\""
difficulty: 2
format: 2
tags: [レイアウト]
---
## ひとことで

Chota の `.nav-left`、`.nav-center`、`.nav-right` は、ナビゲーションを左・中央・右の三つに分けるための箱です。それぞれが同じ幅を取り、中身を寄せる向きだけを変えます。

## コード

```css:line-numbers=15
.nav-center,
.nav-left,
.nav-right {
  display: flex;
  flex: 1;
}
```

## 前提知識

- **flex**: 項目を一列に並べ、幅や位置を決めやすくする表示方法です。
- **flex: 1**: 余った幅を均等に分ける指定です。三つ並べると、それぞれが同じ幅になります。
- **justify-content**: 主軸方向で項目を寄せる位置を決めます。

## 何をしているか

### 1. 三つの箱を同じ幅にする

```css:line-numbers=15
.nav-center,
.nav-left,
.nav-right {
  display: flex;
  flex: 1;
}
```

三つのセレクタを一つにまとめ、どれも `display: flex` と `flex: 1` を受け取ります。幅は同じになります。

## ここがすごい

セレクタをまとめて書くので、三つの箱の基本の形は一か所だけで決まります。寄せる向きは、それぞれのクラスの一行だけが違います。

三つの箱が同じ幅を取るので、真ん中の項目は常に画面の中央にきます。左右の項目が長くなっても、箱の幅は変わりません。寄せる向きを一行ずつ変えるだけで、配置の意図がコードに表れます。ヘッダーの左にロゴ、中央に検索、右にメニューを置くような画面に向いています。

実際の画面では、ロゴを左に、メニューを右に置き、中央に検索欄を入れることがよくあります。その場合も、三つの箱の幅は変わらないため、中身の長さに左右されず、中央の項目が中央に残ります。箱の幅を決める責任を一か所にまとめた、分かりやすい設計です。

## まとめ

同じ flex: 1 の箱を三つ並べ、寄せ方だけを変えるのが、この三分割の要点です。
