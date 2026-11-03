---
title: "本文の幅を 800px に抑えて中央に置く"
description: "Water.css の body は max-width を 800px にし、margin を上下 20px と左右 auto にして、読みやすい行の長さで本文を中央に置く。ページ全体の幅を一か所で決める書き方。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [2, 11]
function: "\"body\""
difficulty: 2
format: 2
tags: [レイアウト, 可読性]
---
## ひとことで

Water.css は、`body` の幅に上限を付けて、本文を画面の中央にまとめます。広い画面でも、一行が長くなりすぎないようにするための指定です。

## コード

```css:line-numbers=2
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.4;
  max-width: 800px;
  margin: 20px auto;
  padding: 0 10px;
  color: #363636;
  background: #ffffff;
  text-rendering: optimizeLegibility;
}
```

## 前提知識

- **max-width**: 要素の幅の上限を決めるプロパティです。画面が広くても、この値より広がりません。
- **margin: auto**: 左右の余白を自動にすると、箱が親の中央に置かれます。
- **行の長さ**: 一行に入る文字数が多すぎると、次の行へ視線を移すのが大変になります。読みやすい目安は、おおよそ半角 80 字前後と言われます。
- **line-height**: 行と行の間隔です。ここでは 1.4 で、長い本文でも行が詰まりすぎないようにしています。

## 何をしているか

### 1. 幅の上限と中央寄せ

```css:line-numbers=5
  max-width: 800px;
  margin: 20px auto;
```

幅を 800px までに制限し、上下に 20px、左右を自動にします。画面が広いときは、箱が中央に寄ります。

### 2. 端の余白と文字の色

```css:line-numbers=7
  padding: 0 10px;
  color: #363636;
  background: #ffffff;
  text-rendering: optimizeLegibility;
```

左右には 10px の余白を残し、狭い画面でも文字が端に張り付かないようにしています。文字色と背景色も、この箱に付けます。

## ここがすごい

HTML にクラスを一つも付けずに、ページ全体の読みやすい幅を決めています。body の一行だけで、すべての本文が同じ幅に収まります。

本文の幅が広すぎると、視線が次の行へ戻るときに迷いやすくなります。800px という上限は、多くの画面で一行の文字数を読みやすい範囲に収める目安です。本文を中央に置くことで、大きな画面でも、左右の余白が自然に釣り合います。一つの body の指定が、ページ全体の読みやすさの土台になっています。

## まとめ

body に上限の幅と中央寄せを与えると、どの画面でも読みやすい本文の箱ができます。
