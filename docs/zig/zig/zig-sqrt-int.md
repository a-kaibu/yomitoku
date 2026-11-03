---
title: 割り算を使わず、紙の筆算と同じ手順で整数の平方根を求める
description: 整数の平方根を、ビットを 1 つずつ決めていく「筆算」の方法で求める。掛け算も割り算もなしに答えが出る。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math/sqrt.zig
lines: [36, 62]
function: sqrt_int
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, ビット演算]
---

## ひとことで

`sqrt_int` は、整数 `value` の平方根の整数部分（小数点以下を切り捨てた値）を返す関数です。
たとえば `sqrt_int(u32, 10)` は `3` です（√10 は約 3.16 だから）。

小数の平方根を求める方法としてはニュートン法などが有名ですが、この関数は **紙の上の筆算と同じ手順** で、答えの 2 進数の桁を上の桁から 1 つずつ決めていきます。掛け算も割り算も使いません。

## コード

::: code-group

```zig:line-numbers=36 [日本語訳]
fn sqrt_int(comptime T: type, value: T) Sqrt(T) {
    if (@typeInfo(T).int.bits <= 2) {
        return if (value == 0) 0 else 1; // ビット数が少ない場合の近道。一般の場合の処理を単純にするため
    } else {
        const bits = @typeInfo(T).int.bits;
        const max = math.maxInt(T);
        const minustwo = (@as(T, 2) ^ max) + 1; // 符号なし整数では -2 を表せないため
        var op = value;
        var res: T = 0;
        var one: T = 1 << ((bits - 1) & minustwo); // T に収まる最大の 4 のべき乗

        // "one" は引数以下で最大の 4 のべき乗から始める。
        while (one > op) {
            one >>= 2;
        }

        while (one != 0) {
            const c = op >= res + one;
            if (c) op -= res + one;
            res >>= 1;
            if (c) res += one;
            one >>= 2;
        }

        return @as(Sqrt(T), @intCast(res));
    }
}
```

```zig:line-numbers=36 [原文]
fn sqrt_int(comptime T: type, value: T) Sqrt(T) {
    if (@typeInfo(T).int.bits <= 2) {
        return if (value == 0) 0 else 1; // shortcut for small number of bits to simplify general case
    } else {
        const bits = @typeInfo(T).int.bits;
        const max = math.maxInt(T);
        const minustwo = (@as(T, 2) ^ max) + 1; // unsigned int cannot represent -2
        var op = value;
        var res: T = 0;
        var one: T = 1 << ((bits - 1) & minustwo); // highest power of four that fits into T

        // "one" starts at the highest power of four <= than the argument.
        while (one > op) {
            one >>= 2;
        }

        while (one != 0) {
            const c = op >= res + one;
            if (c) op -= res + one;
            res >>= 1;
            if (c) res += one;
            one >>= 2;
        }

        return @as(Sqrt(T), @intCast(res));
    }
}
```

:::

## 前提知識

- **平方根**: 2 乗すると元の数になる数です。`sqrt(10)` は約 `3.16` ですが、この関数は小数点以下を捨てた `3` を返します。
- **`@typeInfo(T).int.bits`**: 整数型 `T` のビット数（`u32` なら `32`）をコンパイル時に取り出す組み込みです。
- **`maxInt(T)`**: その型で表せる最大の値です。`u32` なら `0xFFFFFFFF` です。
- **`^`（XOR）**: 2 つの値のビットが違うところだけ 1 になる演算です。`@as(T, 2) ^ max` は、`max` のビットのうち 2 の位置だけ反転させる、という意味になります。
- **`>>=` と `+=`**: `x >>= 2` は `x` を 2 ビット右にずらして代入します。`x += y` は足して代入します。
- **`while` 文**: 条件が真の間、ブロックを繰り返します。

## 何をしているか

### 1. 小さい場合の近道

```zig:line-numbers=37
    if (@typeInfo(T).int.bits <= 2) {
        return if (value == 0) 0 else 1; // shortcut for small number of bits to simplify general case
```

ビット数が 2 以下の型（`u0` から `u2`）では、答えは 0 か 1 しかありえません。この場合だけ特別扱いにして、下の一般的な処理がビット数の少なさを心配しなくて済むようにしています。

### 2. 開始する「桁」を決める

```zig:line-numbers=40
        const bits = @typeInfo(T).int.bits;
        const max = math.maxInt(T);
        const minustwo = (@as(T, 2) ^ max) + 1; // unsigned int cannot represent -2
        var op = value;
        var res: T = 0;
        var one: T = 1 << ((bits - 1) & minustwo); // highest power of four that fits into T
```

`one` は、今いちばん上の桁の値を表す変数で、最初は「型に収まる最大の 4 のべき乗」です。平方根の 2 進数では、桁の重みは 1、4、16、64 … と 4 倍ずつ増えるので、4 のべき乗を使います。

`minustwo` は、符号なし整数で `-2` を作るための計算です。`(bits - 1) & minustwo` は、`bits - 1` を 2 の倍数に切り下げた値になります。これで `1 << ...` の結果が偶数乗、つまり 4 のべき乗になります。`u32` なら `1 << 30` です（4 の 15 乗）。

`op` は、まだ引かれていない残りの値、`res` は今までに決めた平方根の値です。

### 3. 引数より大きい桁を捨てる

```zig:line-numbers=47
        // "one" starts at the highest power of four <= than the argument.
        while (one > op) {
            one >>= 2;
        }
```

`one` を 4 で割っていき（`>>= 2`）、`op` 以下になるところで止めます。`value = 10` なら、`one` は `4` になります（`16` は大きすぎるため）。

### 4. 桁を 1 つずつ決める

```zig:line-numbers=52
        while (one != 0) {
            const c = op >= res + one;
            if (c) op -= res + one;
            res >>= 1;
            if (c) res += one;
            one >>= 2;
        }
```

ここが本体です。今の桁 `one` を、答えに足せるかどうかを判定します。`res + one` 以上の値が残っていれば（`c` が真）、その分を `op` から引き、答えの桁を立てます。

`value = 10` で追うと次のとおりです。

- `one = 4`: `op = 10`、`res = 0`。`10 >= 0 + 4` なので `c` は真。`op` は `6` になり、`res` は `4` になります。
- `one = 1`: `op = 6`、`res = 4`。`6 >= 4 + 1` なので `c` は真。`op` は `1` になり、`res` は `3` になります。
- `one = 0` で終了。答えは `3` です。

`res >>= 1` は、途中の値を 2 倍の基準に合わせるための調整です。平方根の桁を 1 つ決めるたびに、次の桁の計算に備えて `res` を半分にしています。

### 5. 結果を返す

```zig:line-numbers=60
        return @as(Sqrt(T), @intCast(res));
```

`res` が求める平方根です。戻り値の型は `Sqrt(T)` で、型ごとに決まります。

## ここがすごい

- **掛け算も割り算もない**: 数値をどんどん近づける方法は、掛け算や割り算を何度も使います。この方法は、引き算と比較、ビットシフトだけで済みます。ハードウェアが整数の割り算を速くできない環境でも使いやすいです。
- **必ず正確な結果になる**: ニュートン法のような近似ではなく、桁を 1 つずつ確定させていくので、途中で誤差が出ません。整数の平方根の切り捨て結果が正確に得られます。
- **ループの回数が決まっている**: ビット数の半分の回数（`u32` なら 16 回ほど）でかならず終わります。終わらないかもしれない反復計算と違い、処理時間の上限が見積もれます。
- **型に合わせた計算**: `minustwo` のように、符号なし整数のまま「−2」相当の値を作るための工夫が入っています。Zig は符号なしの値に負の数を入れられないので、ビット演算で作っています。

## まとめ

- 整数の平方根は、答えを 2 進数の桁から 1 つずつ決める筆算の手順で求められます。
- 桁の重みは 4 倍ずつ増えるので、4 のべき乗を使って上の桁から試します。
- 掛け算も割り算も使わず、引き算、比較、ビットシフトだけで正確な答えが出ます。
- 符号なし整数の型を使うと、負の数を表す工夫（ビット演算で `-2` を作る）が必要になることがあります。
