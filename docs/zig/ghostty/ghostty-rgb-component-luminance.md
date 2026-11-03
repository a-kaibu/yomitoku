---
title: sRGB の 1 成分を、直線の明るさに戻す計算
description: Ghostty の RGB.componentLuminance。0 から 255 の 1 つの色の成分を、ガンマを外した 0 から 1 の値に変える。暗い部分と明るい部分で式を切り替える。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [675, 680]
function: RGB.componentLuminance
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング]
---

## ひとことで

`componentLuminance` は、RGB の 1 つの成分（赤、緑、青のどれか）を、光の量に比例する値へ直す関数です。画面の色は、ガンマという曲線で符号化されているので、そのまま足しても明るさの比率にはなりません。この関数は、その曲線を外して、0 から 1 の直線的な値を返します。

## コード

```zig:line-numbers=675
    fn componentLuminance(c: u8) f64 {
        const c_f64: f64 = @floatFromInt(c);
        const normalized: f64 = c_f64 / 255;
        if (normalized <= 0.03928) return normalized / 12.92;
        return std.math.pow(f64, (normalized + 0.055) / 1.055, 2.4);
    }
```

## 前提知識

- **sRGB**: 画面で標準的に使われる色の表現です。0 から 255 の値は、そのまま光の量ではなく、ガンマという曲線で符号化されています。
- **ガンマ**: 人の目の感じ方に合わせて、暗い部分を細かく、明るい部分を粗く割り当てる曲線です。
- **相対輝度**: 光の量に比例する値です。`luminance` 関数が、この `componentLuminance` の結果を重ねて使います。
- **`@floatFromInt`**: 整数を浮動小数点数に変換する組み込み関数です。
- **`std.math.pow`**: 累乗を計算する関数です。ここでは 2.4 乗に使います。

## 何をしているか

関数は、次の順番で計算します。

### 1. 0 から 1 に正規化する

```zig:line-numbers=676
        const c_f64: f64 = @floatFromInt(c);
        const normalized: f64 = c_f64 / 255;
```

`c_f64 / 255` で、0 から 255 の値を 0 から 1 の値にします。

### 2. 暗い部分は直線の式を使う

```zig:line-numbers=678
        if (normalized <= 0.03928) return normalized / 12.92;
```

`normalized <= 0.03928` なら、`normalized / 12.92` を使います。暗い部分は、ガンマの曲線が直線に近いので、この式を使います。

### 3. 明るい部分は累乗で曲線を外す

```zig:line-numbers=679
        return std.math.pow(f64, (normalized + 0.055) / 1.055, 2.4);
```

それより明るい部分は、`((normalized + 0.055) / 1.055) ^ 2.4` で曲線を外します。2 つの式は境界の `0.03928` でほぼつながるように作られています。

## ここがすごい

- **分岐は 1 回だけ**: 暗い部分と明るい部分で式を分けるのは、判定が 1 回の `if` だけです。計算はそれほど複雑になりません。
- **規格の定数をそのまま使う**: `0.03928`、`12.92`、`0.055`、`1.055`、`2.4` は、WCAG の式で決められた値です。値の意味を調べやすくなっています。
- **注意書きがある**: 関数のドキュメントには、sRGB の色空間を前提にしていること、そして完全ではない近似であることが書かれています。
- **小さく分ける**: 3 成分を個別に計算し、後で重みを付けて足す、という段階に分けています。`luminance` で役割が分かれています。

## まとめ

- `componentLuminance` は、ガンマを外して、光の量に比例する値を作ります。
- 暗い部分と明るい部分で式を切り替えるのが、sRGB の規格の形です。
- 関数の注意書きが示すように、この計算は sRGB を前提にした近似です。
