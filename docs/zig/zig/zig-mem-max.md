---
title: スライスの中の最大値を求める
description: Zig 標準ライブラリの mem.max。先頭の要素を仮の最大値にして残りと比べ、最も大きい要素を返す。空のスライスは許さない。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [3700, 3707]
function: max
difficulty: 1
format: 2
tags: [標準ライブラリ, 数値計算]
---

## ひとことで

`max` は、スライスの中で最も大きい要素を返す関数です。`min` の大小を逆にしたものです。空のスライスを渡すと失敗します。

最大値は、ログの最大時刻や、画像の最も明るい画素などを探すときに使います。全体の並びは必要なく、一つの値がほしいだけのことが多いです。

`max` は元の配列を読むだけで、順番も変えません。`min` と同じように、一度なめるだけで答えを出します。

## コード

```zig:line-numbers=3700
pub fn max(comptime T: type, slice: []const T) T {
    assert(slice.len > 0);
    var best = slice[0];
    for (slice[1..]) |item| {
        best = @max(best, item);
    }
    return best;
}
```

## 前提知識

- **`assert`**: 条件が偽なら、デバッグ時にパニックさせる検査です。
- **`@max`**: 2 つの値のうち大きい方を返す組み込み関数です。
- **`min`**: 同じ形で最小値を求める、対になる関数です。

## 何をしているか

### 1. 空でないことを確かめる

```zig:line-numbers=3701
    assert(slice.len > 0);
```

要素がないと、最大値を決められないので、`assert` で長さを確かめます。

### 2. 先頭の要素を仮の最大値にする

```zig:line-numbers=3702
    var best = slice[0];
```

先頭の要素を `best` に入れて、最初の基準にします。

### 3. 残りの要素と比べる

```zig:line-numbers=3703
    for (slice[1..]) |item| {
        best = @max(best, item);
    }
```

先頭以外の要素を順に見て、`@max` で大きい方を `best` に残します。

### 4. 最大値を返す

```zig:line-numbers=3706
    return best;
```

最後に `best` を返します。

この関数の計算量は、要素数に比例します。値を比べるたびに、それまでの最大値を一つだけ覚えておく形なので、余分なメモリもほとんど使いません。

## ここがすごい

- **`min` と同じ形**: 比較の向きを変えるだけで、同じ走査を使います。
- **一度の走査で済む**: 配列を並べ替えず、一回なめるだけで最大値がわかります。

## まとめ

- `max` は、スライスを一度だけ走査して、最大値を返します。
- 空のスライスは `assert` で防ぎます。
