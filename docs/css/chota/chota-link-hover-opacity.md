---
title: "リンクはホバーで薄くして、ボタンは除く"
description: "Chota の a:hover:not(.button) は、リンクにマウスを乗せると opacity を 0.75 にする。ボタンのように見せたリンクには効かせず、役割の違う要素を区別する。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_base.css
lines: [78, 85]
function: "\"a:hover:not(.button)\""
difficulty: 1
format: 2
tags: [可読性, 設計パターン]
---
## ひとことで

リンクにマウスを乗せたときに、リンクを少し薄く見せるルールです。ただし、`button` クラスを付けたリンクは対象から外しています。ボタンとして使われるリンクは、ホバーで薄くなると、押せそうな印象が弱まるためです。

## コード

```css:line-numbers=78
a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover:not(.button) {
  opacity: 0.75;
}
```

## 前提知識

- **:hover**: マウスカーソルが要素の上にあるときに一致する疑似クラスです。
- **:not(.button)**: `button` クラスを持たない要素に一致する否定の条件です。
- **opacity**: 要素の不透明度です。`0.75` は、四分の三の濃さで見える値です。
- **色（primary）**: リンクの文字色は、`--color-primary` の変数から取られています。

## 何をしているか

### 1. リンクの色と下線

```css:line-numbers=78
a {
  color: var(--color-primary);
  text-decoration: none;
}
```

`a` は、変数の主要な色で文字を表示し、下線をなくします。この段階では、リンクはまだ見分けがつくけれど、本文の色と区別しやすい形です。

### 2. ホバーで薄くする

```css:line-numbers=83
a:hover:not(.button) {
  opacity: 0.75;
}
```

`a:hover:not(.button)` は、マウスを乗せたリンクだけを対象にします。`opacity: 0.75` で、少し薄くなります。ボタンのクラスを持つリンクは、この条件から外れるので、変化がありません。

## ここがすごい

- 「リンクは薄くなる」「ボタンは変わらない」という違いを、一つのセレクタで書き分けています。
- 薄くする方法は色を変えないので、テーマの色の変更に影響されず、どんな配色でも同じ変化になります。
- 素直に `a:hover { color: red; }` とすると、色を決め打ちすることになります。透明度なら、色の仕組みをそのまま使えます。
- 否定の条件を使うことで、ライブラリ側のボタンのデザインを守っています。

## まとめ

- `:not(.button)` で、ボタンのように使うリンクを除けます。
- `opacity` は、色を変えずに濃さだけを変えられます。
- 役割の違う要素を、セレクタの条件で分けると、見た目の一貫性が保たれます。
