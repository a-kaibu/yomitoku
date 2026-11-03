---
title: 二進数の「末尾の 0」を使って最大公約数を求める
description: 最大公約数を、割り算ではなく引き算とビットシフトだけで求めるバイナリ GCD。Zig 標準ライブラリの、速さを意識した実装。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math/gcd.zig
lines: [6, 43]
function: gcd
difficulty: 2
format: 2
tags: [ビット演算, アルゴリズム, 数値計算]
---

## ひとことで

`gcd` は、2 つの符号なし整数の最大公約数（両方を割り切れる最大の数）を求める関数です。
たとえば `gcd(8, 12)` は `4` です。

最大公約数は普通、割り算の余りを使うユークリッドの互除法で求めます。この関数は **割り算を使わず**、引き算と「2 進数の末尾に並ぶ 0 の数を数える命令」だけで答えを出します。

## コード

::: code-group

```zig:line-numbers=6 [日本語訳]
pub fn gcd(a: anytype, b: anytype) @TypeOf(a, b) {
    const N = switch (@TypeOf(a, b)) {
        // comptime_int を、@ctz が使える大きさの決まった整数型に変換する
        comptime_int => std.math.IntFittingRange(@min(a, b), @max(a, b)),
        else => |T| T,
    };
    if (@typeInfo(N) != .int or @typeInfo(N).int.signedness != .unsigned) {
        @compileError("`a` and `b` must be usigned integers");
    }

    // Stein のアルゴリズムを最適化した形を使う:
    // https://en.wikipedia.org/wiki/Binary_GCD_algorithm
    std.debug.assert(a != 0 or b != 0);

    if (a == 0) return b;
    if (b == 0) return a;

    var x: N = a;
    var y: N = b;

    const xz = @ctz(x);
    const yz = @ctz(y);
    const shift = @min(xz, yz);
    x >>= @intCast(xz);
    y >>= @intCast(yz);

    var diff = y -% x;
    while (diff != 0) : (diff = y -% x) {
        // ctz は符号を反転しても変わらない。ここで先に計算しておくと、
        //   次の計算との依存関係が減るので、
        //   CPU が効率よく動く。
        const zeros = @ctz(diff);
        if (x > y) diff = -%diff;
        y = @min(x, y);
        x = diff >> @intCast(zeros);
    }
    return y << @intCast(shift);
}
```

```zig:line-numbers=6 [原文]
pub fn gcd(a: anytype, b: anytype) @TypeOf(a, b) {
    const N = switch (@TypeOf(a, b)) {
        // convert comptime_int to some sized int type for @ctz
        comptime_int => std.math.IntFittingRange(@min(a, b), @max(a, b)),
        else => |T| T,
    };
    if (@typeInfo(N) != .int or @typeInfo(N).int.signedness != .unsigned) {
        @compileError("`a` and `b` must be usigned integers");
    }

    // using an optimised form of Stein's algorithm:
    // https://en.wikipedia.org/wiki/Binary_GCD_algorithm
    std.debug.assert(a != 0 or b != 0);

    if (a == 0) return b;
    if (b == 0) return a;

    var x: N = a;
    var y: N = b;

    const xz = @ctz(x);
    const yz = @ctz(y);
    const shift = @min(xz, yz);
    x >>= @intCast(xz);
    y >>= @intCast(yz);

    var diff = y -% x;
    while (diff != 0) : (diff = y -% x) {
        // ctz is invariant under negation, we
        // put it here to ease data dependencies,
        // makes the CPU happy.
        const zeros = @ctz(diff);
        if (x > y) diff = -%diff;
        y = @min(x, y);
        x = diff >> @intCast(zeros);
    }
    return y << @intCast(shift);
}
```

:::

## 前提知識

- **符号なし整数（`u32` や `u64` など）**: 0 以上だけを表す整数です。Zig では `a: anytype` のように型を引数で受け取ることができ、この関数はどの符号なし整数型でも動きます。
- **`anytype` と `@TypeOf`**: `anytype` は「どんな型でもよい」という意味の引数の型です。`@TypeOf(a, b)` はコンパイル時に引数の型を調べる組み込み関数です。
- **`@ctz`（count trailing zeros）**: 整数の 2 進数表記で、いちばん下の位（末尾）から連続して並ぶ 0 の個数を返す命令です。たとえば `12`（2 進数で `1100`）の `@ctz` は `2` です。
- **`>>` と `<<`**: ビットを右・左にずらす演算です。右に 1 つずらすと、2 で割ったのと同じ意味になります（端数は捨てられます）。
- **`-%` と `+%`**: オーバーフロー（値が型の範囲を超えること）を「エラーにせず、折り返す」演算子です。`y -% x` が負になっても、符号なしの範囲に折り返して計算されます。
- **`@min` と `@max`**: 2 つの値の小さいほう・大きいほうを返す組み込み関数です。

## 何をしているか

### 1. 型を決める

```zig:line-numbers=7
    const N = switch (@TypeOf(a, b)) {
        // convert comptime_int to some sized int type for @ctz
        comptime_int => std.math.IntFittingRange(@min(a, b), @max(a, b)),
        else => |T| T,
    };
```

`gcd(8, 12)` のように数値リテラルを直接渡すと、その型は `comptime_int`（大きさの決まっていない整数）になります。`@ctz` は大きさの決まった整数型にしか使えないので、値の範囲に合う型（`IntFittingRange`）に変換しています。それ以外の型はそのまま使います。

### 2. 0 の場合を先に返す

```zig:line-numbers=20
    if (a == 0) return b;
    if (b == 0) return a;
```

0 と何かの最大公約数は、もう一方の数そのものです。たとえば `gcd(0, 5)` は `5` です。この 2 行があるので、以下の計算では 0 を気にしなくてよくなります。

### 3. 2 の倍数になっている分を先に取り除く

```zig:line-numbers=26
    const xz = @ctz(x);
    const yz = @ctz(y);
    const shift = @min(xz, yz);
    x >>= @intCast(xz);
    y >>= @intCast(yz);
```

両方の数に共通する 2 の因数は、最後にまとめて戻します。`x` と `y` のそれぞれの末尾の 0 の数（`xz` と `yz`）を数え、小さいほうを `shift` として覚えておきます。そのうえで両方を右にずらし、2 の因数を取り除きます。たとえば `x = 12`、`y = 8` なら、`xz = 2`、`yz = 3`、`shift = 2` です。`x` は `3`、`y` は `1` になります。

### 4. 引き算を繰り返す

```zig:line-numbers=32
    var diff = y -% x;
    while (diff != 0) : (diff = y -% x) {
        // ctz is invariant under negation, we
        // put it here to ease data dependencies,
        // makes the CPU happy.
        const zeros = @ctz(diff);
        if (x > y) diff = -%diff;
        y = @min(x, y);
        x = diff >> @intCast(zeros);
    }
```

`x` と `y` の差 `diff` が 0 になるまで、大きいほうから小さいほうを引き続けます。差は必ず偶数になります（両方とも奇数のため）。そこで `diff` の末尾の 0 をまとめて取り除いてから次の `x` にしています。`x > y` のときは差が負になるので、符号を反転して正の値にしています。`-%` を使っているのは、符号なし整数では負の値を表せず、折り返しの計算が必要だからです。

`x = 3`、`y = 1` の例では、`diff = 1 -% 3` が折り返しで大きな値になります。`@ctz` で取り除き、符号を直して `diff = 2` となり、`x = 1`、`y = 1` と進み、最後に `diff = 0` で止まります。

### 5. 2 の因数を戻す

```zig:line-numbers=42
    return y << @intCast(shift);
```

残った `y` は互いに素な奇数の最大公約数です。最初に取り除いた `shift` 個の 2 を左にずらして戻すと、答えになります。`gcd(12, 8)` では `1 << 2` で `4` になります。

## ここがすごい

- **割り算を使わない**: ユークリッドの互除法は割り算（`%`）を繰り返します。割り算は CPU にとって重い命令なので、引き算とビットシフトだけにすると速くなります。これが「バイナリ GCD」と呼ばれる方法です。
- **末尾の 0 を一気に取り除く**: `diff >> zeros` で 2 の因数をまとめて消すので、1 回の引き算で何度も 2 で割るのと同じ効果が得られます。
- **CPU の並列性を意識した順番**: 元のコードには、`@ctz(diff)` を先に計算しておく理由がコメントで書かれています。符号を反転する処理と並べて計算できるので、CPU がパイプラインで同時に処理しやすくなります。
- **型を自動で決める**: `comptime_int` の場合の変換を入れているので、`gcd(8, 12)` のように書くだけで、型を指定しなくても正しく動きます。
- **テストが充実**: 本体の下にある `test gcd` には、0 を含む場合や大きな数、型の違う組み合わせなどの例が並んでいます。

## まとめ

- 最大公約数は割り算を使わなくても、引き算とビットシフトで求められます（バイナリ GCD）。
- 2 進数の末尾の 0 は `@ctz` で素早く数えられ、2 の因数の取り除きに使えます。
- 符号なし整数の引き算がマイナスになるときは `-%` のような折り返し演算子で扱います。
- Zig では `anytype` と `@TypeOf` を使うと、型ごとに別の関数を書かずに済みます。
