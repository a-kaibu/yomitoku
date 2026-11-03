---
title: "画像を枠いっぱいに切り抜く object-fit: cover"
description: "Bootstrap の .object-fit-cover は object-fit: cover を当て、画像の縦横比を保ったまま、枠を隙間なく埋めるように切り抜く。写真のサムネイルを同じ大きさの枠に揃える定番。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [934, 936]
function: "\".object-fit-cover\""
difficulty: 2
format: 2
tags: [レイアウト, 移植性]
---
## ひとことで

`img` や `video` の表示の仕方を決める `object-fit: cover` を、クラスとして使えるようにしたものです。画像は縦横比を保ったまま、枠を隙間なく埋めるように拡大され、はみ出した部分は切り抜かれます。

## コード

```css:line-numbers=934
  .object-fit-cover {
    object-fit: cover;
  }
```

## 前提知識

- **object-fit**: 画像や動画を、枠の中にどう収めるかを決めるプロパティです。`contain` は全体が入るように縮め、`cover` は枠を埋めるように拡大します。
- **縦横比**: 画像の幅と高さの比率です。`object-fit` は、この比率を崩さずに、枠との関係を決めます。
- **枠**: 画像を入れる箱の大きさです。幅と高さが決まっているときに、この指定の効果が見えます。
- **切り抜き**: 枠からはみ出した部分を見せずに隠すことです。

## 何をしているか

### 1. 枠を埋めて切り抜く

```css:line-numbers=934
  .object-fit-cover {
    object-fit: cover;
  }
```

`object-fit: cover` は、画像の縦横比を保ったまま、枠を完全に埋めます。枠より縦長や横長の部分は、枠の外に出て見えなくなります。

## ここがすごい

- 写真のサムネイルを、元の画像の大きさがばらばらでも、同じ大きさの枠に揃えられます。歪ませずに見た目を整えられるのが利点です。
- 切り抜きを CSS だけで行うので、画像ファイルを事前に切る作業が要りません。
- 素直に `width` と `height` を両方指定すると、画像が引き伸ばされて歪みます。`object-fit` を使うと、比率を保ったまま枠に合わせられます。
- 同じ仕組みで `fill`、`contain` なども用意されていて、用途に応じて選べます。

## まとめ

- `object-fit: cover` は、比率を保ったまま枠を埋めます。
- 切り抜きは CSS で行うので、画像を事前に加工する必要がありません。
- 枠の大きさを揃えておけば、画像が歪まずに並びます。
