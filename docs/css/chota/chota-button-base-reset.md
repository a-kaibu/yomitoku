---
title: "ボタンとリンクの共通の見た目を一度に決める"
description: "Chota の .button と button は、余白、背景色、角丸、文字、transform などを一つのルールで決め、リンクの見た目もボタンに寄せる。個別の色はあとから上書きする。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_form.css
lines: [40, 58]
function: "\".button, button\""
difficulty: 2
format: 2
tags: [フォーム, 設計パターン]
---
## ひとことで

Chota のボタンのルールは、`.button` と `button` に共通の見た目を一度に決めます。色や大きさの違いは、あとから別のクラスで上書きします。

## コード

```css:line-numbers=40
.button,
[type="button"],
[type="reset"],
[type="submit"],
button {
  padding: 1rem 2.5rem;
  color: var(--color-darkGrey);
  background: var(--color-lightGrey);
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: var(--font-size);
  line-height: 1;
  text-align: center;
  transition: opacity 0.2s ease;
  text-decoration: none;
  transform: scale(1);
  display: inline-block;
  cursor: pointer;
}
```

## 前提知識

- **セレクタのまとめ書き**: カンマで区切ると、同じ宣言を複数の要素に当てられます。
- **inline-block**: 文字と並んで置ける箱です。ボタンの幅を中身に合わせられます。
- **transform: scale(1)**: 大きさを変えない変換です。後でホバー時に拡大するための足場になります。

## 何をしているか

### 1. 対象をまとめる

```css:line-numbers=40
.button,
[type="button"],
[type="reset"],
[type="submit"],
button {
```

`.button` のクラスと、`type` が button・reset・submit のもの、button 要素をまとめて選びます。

### 2. 大きさと見た目を決める

```css:line-numbers=45
  padding: 1rem 2.5rem;
  color: var(--color-darkGrey);
  background: var(--color-lightGrey);
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: var(--font-size);
  line-height: 1;
  text-align: center;
  transition: opacity 0.2s ease;
```

余白、文字の大きさ、背景、枠線、角丸を決めています。どのボタンも同じ大きさの基礎を持ちます。

### 3. 動きの準備をする

```css:line-numbers=54
  text-decoration: none;
  transform: scale(1);
  display: inline-block;
  cursor: pointer;
}
```

透明度の変化と、表示の向きを整えています。クラスが付いたボタンは、ホバーなどで色や大きさを変えやすくなります。

## ここがすごい

`button` 要素と `.button` のクラスを同じルールで扱うので、リンクを見た目だけボタンにしたい場面にも使えます。

共通の基礎を持つと、ボタンごとに余白や角丸を書き直す手間が省けます。たとえば `.primary` のような色のクラスは、この基礎の上に背景色だけを上書きすれば済みます。見た目の差分を小さくまとめておくと、後からテーマを変えるときも、直す場所が一か所で済みます。また、枠線を透明にしておくことで、グループ化したボタンの境界が揃う、という細かな配慮も読み取れます。

## まとめ

共通の基礎をひとつのルールに集めると、ボタンの種類が増えても見た目がそろいます。
