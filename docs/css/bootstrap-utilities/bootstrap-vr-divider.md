---
title: "縦の区切り線を min-height 1em の箱で作る"
description: "Bootstrap の .vr は、背景色を枠線の色にした細い箱を display: inline-block で作る。stretch で親の高さいっぱいに伸びる、縦の区切り線の仕掛け。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [845, 851]
function: "\".vr\""
difficulty: 2
format: 2
tags: [レイアウト, イディオム]
---
## ひとことで

`vr` クラスを付けた要素を、縦の細い区切り線として表示するユーティリティです。線は枠線ではなく、背景色を付けた細い箱として作られています。`align-self: stretch` で親の高さいっぱいに伸び、横に並んだ要素の間を区切ります。

## コード

```css:line-numbers=845
  .vr {
    display: inline-block;
    align-self: stretch;
    width: var(--bs-vr-border-width, var(--bs-border-width));
    min-height: 1em;
    background-color: var(--bs-border-color);
  }
```

## 前提知識

- **flex と align-self**: flex の中で、要素を交差する方向（縦）にどう揃えるかを決める指定です。`stretch` は、親の高さいっぱいに伸ばす値です。
- **inline-block**: 文字と同じ行に並びながら、幅と高さを持てる箱にする指定です。
- **min-height: 1em**: 中身が空でも、最低限の高さを確保する指定です。`1em` は、文字の一つ分の大きさです。
- **背景色で線を描く**: 枠線ではなく、背景色の細い箱で線を表す方法です。

## 何をしているか

### 1. 線の箱を作る

```css:line-numbers=846
    display: inline-block;
    align-self: stretch;
```

`display: inline-block` で文字と同じ行に置き、`align-self: stretch` で、親の並びの高さいっぱいに伸ばします。親が flex のときは、隣の要素と同じ高さの線になります。

### 2. 幅と色と最低の高さ

```css:line-numbers=848
    width: var(--bs-vr-border-width, var(--bs-border-width));
    min-height: 1em;
    background-color: var(--bs-border-color);
```

`width` は `--bs-vr-border-width` を、なければ枠線の太さを使います。`min-height: 1em` で、親の高さが決まらないときも線が見えるようにします。背景色は、枠線の色の変数を使います。

## ここがすごい

- 区切り線を枠線ではなく背景色の箱で作ると、幅と色を変数で決められます。`border` を使うより、テーマの変更が簡単です。
- `align-self: stretch` を使うので、隣の要素の高さに自動で合います。線の高さを手で計算する必要がありません。
- 素直に、`border-left` で区切りを作ると、要素の端に線が付くため、並びの間隔の調整が必要になります。箱の方が、位置の計算が単純です。
- `min-height: 1em` で、中身がない状態でも線が消えない、という配慮があります。

## まとめ

- `align-self: stretch` は、flex の中で親の高さいっぱいに伸ばす指定です。
- 線を背景色の細い箱で作ると、色と太さを変数で決められます。
- `min-height` で、高さが決まらない場合でも線が見えるようにできます。
