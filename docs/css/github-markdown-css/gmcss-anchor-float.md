---
title: "見出しの横の目印を左に浮かせて隠す"
description: ".markdown-body の .anchor に float: left と負の margin-left を指定し、見出しの左側にリンクの記号を並べる。見出しの本文の位置を動かさずに、目印だけを見出しの外側へ出す仕掛け。"
language: css
project: undefined
repo: https://github.com/sindresorhus/github-markdown-css
license: MIT
copyright: "\"Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)\""
commit: "7f38dcb9054bc5d860fac65291f5c98fef47932c"
file: github-markdown.css
lines: [535, 540]
function: "\".markdown-body .anchor\""
difficulty: 3
format: 2
tags: [ハック, レイアウト]
---
## ひとことで

見出しの中に入る見出しへのリンク（アンカー）を、見出しの左側に出すルールです。`float: left` で左に寄せ、`margin-left` を負の値にして、見出しの文字の位置を変えずに、記号だけを左の外側へ押し出しています。

## コード

```css:line-numbers=535
.markdown-body .anchor {
  float: left;
  padding-right: var(--base-size-4);
  margin-left: -20px;
  line-height: 1;
}
```

## 前提知識

- **float: left**: 要素を左に寄せ、周りの文字がその右に回り込む指定です。
- **負の margin-left**: 要素を左側へはみ出させる指定です。レイアウトの流れの中でも、左に食い込むように置けます。
- **line-height: 1**: 行の高さを文字の大きさと同じにする指定です。記号の位置が、縦にずれにくくなります。
- **見出しのアンカー**: 見出しにリンクを付けて、その見出しへ直接移動できるようにする仕掛けです。

## 何をしているか

### 1. 左に寄せて、はみ出させる

```css:line-numbers=536
  float: left;
  padding-right: var(--base-size-4);
  margin-left: -20px;
```

`float: left` で、目印を見出しの左側に寄せます。`margin-left: -20px` で、さらに左へ 20px はみ出させます。これで、見出しの文字の始まる位置は変わらず、記号だけが左の余白に出ます。

### 2. 記号の幅と高さ

```css:line-numbers=537
  padding-right: var(--base-size-4);
  margin-left: -20px;
  line-height: 1;
```

`padding-right` は、記号と見出しの間を少し空けるための余白です。`line-height: 1` は、記号を一行分の高さに収めて、見出しの行の中で上下にずれないようにします。

## ここがすごい

- 目印を見出しの外に出すので、見出しのレイアウトを崩さずに、リンクの記号を追加できます。読み手が見出しの文字を追うときに、邪魔になりません。
- 負の margin という一つの仕掛けで、本文の位置と記号の位置を同時に決めています。
- 素直に、目印を見出しの右側に置くと、見出しの長さによって位置がばらばらになります。左に出すと、見出しの長さに関係なく、同じ場所に並びます。
- マウスを乗せたときだけ表示する仕掛けと組み合わさるため、普段は目立ちません。

## まとめ

- `float: left` と負の `margin-left` で、要素を見出しの左外側に出せます。
- `line-height: 1` で、記号の縦の位置を安定させられます。
- 見出しの本文の位置を変えずに、補助の記号を付けられます。
