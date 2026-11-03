---
title: "fieldset の余白を 0 にしても崩れないための legend 設定"
description: "legend の padding を 0 にリセットする理由を解説する。fieldset の枠や余白を消すときに、legend だけ余白が残る既定の挙動を防ぐ。"
language: css
project: undefined
repo: https://github.com/sindresorhus/modern-normalize
license: MIT
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com); Copyright (c) Jonathan Neal"
commit: "076c61bd806ba4770a8d766d8e63903e4fb0dfa6"
file: modern-normalize.css
lines: [163, 165]
function: "legend"
difficulty: 1
format: 2
tags: [防御的プログラミング, 移植性]
---
## ひとことで

`legend` 要素の `padding` を `0` にするルールです。`legend` は `fieldset`（入力項目のまとまり）の枠に乗る見出しです。ブラウザはこの見出しに既定の余白を付けるため、利用者が `fieldset` の余白を消しても、`legend` だけ余白が残ってしまいます。このルールは、その食い違いを先に解消します。

## コード

```css:line-numbers=163
legend {
	padding: 0;
}
```

## 前提知識

- **fieldset 要素**: フォームの入力項目をひとまとまりにまとめる HTML 要素です。枠線が描かれるのが既定です。
- **legend 要素**: `fieldset` の見出しを表す要素です。枠線の上に乗るように表示されます。
- **padding**: 要素の内側の余白です。枠線と中身の間を広げます。
- **既定値**: ブラウザが最初から持っている値のことです。`padding` が 0 でない場合、そのまま余白として表示されます。

## 何をしているか

### 1. legend の内側の余白を消す

```css:line-numbers=163
legend {
	padding: 0;
}
```

`legend { padding: 0; }` は、見出しの内側の余白をゼロにします。コメントにあるとおり、これは `fieldset` の余白をゼロにしたい開発者が、予想外のずれに悩まされないための指定です。

## ここがすごい

- 目立たない行ですが、「既定の挙動で困る人を先回りして助ける」という考え方が表れています。リセットの対象になりにくい部品まで、目を配っています。
- `fieldset` の余白や枠線をゼロにすると、枠線の上に乗る `legend` だけがずれて見えることがあります。この 1 行を入れておくと、その食い違いを防げます。
- 素直に書けば、`fieldset` のリセットと一緒に `legend` の余白も個別に書くことになります。二つの要素の関係を知らないと、書き忘れやすい部分です。
- リセットの対象を広げすぎず、`padding` だけに限定しているのも特徴です。見出しの文字の大きさや色は、そのまま残されています。

## まとめ

- `legend` はブラウザの既定で余白を持つことがあります。
- `fieldset` の余白を消しても、`legend` の余白が残ると見た目がずれます。
- `legend` の `padding` を 0 にすると、その食い違いを防げます。
- リセットの対象を、問題になる要素と性質だけに絞ると、ほかの見た目は変わりません。
