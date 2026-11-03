---
title: "コードとキーボード入力を小さな薄い箱で囲む"
description: "Water.css は code と kbd に薄い灰色の背景、5px の余白、6px の角丸を与え、文の中のコードや操作の文字を、箱として区切って見せる。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [181, 186]
function: "\"code, kbd\""
difficulty: 2
format: 2
tags: [配色, 可読性]
---
## ひとことで

Water.css は、文の中に書かれたコードやキーボードの入力を、薄い灰色の小さな箱に入れて示します。周りの文字と区別して、どこが操作や命令なのかを見せます。

## コード

```css:line-numbers=181
code, kbd {
  background: #efefef;
  color: #000000;
  padding: 5px;
  border-radius: 6px;
}
```

## 前提知識

- **code 要素**: コードの断片を表す HTML の要素です。文の中に書かれることが多く、等幅のフォントで表示されます。
- **kbd 要素**: キーボードのキーを表す HTML の要素です。Enter や Ctrl などの文字を、キーの印として囲みます。
- **背景と角丸**: 背景の色と角の丸みを付けると、文字が一つの箱として見えます。

## 何をしているか

### 1. 背景と余白

```css:line-numbers=182
  background: #efefef;
  color: #000000;
  padding: 5px;
```

薄い灰色の背景を付け、内側に 5px の余白を取ります。文字が、箱の中に収まって見えます。

### 2. 角を丸める

```css:line-numbers=185
  border-radius: 6px;
```

角を 6px で丸めます。枠線がないため、角の丸みだけで、箱の範囲が柔らかく示されます。

## ここがすごい

code と kbd に同じ見た目を与えて、コードとキーの印を、同じ仲間として扱っています。

文の中のコードは、前後の言葉と見分けがつきにくいことがあります。薄い箱で囲むと、命令や変数名が一目で別の部品だと分かります。キーボードの印も同じ箱に入るため、操作の指示が文章の中で目に入りやすくなります。角の丸みは、箱が硬く見えすぎないように選ばれた値です。

## まとめ

薄い箱で囲むと、文の中のコードや操作の文字が、本文から切り分けて読めるようになります。
