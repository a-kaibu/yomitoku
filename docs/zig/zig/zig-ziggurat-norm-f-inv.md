---
title: 正規分布の高さから、対応する x の位置を平方根と対数で求める
description: Zig 標準ライブラリの ziggurat.norm_f_inv。norm_f の逆関数で、密度の値 y から x の大きさを √(-2 ln y) で返す。ジグラット法の表を作るときに使う。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random/ziggurat.zig
lines: [110, 112]
function: norm_f_inv
difficulty: 2
format: 2
tags: [乱数, 数値計算, 標準ライブラリ]
---

## ひとことで

`norm_f_inv` は、`norm_f` の逆の関数です。標準正規分布の密度の高さ `y` を受け取り、その高さになる `x` の大きさを返します。ジグラット法の表の境界を、高さから逆算するために使われます。

## コード

```zig:line-numbers=110
pub fn norm_f_inv(y: f64) f64 {
    return @sqrt(-2.0 * @log(y));
}
```

## 前提知識

- **逆関数**: ある関数の入力と出力を入れ替えた関数です。`norm_f(x) = y` のとき、`norm_f_inv(y) = x` になります。
- **`norm_f` の式**: `y = exp(-x²/2)` です。この式を `x` について解けば、逆関数が得られます。
- **対数（`@log`）**: e を底とする対数です。指数の逆の操作にあたります。
- **平方根（`@sqrt`）**: 2 乗の逆の操作です。
- **負の対数**: `y` は 0 から 1 の間なので、`ln y` は負になり、`-2 ln y` は正になります。

## 何をしているか

### 1. 式を変形して解く

```zig:line-numbers=111
    return @sqrt(-2.0 * @log(y));
```

`y = exp(-x²/2)` を変形すると、`-x²/2 = ln y` になり、`x² = -2 ln y` になります。`x` を正の値として求めるので、平方根を取ります。

### 2. 平方根で x を返す

```zig:line-numbers=111
    return @sqrt(-2.0 * @log(y));
```

`@sqrt(-2.0 * @log(y))` で、`x` の大きさを返します。`y` が小さいほど `x` が大きくなり、密度が低い裾の方の位置を表します。

## ここがすごい

- **式を解いて得られる**: 逆関数が、順方向の式から代数的に求まります。表を作る計算が、正確に行えます。
- **正の値だけを返す**: 平方根は正の値なので、対称な分布の片側の位置を返します。符号は別の場所で扱います。
- **`norm_f` と対**: 2 つの関数を並べると、順方向と逆方向の関係が一目で分かります。
- **表の作成に使える**: 高さの分割点から、x の境界を求められます。

## まとめ

- `norm_f_inv` は、`norm_f` の逆関数で、高さから `x` の大きさを返します。
- `x = √(-2 ln y)` と、式を解いて求めます。
- 順方向の `norm_f` と組で、ジグラット法の表の作成に使われます。
