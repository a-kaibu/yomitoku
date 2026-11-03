---
title: "記号を消した ol を、そのまま並べる箱にする"
description: "ol.no-list に padding を 0 にし、list-style-type を none にして、番号も字下げもないリストにする。Markdown で番号を使わずに項目をまとめたいときの、リストの特別な形。"
language: css
project: undefined
repo: https://github.com/sindresorhus/github-markdown-css
license: MIT
copyright: "\"Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)\""
commit: "7f38dcb9054bc5d860fac65291f5c98fef47932c"
file: github-markdown.css
lines: [636, 639]
function: "\".markdown-body ol.no-list\""
difficulty: 1
format: 2
tags: [設計パターン, 可読性]
---
## ひとことで

`no-list` というクラスを付けた `ol` の、番号と字下げを消すルールです。`ol` は本来、番号を付けて字下げをする要素ですが、このクラスを付けると、ただの項目の並びとして使えます。番号を付けたくないが、リストの構造は残したいときの仕掛けです。

## コード

```css:line-numbers=636
.markdown-body ol.no-list {
  padding: 0;
  list-style-type: none;
}
```

## 前提知識

- **ol 要素**: 番号付きのリストを表す HTML 要素です。
- **list-style-type: none**: 項目の前に付く番号や記号を消す指定です。
- **padding**: 要素の内側の余白です。リストの既定では、左側に字下げの余白があります。
- **クラスによる上書き**: 要素の種類を変えずに、クラス名だけで見た目を変える方法です。

## 何をしているか

### 1. 字下げをゼロにする

```css:line-numbers=637
  padding: 0;
```

`padding: 0` で、リストの左側の字下げをなくします。番号が消えても字下げが残ると、左に空白ができてしまうので、この指定とセットになっています。

### 2. 番号を消す

```css:line-numbers=638
  list-style-type: none;
```

`list-style-type: none` で、項目の前の番号を消します。構造は `ol` のまま残るので、読み上げや意味の上では番号付きのリストのままです。

## ここがすごい

- 要素の種類を `div` に変えずに、見た目だけを変えています。HTML の意味（リストであること）を保ったまま使えます。
- 字下げと番号を別々の指定で消していて、どちらが残っても困らないように、役割を分けています。
- 素直に `ol` を `div` に置き換えると、リストとしての意味が消えます。クラスで見た目だけ変える方が、構造を失いません。
- 一つのクラスで二つの指定をまとめているので、使う側は一つ付けるだけで済みます。

## まとめ

- `list-style-type: none` で番号を消せます。
- `padding: 0` で字下げも消します。
- 要素の種類を変えず、クラスで見た目だけを変えると、リストの構造が残ります。
