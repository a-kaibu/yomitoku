---
title: "フォームの枠と見出しの文字を小さくそろえる"
description: "Chota の fieldset は余白を決め、legend は大文字にして文字間を広げる。フォームのまとまりの見出しを、本文より小さく目立たせる指定。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_form.css
lines: [1, 9]
function: "\"fieldset\""
difficulty: 1
format: 2
tags: [フォーム, 配色]
---
## ひとことで

Chota の `fieldset` と `legend` は、フォームの入力項目をまとめる枠と、その見出しの見た目を決めるルールです。

## コード

```css:line-numbers=1
fieldset {
  padding: 0.5rem 2rem;
}

legend {
  text-transform: uppercase;
  font-size: 0.8em;
  letter-spacing: 0.1rem;
}
```

## 前提知識

- **fieldset**: 関連する入力欄をまとめる HTML の要素です。
- **legend**: fieldset の見出しを表す要素です。枠線の上に乗ります。
- **text-transform**: 文字を大文字や小文字に変えて表示します。

## 何をしているか

### 1. 枠の余白を決める

```css:line-numbers=1
fieldset {
  padding: 0.5rem 2rem;
}
```

fieldset の内側に、上下 0.5rem、左右 2rem の余白を取ります。

### 2. 見出しの文字を整える

```css:line-numbers=5
legend {
  text-transform: uppercase;
  font-size: 0.8em;
  letter-spacing: 0.1rem;
}
```

legend の文字を大文字にし、少し小さく、文字の間を広げています。本文より控えめな見出しになります。

## ここがすごい

HTML の要素名だけを指定しているので、クラスを付けずに、フォームのまとまりが同じ見た目になります。

フォームの入力欄は、見出しと本文がそろって初めて読みやすくなります。legend の文字を小さくして大文字にすると、見出しが本文より控えめに見えます。また、文字の間隔を少し広げると、短い語でも区切りがはっきりします。fieldset の余白と合わせて、フォームのまとまりを一目で伝えられる作りになっています。

fieldset と legend は、支援技術にも「この欄はこの見出しのまとまりである」と伝わる要素です。見た目を整えるだけでなく、HTML の構造を正しく使うことが、読みやすさと使いやすさの両方につながります。このルールは、その構造に見た目を後から添えるだけの、控えめな役割を持っています。

## まとめ

要素名だけを使ってフォームの見出しをそろえる、シンプルな書き方です。
