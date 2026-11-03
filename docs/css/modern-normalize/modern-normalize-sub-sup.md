---
title: "上付き・下付き文字で行の高さを崩さない"
description: "sub と sup に position と vertical-align を組み合わせて、文字だけを上下にずらす。行の高さが変わらない理由を解説する。"
language: css
project: undefined
repo: https://github.com/sindresorhus/modern-normalize
license: MIT
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com); Copyright (c) Jonathan Neal"
commit: "076c61bd806ba4770a8d766d8e63903e4fb0dfa6"
file: modern-normalize.css
lines: [98, 112]
function: "\"sub, sup\""
difficulty: 2
format: 2
tags: [ハック, 移植性]
---
## ひとことで

数式の `x²` や化学式の `H₂O` のように、文字を上下にずらして示す `sup`（上付き）と `sub`（下付き）のスタイルを決めるルールです。文字を小さくして、`position: relative` で位置をずらします。ずらしても行の高さが変わらないように、`line-height: 0` を組み合わせているのがポイントです。

## コード

```css:line-numbers=98
sub,
sup {
	font-size: 75%;
	line-height: 0;
	position: relative;
	vertical-align: baseline;
}

sub {
	bottom: -0.25em;
}

sup {
	top: -0.5em;
}
```

## 前提知識

- **vertical-align**: インラインの要素を、行の中で上下にどう揃えるかを決めるプロパティです。`baseline` は文字の基準線に揃える指定です。
- **position: relative**: 要素を通常の位置から相対的にずらすプロパティです。ずらしても、周りの要素の位置は変わりません。
- **line-height**: 行の高さです。`0` にすると、その要素は行の高さの計算に影響しなくなります。
- **em 単位**: 現在の要素の文字サイズを基準にした長さの単位です。`-0.25em` は文字サイズの 4 分の 1 だけ下方向へずらすという意味です。

## 何をしているか

### 1. 共通の設定で、行の高さへの影響をなくす

```css:line-numbers=98
sub,
sup {
	font-size: 75%;
	line-height: 0;
	position: relative;
	vertical-align: baseline;
}
```

`sub` と `sup` は、文字サイズを 75% にして小さく表示します。`line-height: 0` は、この要素の行の高さをゼロとして扱わせる指定です。これで、上付きの文字が行の上側に出ても、行全体の高さが広がりません。

`vertical-align: baseline` は、文字の基準線に揃える指定です。`position: relative` は、通常の位置からずらすための準備です。`top` や `bottom` を指定すると、この位置からの相対的な移動量になります。

### 2. 上と下へのずらし量

```css:line-numbers=106
sub {
	bottom: -0.25em;
}

sup {
	top: -0.5em;
}
```

`sub` は `bottom: -0.25em`、つまり下へ文字サイズの 4 分の 1 ずれます。`sup` は `top: -0.5em`、つまり上へ半分ずれます。どちらも `em` で書いてあるので、文字が大きくなれば、ずれの量も一緒に大きくなります。

## ここがすごい

- 文字を上下にずらしても、行の高さが変わらないという点がこの書き方の要です。`line-height: 0` だけでは位置がずれず、`position` だけでは行の高さが変わってしまいます。二つを組み合わせて初めて、両方が満たされます。
- `sub` と `sup` の二つを共通のルールにまとめ、違う部分だけを個別に書いています。共通部分と違う部分が一目でわかります。
- 素直に書くと、`sup { vertical-align: super; font-size: smaller; }` のように `vertical-align` だけを使う書き方もあります。ただしその場合は行の高さが広がり、段落の間隔がずれることがあります。
- `position` でずらす方法は、フォントや行の高さに関係なく、同じ量だけずれるという利点があります。

## まとめ

- 上付き・下付きは、文字を小さくして `position: relative` でずらすのが基本です。
- `line-height: 0` を組み合わせると、行の高さを崩さずに済みます。
- ずらし量を `em` で書くと、文字の大きさに比例して調整されます。
- 共通部分をまとめて、違う部分だけを個別に書くと、読みやすくなります。
