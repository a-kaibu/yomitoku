---
title: 2 乗すると溢れてしまう値を、スケールを変えて計算する
description: 直角三角形の斜辺の長さを求める hypot。桁が大きすぎたり小さすぎたりしても、途中で計算を崩さないように工夫されている。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math/hypot.zig
lines: [23, 52]
function: hypot
difficulty: 3
format: 2
tags: [数値計算, 防御的プログラミング]
---

## ひとことで

`hypot(x, y)` は、直角三角形の 2 辺が `x` と `y` のとき、斜辺の長さ `sqrt(x*x + y*y)` を求める関数です。
たとえば `hypot(3, 4)` は `5` です。

一見すると `@sqrt(x * x + y * y)` と書けば済みそうですが、`x` が非常に大きいと 2 乗の時点で値が溢れてしまいます。この関数は、その問題を避けるために、値のスケールを調整してから計算します。

## コード

```zig:line-numbers=23
pub fn hypot(x: anytype, y: anytype) @TypeOf(x, y) {
    const T = @TypeOf(x, y);
    switch (@typeInfo(T)) {
        .float => {},
        .comptime_float => return @sqrt(x * x + y * y),
        else => @compileError("hypot not implemented for " ++ @typeName(T)),
    }
    const lower = @sqrt(floatMin(T));
    const upper = @sqrt(floatMax(T) / 2);
    const incre = @sqrt(floatEps(T) / 2);
    const scale = floatEpsAt(T, incre);
    const hypfn = if (emulateFma(T)) hypotUnfused else hypotFused;
    var major: T = x;
    var minor: T = y;
    if (isInf(major) or isInf(minor)) return inf(T);
    if (isNan(major) or isNan(minor)) return nan(T);
    if (T == f16) return @floatCast(@sqrt(@mulAdd(f32, x, x, @as(f32, y) * y)));
    if (T == f32) return @floatCast(@sqrt(@mulAdd(f64, x, x, @as(f64, y) * y)));
    major = @abs(major);
    minor = @abs(minor);
    if (minor > major) {
        const tempo = major;
        major = minor;
        minor = tempo;
    }
    if (major * incre >= minor) return major;
    if (major > upper) return hypfn(T, major * scale, minor * scale) / scale;
    if (minor < lower) return hypfn(T, major / scale, minor / scale) * scale;
    return hypfn(T, major, minor);
}
```
## 前提知識

- **浮動小数点数（float）**: 小数を近似的に表す数値型です。`f32` や `f64` があり、表せる最大値と最小値が決まっています。
- **`anytype`**: どんな型の引数でも受け取れることを示す Zig の書き方です。`@TypeOf(x, y)` は、2 つの引数に共通する型を返します。
- **`switch (@typeInfo(T))`**: 型の情報をもとに処理を分ける書き方です。`.float` は浮動小数点型、`.comptime_float` はまだ型が決まっていない小数リテラルです。
- **`inf` と `nan`**: 無限大と「数でないもの」を表す特別な値です。`isInf` と `isNan` で判定します。
- **`@sqrt`**: 平方根を求める組み込み関数です。
- **`@mulAdd`**: `a * b + c` を、途中で丸めずに 1 回の計算として行う関数（FMA）です。精度が上がりやすくなります。
- **`@abs`**: 絶対値（符号を取り除いた値）です。

## 何をしているか

### 1. 型ごとの境界を用意する

```zig:line-numbers=30
    const lower = @sqrt(floatMin(T));
    const upper = @sqrt(floatMax(T) / 2);
    const incre = @sqrt(floatEps(T) / 2);
    const scale = floatEpsAt(T, incre);
```

`lower` は、2 乗すると小さすぎて消えてしまう（アンダーフローする）境界です。`upper` は、2 乗すると大きすぎて溢れる（オーバーフローする）境界です。`incre` は、小さい値を無視してよい目安です。型ごとに値が違うので、`floatMin` などで求めています。

### 2. 特別な値を先に処理する

```zig:line-numbers=37
    if (isInf(major) or isInf(minor)) return inf(T);
    if (isNan(major) or isNan(minor)) return nan(T);
```

無限大や NaN が入っていたら、そのまま結果を返します。ここで止めないと、あとの計算で意味のない値が混ざります。

### 3. 大きいほうを major にそろえる

```zig:line-numbers=41
    major = @abs(major);
    minor = @abs(minor);
    if (minor > major) {
        const tempo = major;
        major = minor;
        minor = tempo;
    }
```

符号を取り除いて、`major` に大きいほうの値、`minor` に小さいほうの値を入れます。こうすると、あとの判定を 1 種類ずつ書けます。

### 4. 小さいほうが無視できるなら、大きいほうを返す

```zig:line-numbers=48
    if (major * incre >= minor) return major;
```

`minor` が `major` に比べて非常に小さいときは、斜辺はほぼ `major` と同じになります。そこで計算を省いて、`major` をそのまま返します。たとえば `major = 1`、`minor = 1e-20` なら、`minor` は結果に影響しません。

### 5. 大きすぎる場合と小さすぎる場合を別に扱う

```zig:line-numbers=49
    if (major > upper) return hypfn(T, major * scale, minor * scale) / scale;
    if (minor < lower) return hypfn(T, major / scale, minor / scale) * scale;
    return hypfn(T, major, minor);
```

`major` が大きすぎるなら、両方の値を `scale` 倍して小さくしてから計算し、最後に戻します。`minor` が小さすぎるなら、両方を `scale` で割って大きくしてから計算し、最後に掛けて戻します。どちらでもなければ、そのまま計算します。`hypfn` は、`@mulAdd` を使う版と使わない版のどちらかです。

## ここがすごい

- **溢れを防ぐ**: 普通に 2 乗して足すと、`1e200` のような値はすぐ `inf` になってしまいます。スケールを下げてから計算すれば、答えを正しく求められます。
- **精度を落とさない**: 小さい値を無視する判定があるので、意味のない誤差の積み重ねを減らしています。また、`major` を大きいほうにそろえておくので、桁が違う足し算の誤差も小さくなります。
- **型ごとの値を使う**: `floatMin` や `floatEps` を型から求めるので、`f16` や `f80` でも同じ関数で動きます。境界の数字をコードに直接書いていません。
- **FMA の有無を選ぶ**: `emulateFma` は、`@mulAdd` が遅いソフトウェア実装になる型（`f128` や `f80`）では別の計算を選びます。速さと正確さのバランスを型ごとに選んでいます。

## まとめ

- 2 乗して足す方法は、大きすぎる値や小さすぎる値で壊れます。
- 大きいほうと小さいほうを先に決めると、判定を簡単に書けます。
- 桁が極端に違うときは、スケールを変えて計算し、最後に元に戻すと安全です。
- 型の境界（最大・最小・精度）を型から求めると、同じコードをいろいろな浮動小数点型で使えます。
