---
title: "メニューの一覧から点と余白を消す"
description: "Pure CSS の .pure-menu-list は list-style と margin、padding を 0 にして、ul の標準の点と字下げを消す。見た目を自分で決めるための、リストの初期化。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/menus/css/menus-core.css
lines: [18, 22]
function: "\".pure-menu-list\""
difficulty: 1
format: 2
tags: [レイアウト]
---
## ひとことで

Pure CSS の `.pure-menu-list` は、メニューの一覧に付く点と字下げを消す指定です。`ul` の標準の見た目を取り払って、メニューとして組み直せるようにします。

## コード

```css:line-numbers=18
.pure-menu-list {
    list-style: none;
    margin: 0;
    padding: 0;
}
```

## 前提知識

- **ul 要素**: 順序のない一覧を表す HTML の要素です。ブラウザは通常、点と字下げを付けます。
- **list-style**: 一覧の先頭記号の種類を決めるプロパティです。`none` は記号を消します。
- **margin と padding**: 外側と内側の余白です。ブラウザの既定値をゼロにすると、位置を自分で決められます。

## 何をしているか

### 1. 点を消す

```css:line-numbers=18
.pure-menu-list {
    list-style: none;
    margin: 0;
```

`list-style: none` で、項目の先頭の点を表示しません。

### 2. 余白をゼロにする

```css:line-numbers=21
    padding: 0;
```

外側の余白をなくします。

```css:line-numbers=22
}
```

内側の余白もなくします。ナビゲーションの横並びや、縦並びを正確に組めます。

## ここがすごい

一覧の見た目をリセットするだけの短いルールで、メニュー全体の基礎ができます。

ul の既定の点と字下げを消すと、メニューを自分の設計で組み直せます。リストの見た目に頼らず、横並びや縦並びを flex などで自由に決められるのが利点です。まず既定の見た目をゼロにしておくと、後のスタイルがどのように効くかがわかりやすくなります。

リストの点を消すと、スクリーンリーダーが項目を一覧として読む手がかりも変わります。そのため、見た目を消す指定は、役割を持つ要素の構造を変えないように、必要な範囲だけで使うことが大切です。Pure はこの一覧を、メニューの土台として最小限の指定にとどめています。

## まとめ

`ul` の既定の見た目を消すことが、メニューを組む最初の一歩です。
