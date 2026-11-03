---
title: "details だけでドロップダウンを作る"
description: "Chota は details.dropdown の中の最後の子要素を絶対配置にして、開閉のたびに出てくるメニューを作る。JavaScript を使わずに、HTML の開閉の仕組みだけで動くドロップダウン。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_dropdown.css
lines: [1, 10]
function: "\"details.dropdown\""
difficulty: 2
format: 2
tags: [設計パターン, レイアウト]
---
## ひとことで

`details` 要素に `dropdown` というクラスを付けて、中の最後の要素を絶対配置にすると、開いたときだけ浮かぶメニューになるルールです。JavaScript を書かなくても、ブラウザの開閉の仕組みだけで、ドロップダウンのように動きます。

## コード

```css:line-numbers=1
details.dropdown {
  position: relative;
  display: inline-block;
}

details.dropdown > :last-child {
  position: absolute;
  left: 0;
  white-space: nowrap;
}
```

## 前提知識

- **details と summary**: 開閉できる HTML 要素です。`summary` が見出しで、クリックすると中身が開きます。
- **position: absolute**: 要素を、基準になる箱からの相対位置で配置する指定です。周りのレイアウトに場所を取りません。
- **position: relative**: 子要素の配置の基準になる箱を作る指定です。
- **:last-child**: 親の中で最後の子要素に一致する疑似クラスです。

## 何をしているか

### 1. 基準になる箱を作る

```css:line-numbers=1
details.dropdown {
  position: relative;
  display: inline-block;
}
```

`details.dropdown` は `position: relative` で、中の要素の基準になります。`display: inline-block` で、周りの文字と同じ行に並びます。

### 2. 最後の子を浮かせる

```css:line-numbers=6
details.dropdown > :last-child {
  position: absolute;
  left: 0;
  white-space: nowrap;
}
```

`details.dropdown > :last-child` は、中の最後の要素を対象にします。多くの場合、これがメニューの中身です。`position: absolute` で、周りのレイアウトに場所を取らずに浮かせ、`left: 0` で、基準の箱の左端に揃えます。`white-space: nowrap` で、項目の文字が折り返されずに、一行で並びます。

## ここがすごい

- 開閉の状態を、ブラウザの `details` の仕組みに任せています。JavaScript で開閉を管理すると、キーボードの操作なども自分で書く必要がありますが、ここでは既定の動きを使えます。
- メニューを浮かせることで、開いたときに周りの文章が押し下げられません。
- 素直に、JavaScript で表示と非表示を切り替えると、クリックの処理や閉じる処理を、すべて書く必要があります。
- 最後の子だけを浮かせるという単純な選び方で、見出しと中身を区別しています。

## まとめ

- `details` の開閉を使うと、JavaScript なしでドロップダウンを作れます。
- `position: absolute` で、メニューが周りのレイアウトを押し下げません。
- `:last-child` で、中身の要素を選べます。
