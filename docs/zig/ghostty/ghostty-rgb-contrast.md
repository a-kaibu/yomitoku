---
title: 2 つの色の明るさの比から、文字の読みやすさを数値で表す
description: Ghostty の RGB.contrast。W3C の基準に沿い、2 つの色の相対輝度から、コントラスト比を 1 から 21 の値で返す。前景色と背景色の読みやすさの判定に使える。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [647, 657]
function: RGB.contrast
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング]
---

## ひとことで

`contrast` は、2 つの色の見分けやすさを、1 つの数値で返す関数です。値が大きいほど、2 つの色の差が大きく、文字が読みやすくなります。Ghostty では、文字の色と背景の色の組み合わせを判断するときに使われます。

## コード

::: code-group

```zig:line-numbers=647 [日本語訳]
    pub fn contrast(self: RGB, other: RGB) f64 {
        // pair[0] は明るい方、pair[1] は暗い方
        const pair: [2]f64 = pair: {
            const self_lum = self.luminance();
            const other_lum = other.luminance();
            if (self_lum > other_lum) break :pair .{ self_lum, other_lum };
            break :pair .{ other_lum, self_lum };
        };

        return (pair[0] + 0.05) / (pair[1] + 0.05);
    }
```

```zig:line-numbers=647 [原文]
    pub fn contrast(self: RGB, other: RGB) f64 {
        // pair[0] = lighter, pair[1] = darker
        const pair: [2]f64 = pair: {
            const self_lum = self.luminance();
            const other_lum = other.luminance();
            if (self_lum > other_lum) break :pair .{ self_lum, other_lum };
            break :pair .{ other_lum, self_lum };
        };

        return (pair[0] + 0.05) / (pair[1] + 0.05);
    }
```

:::

## 前提知識

- **相対輝度（relative luminance）**: 人の目で感じる明るさを、0（黒）から 1（白）の値にしたものです。RGB の値をそのまま足しても、人の感じる明るさにはなりません。
- **コントラスト比**: 明るい色と暗い色の輝度の比です。WCAG（ウェブのアクセシビリティの指針）では、1 から 21 の値で表します。
- **`f64`**: 倍精度の浮動小数点数です。小数の計算に使います。
- **ラベル付きブロック（`pair: { ... }`）**: `break :pair` で、ブロックから値を返す Zig の書き方です。
- **`luminance`**: `RGB` の相対輝度を返す関数です。この `contrast` は、その結果を 2 回使います。

## 何をしているか

関数は、2 つの色の輝度を求め、明るい方と暗い方を並べ替えてから、比を計算します。

### 1. 輝度を求めて明るい方を先にする

```zig:line-numbers=649
        const pair: [2]f64 = pair: {
            const self_lum = self.luminance();
            const other_lum = other.luminance();
            if (self_lum > other_lum) break :pair .{ self_lum, other_lum };
            break :pair .{ other_lum, self_lum };
        };
```

`self.luminance()` と `other.luminance()` で 2 つの色の輝度を求めます。ブロックの中で、大きい方を `pair[0]`、小さい方を `pair[1]` に入れます。順番を決めておくと、後の式が 1 通りに書けます。

### 2. 比を計算する

```zig:line-numbers=656
        return (pair[0] + 0.05) / (pair[1] + 0.05);
```

`(pair[0] + 0.05) / (pair[1] + 0.05)` で、比を計算します。`0.05` を足すのは、黒（輝度 0）でも割り算ができるようにするためです。どちらの色を先に渡しても、結果は同じになります。

## ここがすごい

- **引数の順番に依存しない**: 明るい方と暗い方を先に並べるので、`contrast(a, b)` と `contrast(b, a)` が同じ値になります。呼び出す側が気にしなくてよい作りです。
- **ゼロで割らない**: 0.05 を足すことで、黒の輝度が 0 でも分母が 0 になりません。小さな工夫ですが、安全性に直結します。
- **規格に沿った値**: WCAG の式そのものを使っています。コメントのリンクを見れば、同じ計算が規格にあることを確かめられます。
- **役割を分けている**: 輝度の計算は `luminance` に任せ、この関数は比だけを扱います。小さい関数の組み合わせで読みやすくなっています。

## まとめ

- `contrast` は、2 つの色の輝度の比を、WCAG の式で計算します。
- 明るい方と暗い方を並べてから割るので、引数の順番に左右されません。
- 0.05 を足して、黒との比でもゼロで割らないようにしています。
