---
title: "画像の下にできる隙間を display: block で消す"
description: "img や svg などの置換要素を display: block にして、文字の行の下にできる余計な隙間をなくす。vertical-align も middle にそろえる。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [214, 224]
function: "\"img, svg, video, canvas, audio, iframe, embed, object\""
difficulty: 2
format: 2
tags: [移植性, 可読性]
---
## ひとことで

`img` や `svg` などの「置換要素」を、既定の `display: block` で描くルールです。画像は既定では文字と同じ行に並ぶ箱として扱われ、その下に小さな隙間が生まれることがあります。このルールは、それを消すために画像をブロックとして扱い直します。

## コード

```css:line-numbers=214
img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block; /* 1 */
  vertical-align: middle; /* 2 */
}
```

## 前提知識

- **置換要素（replaced element）**: 画像や動画のように、CSS の外側にある内容で大きさが決まる要素です。`img`、`svg`、`video`、`iframe` などがあります。
- **display: block**: 要素を、前後で改行される大きな箱として扱うという値です。
- **display: inline**: 要素を、文字と同じ行に並ぶ小さな箱として扱うという値です。画像の既定もこれに近いです。
- **vertical-align**: インラインの要素を、行の中でどう揃えるかを決めるプロパティです。`middle` は、文字の中央に揃えるという指定です。

## 何をしているか

### 1. 置換要素をブロックとして描く

```css:line-numbers=214
img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block; /* 1 */
  vertical-align: middle; /* 2 */
}
```

`display: block` にすると、画像は行の中の文字ではなく、独立した箱になります。その結果、画像の下に文字の基準線の分の隙間が残らなくなります。

`vertical-align: middle` は、もし画像を文字と並べて使ったときに、中央で揃えるという既定の動きを決めています。コメント 2 にあるとおり、これは「設計上そう決めた」と書かれていて、一部のツールから注意が出ることがあるとも説明されています。

## ここがすごい

- 画像の下に出る余計な隙間は、CSS に詳しくない人が最初につまずきやすい問題です。その原因を一行で解決しています。
- 対象が `img` や `svg` だけでなく、`video`、`canvas`、`iframe` まで広がっています。どれも同じ問題が起きるので、まとめて扱うのが合理的です。
- 素直に `img { display: block; }` だけを書くと、`svg` や `video` で同じ隙間が残ります。対象を並べることで、取りこぼしを防いでいます。
- コメントに、将来の lint の警告が出ることまで書かれています。ツールの注意よりも、見た目の設計を優先するという判断が明確です。

## まとめ

- 画像などの置換要素は、既定でインラインの箱として扱われ、下に隙間が生まれることがあります。
- `display: block` で箱を独立させると、隙間がなくなります。
- `vertical-align: middle` で、文字と並べたときの揃え方も整えます。
- 対象を置換要素まとめて書くと、取りこぼしが減ります。
