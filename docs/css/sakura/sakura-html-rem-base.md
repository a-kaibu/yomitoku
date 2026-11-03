---
title: "1rem を 10px にして rem の計算を楽にする"
description: "html の font-size を 62.5% にして、1rem を既定の 10px にそろえる。その上で本文や余白を rem で書けるようにする、小さな CSS テーマの土台。"
language: css
project: undefined
repo: https://github.com/oxalorg/sakura
license: MIT
copyright: "\"Copyright (c) 2016 Mitesh Shah\""
commit: "1eab9fd871abc74ec74d1a6f18ee56148f5a4b8f"
file: css/sakura.css
lines: [7, 10]
function: "html"
difficulty: 1
format: 2
tags: [数値計算, 可読性]
---
## ひとことで

`html` 要素の文字の大きさを既定の 62.5% にして、`1rem` を 10px に決めるルールです。ブラウザの既定の文字サイズは 16px なので、そのままでは計算がしにくくなります。この一行で、`1.8rem` が 18px、`0.5rem` が 5px、というように、10 で割るだけの計算に変わります。

## コード

```css:line-numbers=7
html {
  font-size: 62.5%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
}
```

## 前提知識

- **rem 単位**: ルート要素（html）の文字の大きさを基準にする長さの単位です。`1rem` は html の文字サイズと同じ長さになります。
- **em 単位**: 現在の要素の文字の大きさを基準にする単位です。親の文字サイズに影響されるので、入れ子になると値がずれやすくなります。
- **パーセント（%）**: 親の文字サイズを 100% とした割合です。`62.5%` は既定の 16px の 62.5%、つまり 10px になります。
- **font-family**: 文字に使うフォントの候補リストです。このルールと同じ要素に書かれています。

## 何をしているか

### 1. html の文字サイズを 10px にする

```css:line-numbers=7
html {
  font-size: 62.5%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
```

`font-size: 62.5%` は、ブラウザの既定の 16px の 62.5% を計算すると 10px になります。この値が `html` に設定されるので、`1rem` は 10px と同じになります。

`font-family` の行では、システムのフォントを先頭から並べています。`-apple-system` や `BlinkMacSystemFont` は、macOS や Chrome で OS の標準フォントを表します。最後の `sans-serif` は、保険のゴシック体です。

## ここがすごい

- 10 で割るだけで、文字や余白の大きさが頭の中で計算できます。`2.5rem` は 25px、というように、読み手が見た値をすぐ思い浮かべられます。
- 本文の大きさは `body` で `1.8rem`（18px）に決めているので、文字の大きさが一か所の数字で決まります。
- 素直に `html { font-size: 16px }` と書いて、本文を `1.125rem` にすると、18px を求めるのに計算が要ります。10px の基準にすると、その計算を省けます。
- `rem` は `em` と違って、入れ子で値が積み重ならないので、深い要素の中でも大きさが安定します。

## まとめ

- `62.5%` は既定の 16px から 10px を作る計算です。
- `1rem` を 10px にすると、大きさの数字が 10 の倍数の感覚で読めます。
- `rem` は入れ子に強いので、文字や余白の基準として安定します。
- フォントのリストをシステムの標準から始めると、各 OS で自然な文字になります。
