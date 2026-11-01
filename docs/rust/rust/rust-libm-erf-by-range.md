---
title: 絶対値の範囲で分けて誤差関数を求める
description: libm の erf。絶対値の大きさで範囲を分け、符号と無限大・NaN を先に処理してから、範囲ごとの近似式で値を求める。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/compiler-builtins/libm/src/math/erf.rs
lines: [223, 260]
function: erf
difficulty: 3
format: 2
tags: [数値計算, ビット演算, アルゴリズム]
---

## ひとことで

`erf` は、誤差関数 `erf(x)` の値を求める関数です。誤差関数は、確率や統計、熱の拡散などで使われる特殊関数です。標準ライブラリにはないので、`libm` と呼ばれる数学関数の crate が実装しています。

この関数は、`x` の絶対値の大きさによって計算の方法を分けます。とても小さい値、中くらいの値、大きい値、そして無限大や NaN です。それぞれの範囲で、いちばん少ない計算で正確に求められる式を使います。

## コード

::: code-group

```rust:line-numbers=223 [日本語訳]
pub fn erf(x: f64) -> f64 {
    let r: f64;
    let s: f64;
    let z: f64;
    let y: f64;
    let mut ix: u32;
    let sign: usize;

    ix = get_high_word(x);
    sign = (ix >> 31) as usize;
    ix &= 0x7fffffff;
    if ix >= 0x7ff00000 {
        /* NaN はそのまま、無限大は ±1 */
        return 1.0 - 2.0 * (sign as f64) + 1.0 / x;
    }
    if ix < 0x3feb0000 {
        /* |x| < 0.84375 の範囲 */
        if ix < 0x3e300000 {
            /* |x| < 2 の -28 乗 */
            /* アンダーフローを避ける */
            return 0.125 * (8.0 * x + EFX8 * x);
        }
        z = x * x;
        r = PP0 + z * (PP1 + z * (PP2 + z * (PP3 + z * PP4)));
        s = 1.0 + z * (QQ1 + z * (QQ2 + z * (QQ3 + z * (QQ4 + z * QQ5))));
        y = r / s;
        return x + x * y;
    }
    if ix < 0x40180000 {
        /* 0.84375 以上 6 未満の範囲 */
        y = 1.0 - erfc2(ix, x);
    } else {
        let x1p_1022 = f64::from_bits(0x0010000000000000);
        y = 1.0 - x1p_1022;
    }

    if sign != 0 { -y } else { y }
}
```

```rust:line-numbers=223 [原文]
pub fn erf(x: f64) -> f64 {
    let r: f64;
    let s: f64;
    let z: f64;
    let y: f64;
    let mut ix: u32;
    let sign: usize;

    ix = get_high_word(x);
    sign = (ix >> 31) as usize;
    ix &= 0x7fffffff;
    if ix >= 0x7ff00000 {
        /* erf(nan)=nan, erf(+-inf)=+-1 */
        return 1.0 - 2.0 * (sign as f64) + 1.0 / x;
    }
    if ix < 0x3feb0000 {
        /* |x| < 0.84375 */
        if ix < 0x3e300000 {
            /* |x| < 2**-28 */
            /* avoid underflow */
            return 0.125 * (8.0 * x + EFX8 * x);
        }
        z = x * x;
        r = PP0 + z * (PP1 + z * (PP2 + z * (PP3 + z * PP4)));
        s = 1.0 + z * (QQ1 + z * (QQ2 + z * (QQ3 + z * (QQ4 + z * QQ5))));
        y = r / s;
        return x + x * y;
    }
    if ix < 0x40180000 {
        /* 0.84375 <= |x| < 6 */
        y = 1.0 - erfc2(ix, x);
    } else {
        let x1p_1022 = f64::from_bits(0x0010000000000000);
        y = 1.0 - x1p_1022;
    }

    if sign != 0 { -y } else { y }
}
```

:::

## 前提知識

- **誤差関数**: `erf(x) = 2/√π ∫₀ˣ e^(-t²) dt` で定義される関数です。`x` が 0 のとき 0 で、`x` が大きくなると 1 に近づきます。
- **多項式による近似**: 複雑な関数を `a + b·z + c·z² + …` のような多項式で置き換える方法です。範囲を区切り、範囲ごとに別の多項式を当てはめます。
- **IEEE 754 の浮動小数点数**: `f64` は、符号 1 ビット、指数 11 ビット、仮数 52 ビットで値を表します。ビットを読むと、符号や大きさを直接取り出せます。
- **`get_high_word`**: `f64` の上位 32 ビットを整数として取り出す関数です。上位ビットには符号と指数、仮数の先頭が入っています。
- **`erfc2`**: 誤差関数の補数（1 から引いた値）を求める補助関数です。この記事では中身を扱いません。

## 何をしているか

### 1. 符号と絶対値を分ける

```rust:line-numbers=231
    ix = get_high_word(x);
    sign = (ix >> 31) as usize;
    ix &= 0x7fffffff;
```

誤差関数は奇関数なので、`erf(-x) = -erf(x)` が成り立ちます。そこでまず符号を取り出し、以降は絶対値だけで計算します。`ix >> 31` は符号ビットを取り出す操作で、`0x7fffffff` との `&` は符号ビットを消す操作です。

### 2. 無限大と NaN を扱う

```rust:line-numbers=234
    if ix >= 0x7ff00000 {
        /* erf(nan)=nan, erf(+-inf)=+-1 */
        return 1.0 - 2.0 * (sign as f64) + 1.0 / x;
    }
```

指数部がすべて 1 のとき、上位 32 ビットは `0x7ff00000` 以上になります。仮数が 0 なら無限大、0 でなければ NaN です。`erf(±∞)` は ±1 なので、式 `1.0 - 2.0 * sign + 1.0 / x` で直接返します。NaN を渡すと `1.0 / x` が NaN になり、結果も NaN になります。

### 3. 0 に近い値を扱う

```rust:line-numbers=238
    if ix < 0x3feb0000 {
        /* |x| < 0.84375 */
        if ix < 0x3e300000 {
            /* |x| < 2**-28 */
            /* avoid underflow */
            return 0.125 * (8.0 * x + EFX8 * x);
        }
        z = x * x;
        r = PP0 + z * (PP1 + z * (PP2 + z * (PP3 + z * PP4)));
        s = 1.0 + z * (QQ1 + z * (QQ2 + z * (QQ3 + z * (QQ4 + z * QQ5))));
        y = r / s;
        return x + x * y;
    }
```

`|x| < 0.84375` の範囲では、多項式で求めた比 `r / s` を使います。`|x|` が 2 の -28 乗より小さいときは、`x * x` を計算するとアンダーフローで値が消えてしまいます。そこで `erf(x) ≈ x + EFX·x` という 1 次の近似で返します。`EFX` は 2/√π − 1 に近い値で、約 0.128 です。

### 4. 中くらいと大きい値を扱う

```rust:line-numbers=251
    if ix < 0x40180000 {
        /* 0.84375 <= |x| < 6 */
        y = 1.0 - erfc2(ix, x);
    } else {
        let x1p_1022 = f64::from_bits(0x0010000000000000);
        y = 1.0 - x1p_1022;
    }
```

`|x|` が 6 より小さい範囲では、`erfc2` で補数を求め、`1 - erfc` を返します。6 以上の範囲では、結果はほぼ 1 です。そのため `1 - 2 の -1022 乗` という値を置きます。この差は `f64` では丸められて 1.0 と同じ値になります。

### 5. 符号を戻す

```rust:line-numbers=259
    if sign != 0 { -y } else { y }
```

最後に、符号が負なら `-y` を返します。これで、負の `x` にも `erf(-x) = -erf(x)` の性質が保たれます。

## ここがすごい

- **ビットの大小比較**: 正の浮動小数点数は、ビット列を整数として比べると大きさの順に並びます。`ix < 0x3feb0000` のような整数の比較だけで範囲を判定できます。
- **範囲ごとに式を使い分ける**: 小さい値では多項式で素直に求め、大きい値では結果が 1 に飽和する性質を使って計算を省きます。
- **アンダーフローの回避**: 極小の値では 2 乗を避けて、1 次の式で返します。計算途中で値が消える危険を、式の選び方で防いでいます。
- **特殊な値を先に処理する**: 無限大と NaN を最初に返すので、後の多項式の計算は有限の値だけを考えればよくなります。

## まとめ

- 関数の定義域を範囲で分けると、範囲ごとに簡単な式で近似できます。
- 浮動小数点数のビットを読むと、大小の判定を整数の比較で速く行えます。
- 特殊な値を先に返すと、後の計算の前提がそろい、読みやすくなります。
