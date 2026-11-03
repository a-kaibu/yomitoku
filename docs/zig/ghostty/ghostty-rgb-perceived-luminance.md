---
title: 人の目の感じ方に合わせて、赤・緑・青の重みをつけた明るさを求める
description: Ghostty の RGB.perceivedLuminance。赤・緑・青に 0.299、0.587、0.114 の重みを付けて足し、背景が明るいか暗いかを判断するための値を返す。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [686, 691]
function: RGB.perceivedLuminance
difficulty: 1
format: 2
tags: [数値計算, イディオム]
---

## ひとことで

`perceivedLuminance` は、色の「感じられる明るさ」を 0 から 1 の値で返す関数です。色が明るいか暗いかを大まかに判断するときに使います。WCAG の相対輝度より計算が軽く、判断には十分な精度があります。

## コード

```zig:line-numbers=686
    pub fn perceivedLuminance(self: RGB) f64 {
        const r_f64: f64 = @floatFromInt(self.r);
        const g_f64: f64 = @floatFromInt(self.g);
        const b_f64: f64 = @floatFromInt(self.b);
        return 0.299 * (r_f64 / 255) + 0.587 * (g_f64 / 255) + 0.114 * (b_f64 / 255);
    }
```

## 前提知識

- **輝度**: 光の明るさを表す値です。目で感じる明るさは、赤・緑・青で同じではありません。
- **重み付き平均**: 各成分に係数を掛けて足す計算です。係数の合計が 1 になるように決めます。
- **`@floatFromInt`**: `u8` の値を `f64` に変換します。割り算の結果が小数になるように使います。
- **0.299、0.587、0.114**: 人の目の感度に合わせた係数です。緑が最も明るく感じられ、青は暗く感じられるので、緑の係数が大きくなっています。
- **ガンマ**: この関数は、ガンマを外さずに、そのまま 255 で割っています。そのため、相対輝度とは値が少し違います。

## 何をしているか

関数は、3 つの成分を次の順番で扱います。

### 1. 値を 0 から 1 にする

```zig:line-numbers=687
        const r_f64: f64 = @floatFromInt(self.r);
        const g_f64: f64 = @floatFromInt(self.g);
        const b_f64: f64 = @floatFromInt(self.b);
```

`r`、`g`、`b` を `f64` に変換して、それぞれ 255 で割ります。

### 2. 重みを掛けて足す

```zig:line-numbers=690
        return 0.299 * (r_f64 / 255) + 0.587 * (g_f64 / 255) + 0.114 * (b_f64 / 255);
```

`0.299`、`0.587`、`0.114` を掛けて足します。係数の合計は `1.0` なので、白（255, 255, 255）は 1、黒は 0 になります。

## ここがすごい

- **計算が 1 行で済む**: ガンマの曲線を使わないので、累乗の計算がありません。速くて、理解もしやすい式です。
- **係数に意味がある**: 緑の係数が一番大きく、青が一番小さいのは、人の目の感度を反映しています。
- **範囲がそろう**: 係数の合計が 1 なので、結果は必ず 0 から 1 の間に入ります。
- **相対輝度との使い分け**: 厳密なコントラスト比が必要なら `luminance` を、明暗の判断だけなら `perceivedLuminance` を使う、という選び方ができます。

## まとめ

- `perceivedLuminance` は、赤・緑・青に人の目の感度に合わせた係数を掛けて足します。
- 係数の合計が 1 なので、白は 1、黒は 0 になります。
- ガンマを外さないので計算が軽く、明暗の判断には十分です。
