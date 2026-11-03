---
title: "画像や SVG を文字の中央に揃える"
description: "audio、canvas、iframe、img、svg、video の vertical-align を middle にする。インラインの画像が文字の下にずれるのを防ぎ、文字と並べたときの見た目を揃える。"
language: css
project: undefined
repo: https://github.com/picocss/pico
license: MIT
copyright: "\"Copyright (c) 2019-2024 Pico\""
commit: "a07563ddc856e6ed31a740e33b0397814227d469"
file: css/pico.css
lines: [1156, 1158]
function: "\":where(audio, canvas, iframe, img, svg, video)\""
difficulty: 1
format: 2
tags: [移植性, イディオム]
---
## ひとことで

画像や動画などの埋め込み要素の `vertical-align` を `middle` にするルールです。これらの要素が文字と同じ行に並ぶとき、文字の中央に揃えられます。`:where()` で囲んでいるので、利用者はいつでも上書きできます。

## コード

```css:line-numbers=1156
:where(audio, canvas, iframe, img, svg, video) {
  vertical-align: middle;
}
```

## 前提知識

- **置換要素（embedded content）**: 画像や動画のように、中身が外側の資源で決まる要素です。`img`、`svg`、`video`、`iframe` などがあります。
- **vertical-align**: インラインの要素を、行の中で上下どう揃えるかを決めるプロパティです。`middle` は、要素の中央を、親の文字の中央に合わせます。
- **インライン要素**: 文字と同じ行に並ぶ要素です。画像を文中に置いたときが典型です。
- **:where()**: 括弧の中の条件を詳細度に数えない疑似クラスです。

## 何をしているか

### 1. 埋め込み要素の対象

```css:line-numbers=1156
:where(audio, canvas, iframe, img, svg, video) {
```

音声、キャンバス、iframe、画像、SVG、動画のすべてを、一つのセレクタにまとめています。`:where()` によって詳細度はゼロなので、利用者の指定が優先されます。

### 2. 中央に揃える

```css:line-numbers=1157
  vertical-align: middle;
```

`vertical-align: middle` で、要素の中央を文字の中央に合わせます。画像が文字の下に少しずれて見える問題を防ぎます。

## ここがすごい

- 対象をまとめているので、画像だけ、SVG だけと分けて書く必要がありません。新しい埋め込み要素を使っても、同じ見た目になります。
- 詳細度をゼロにしているので、利用者が `img` に別の揃え方を書けば、それが優先されます。部品のライブラリとして、上書きしやすい書き方です。
- 素直に `img { vertical-align: middle; }` だけを書くと、SVG や動画が同じ揃え方になりません。対象をまとめると、その取りこぼしを防げます。
- 文字と画像の関係という、小さな問題を一行で解決しています。

## まとめ

- 埋め込み要素をまとめて対象にすると、取りこぼしがなくなります。
- `vertical-align: middle` で、文字の中央に画像を揃えられます。
- `:where()` で詳細度をゼロにすると、利用者が上書きしやすくなります。
