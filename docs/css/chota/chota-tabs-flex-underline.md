---
title: "下線で示すタブを flex で並べる"
description: "Chota の .tabs は display: flex で項目を並べ、リンクの下の枠線を 2px にして、タブの見た目を作る。タブの幅を内容に合わせるか、全幅に広げるかを、クラスで切り替える。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_tab.css
lines: [1, 16]
function: "\".tabs\""
difficulty: 2
format: 2
tags: [レイアウト, 設計パターン]
---
## ひとことで

リンクを横に並べて、タブのように見せるルールです。`.tabs` は `display: flex` で項目を横に並べ、各項目の下に 2px の枠線を付けます。下線が、今どのタブを選んでいるかを示す目印になります。

## コード

```css:line-numbers=1
.tabs {
  display: flex;
}

.tabs a {
  text-decoration: none;
}

.tabs > .dropdown > summary,
.tabs > a {
  padding: 1rem 2rem;
  flex: 0 1 auto;
  color: var(--color-darkGrey);
  border-bottom: 2px solid var(--color-lightGrey);
  text-align: center;
}
```

## 前提知識

- **flex**: 子要素を横に並べる、レイアウトの仕組みです。
- **border-bottom**: 要素の下の枠線です。タブの下線として使われます。
- **flex-basis と flex-grow**: `flex: 0 1 auto` は、伸びずに、縮むことはでき、基準の幅は内容に合わせる、という指定です。
- **dropdown**: 前の記事で見た、開閉できるメニューの部品です。タブの中にも置けます。

## 何をしているか

### 1. 横に並べて、下線を引く

```css:line-numbers=1
.tabs {
  display: flex;
}
```

`.tabs` は `display: flex` で、中の項目を横に並べます。リンクの下線は `text-decoration: none` で消しておきます。

### 2. 項目の大きさと下線

```css:line-numbers=9
.tabs > .dropdown > summary,
.tabs > a {
  padding: 1rem 2rem;
  flex: 0 1 auto;
  color: var(--color-darkGrey);
  border-bottom: 2px solid var(--color-lightGrey);
  text-align: center;
}
```

タブの項目（リンクやドロップダウンの見出し）には、余白と、下の 2px の線が付きます。`flex: 0 1 auto` は、項目の幅を内容に合わせます。`text-align: center` で、文字を真ん中に寄せます。

## ここがすごい

- 下線を `border-bottom` で描いているので、タブの高さが変わらず、下線だけが目立ちます。
- タブの項目を、リンクとドロップダウンの両方に同じ見た目で当てています。
- 素直に、タブごとに幅を決めると、項目が増えるたびに直す必要があります。`flex` で内容に合わせるほうが、項目の数に強くなります。
- 下線の色を変えるだけで、今のタブを示せる仕組みは、次の記事で見る `.active` と組み合わさっています。

## まとめ

- `display: flex` でタブを横に並べられます。
- 下線を `border-bottom` で描くと、高さが変わらず目印になります。
- 項目の幅は内容に合わせると、数が増えても崩れにくくなります。
