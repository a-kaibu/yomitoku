---
title: 3 つの成分に輝度の重みを付けて、色の相対輝度を求める
description: Ghostty の RGB.luminance。赤・緑・青のそれぞれを sRGB の式で光の量に直し、0.2126、0.7152、0.0722 の重みで足して、相対輝度を 0 から 1 で返す。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [663, 668]
function: RGB.luminance
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング]
---

## ひとことで

`luminance` は、1 つの色の相対輝度を返す関数です。相対輝度は、人の目に感じられる光の量を、0（黒）から 1（白）の値で表したものです。`contrast` の計算の土台になっています。

## コード

```zig:line-numbers=663
    pub fn luminance(self: RGB) f64 {
        const r_lum = componentLuminance(self.r);
        const g_lum = componentLuminance(self.g);
        const b_lum = componentLuminance(self.b);
        return 0.2126 * r_lum + 0.7152 * g_lum + 0.0722 * b_lum;
    }
```

## 前提知識

- **相対輝度**: 光の量に比例する明るさの値です。WCAG の規格で、コントラスト比を求めるときに使われます。
- **成分ごとの輝度**: 赤、緑、青のそれぞれを、ガンマを外した光の量に直した値です。`componentLuminance` が、その変換を行います。
- **重み**: `0.2126`、`0.7152`、`0.0722` は、規格で決められた係数です。人の目の感度に合わせて、緑の係数が一番大きくなっています。
- **係数の合計**: 3 つの係数を足すと、1.0 になります。白の色は 1、黒の色は 0 になります。
- **`perceivedLuminance`**: 同じ目的の、より軽い計算です。ガンマを使わず、別の係数を使います。

## 何をしているか

### 1. 成分ごとの輝度を求める

```zig:line-numbers=664
        const r_lum = componentLuminance(self.r);
        const g_lum = componentLuminance(self.g);
        const b_lum = componentLuminance(self.b);
```

赤、緑、青のそれぞれを `componentLuminance` で変換します。この時点の値は、まだ光の量に比例しています。

### 2. 重みを付けて足す

```zig:line-numbers=667
        return 0.2126 * r_lum + 0.7152 * g_lum + 0.0722 * b_lum;
```

3 つの値に係数を掛けて足します。結果が、色全体の相対輝度になります。緑の係数が大きいのは、人が緑を一番明るく感じるからです。

## ここがすごい

- **規格の係数をそのまま使う**: 係数の値は、WCAG で決められたものです。値の根拠を、規格の文書で確かめられます。
- **段階が分かれている**: 成分の変換と、重みを付けた和の 2 段階に分けています。どちらの段階も、単独で理解できます。
- **結果の範囲が保証される**: 係数の合計が 1 なので、結果は 0 から 1 の間に収まります。
- **別の関数との使い分け**: 厳密なコントラスト比が必要なときは、この関数を使います。明暗の判断だけなら、より軽い `perceivedLuminance` で足ります。

## まとめ

- `luminance` は、3 つの成分をそれぞれ光の量に直してから、規格の重みで足します。
- 係数の合計は 1 なので、結果は 0 から 1 に収まります。
- コントラスト比の計算の土台になっています。
