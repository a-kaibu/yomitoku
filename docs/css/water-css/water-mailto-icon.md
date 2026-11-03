---
title: "メールのリンクに封筒の絵文字を前置きする"
description: "Water.css は href が mailto で始まる a の前に、封筒の絵文字を ::before で挿入する。リンクの種類を、文字を変えずに一目で示す、疑似要素の使い方。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [73, 75]
function: "\"a[href^='mailto']::before\""
difficulty: 2
format: 2
tags: [疑似要素, 配色]
---
## ひとことで

Water.css は、メールアドレスへのリンクの前に、封筒の絵文字を自動で付けます。HTML の文字を書き換えずに、リンクの種類が分かるようにする指定です。

## コード

```css:line-numbers=73
a[href^='mailto']::before {
  content: '📧 ';
}
```

## 前提知識

- **属性セレクタ**: 要素の属性の値で対象を選ぶ書き方です。`[href^='mailto']` は、href が mailto で始まるものを選びます。
- **^=**: 「で始まる」を表す比較の記号です。最後が一致するものを選ぶ $= などもあります。
- **::before**: 要素の中の先頭に、仮想の内容を差し込む疑似要素です。HTML には現れない文字を、CSS から付けられます。
- **content**: ::before に入る文字や記号を決めるプロパティです。

## 何をしているか

### 1. 対象を選ぶ

```css:line-numbers=73
a[href^='mailto']::before {
```

href が mailto で始まる a 要素を選びます。メールのリンクだけに、この印が付きます。

### 2. 絵文字を前に置く

```css:line-numbers=74
  content: '📧 ';
```

content に封筒の絵文字と空白を入れます。リンクの文字の前に、印が自然に並びます。

## ここがすごい

リンクの種類を、HTML を書き換えずに、属性だけで判断しています。書き手が絵文字を付け忘れても、同じ種類のリンクには必ず印が付きます。

メールの連絡先は、本文の中に埋もれがちです。封筒の印を前に付けると、読み手がそれを連絡先だと、一瞬で判断できます。HTML の文字は変えずに、属性だけで印を付けるため、書き手が忘れても、同じ種類のリンクには自動で付きます。ただし、絵文字はフォントによって見た目が変わるため、補足として使うのが安全です。

## まとめ

属性セレクタと ::before を組み合わせると、リンクの種類を見た目で示せます。絵文字の役割は、読み手が連絡先だと気づくための手がかりです。
