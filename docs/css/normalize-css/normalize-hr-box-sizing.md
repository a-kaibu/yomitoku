---
title: "水平線の箱の計算と高さを統一する"
description: "normalize.css は hr の box-sizing を content-box、height を 0、overflow を visible にし、Firefox や Edge の既定の計算の差を消す。区切り線の太さを枠線だけで決める書き方。"
language: css
project: undefined
repo: https://github.com/necolas/normalize.css
license: MIT
copyright: "\"Copyright © Nicolas Gallagher and Jonathan Neal\""
commit: "fc091cce1534909334c1911709a39c22d406977b"
file: normalize.css
lines: [53, 57]
function: "\"hr\""
difficulty: 2
format: 2
tags: [レイアウト, 移植性]
---
## ひとことで

normalize.css は、水平線の `hr` の計算方法と高さを決めて、ブラウザごとに太さが変わるのを防ぎます。区切りの線は、枠線の太さだけで決まります。

## コード

```css:line-numbers=53
hr {
  box-sizing: content-box; /* 1 */
  height: 0; /* 1 */
  overflow: visible; /* 2 */
}
```

## 前提知識

- **box-sizing**: 幅や高さに、余白と枠線を含めるかどうかを決めるプロパティです。content-box は、中身だけで計算します。
- **hr**: 話題の区切りを表す HTML の要素です。見た目は、ブラウザが枠線として描きます。
- **height: 0**: 中身の高さをゼロにすることで、枠線の太さだけが線の高さになります。
- **overflow**: 箱の中に入りきらない内容を、どう扱うかを決めます。visible は、はみ出しを見せる指定です。

## 何をしているか

### 1. 計算の方法を決める

```css:line-numbers=53
hr {
  box-sizing: content-box; /* 1 */
```

content-box で計算し、高さを 0 にします。枠線の太さが、そのまま線の太さになります。

### 2. はみ出しを見せる

```css:line-numbers=56
  overflow: visible; /* 2 */
```

overflow を visible にして、Edge や IE でも線の端が切れないようにします。

## ここがすごい

HTML の要素を変えずに、線の太さを CSS の決まりだけで決められます。どのブラウザでも、同じ太さの区切りになります。

水平線は、本文の中の区切りとして使われます。太さがブラウザによって違うと、同じ文書でも区切りの重さが変わり、読み手が混乱します。box-sizing と height を組で決めることで、枠線の太さだけが線の太さになるよう、計算の基準をそろえています。

## まとめ

box-sizing と height を一組で決めると、水平線の太さを、ブラウザ間で揃えられます。
