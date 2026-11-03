---
title: スライスの中の最小値を求める
description: Zig 標準ライブラリの mem.min。先頭の要素を仮の最小値にして残りと比べ、最も小さい要素を返す。空のスライスは許さない。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [3683, 3690]
function: min
difficulty: 1
format: 2
tags: [標準ライブラリ, 数値計算]
---

## ひとことで

`min` は、スライスの中で最も小さい要素を返す関数です。空のスライスを渡すと失敗するので、呼ぶ前に中身があることを確かめておきます。

最小値を求めるには、全部を並べ替える方法もあります。しかし、最小の一つだけがほしいときは、並べ替えは必要以上の手間です。`min` は、一度なめるだけで答えを出します。

並べ替えを使うと、元の配列の順番を変えてしまう場合もあります。`min` は元の配列を読むだけなので、順番を保ったまま使えます。

## コード

```zig:line-numbers=3683
pub fn min(comptime T: type, slice: []const T) T {
    assert(slice.len > 0);
    var best = slice[0];
    for (slice[1..]) |item| {
        best = @min(best, item);
    }
    return best;
}
```

## 前提知識

- **`assert`**: 条件が偽なら、デバッグ時にパニックさせる検査です。
- **`@min`**: 2 つの値のうち小さい方を返す組み込み関数です。
- **`slice[1..]`**: 先頭の要素を除いた残りを指す、スライスの書き方です。

## 何をしているか

### 1. 空でないことを確かめる

```zig:line-numbers=3684
    assert(slice.len > 0);
```

要素が 1 つもないと、最小値を決められません。そのため `assert` で、長さが 0 より大きいことを確かめます。

### 2. 先頭の要素を仮の最小値にする

```zig:line-numbers=3685
    var best = slice[0];
```

先頭の要素を、まずの最小値として `best` に入れます。

### 3. 残りの要素と比べる

```zig:line-numbers=3686
    for (slice[1..]) |item| {
        best = @min(best, item);
    }
```

先頭以外の要素を順に見て、`@min` で `best` と比べ、小さい方を `best` に残します。

### 4. 最小値を返す

```zig:line-numbers=3689
    return best;
```

最後に `best` を返します。

この関数の計算量は、要素数に比例します。並べ替えの n log n より軽く、要素の数が増えても素直に伸びる形です。

## ここがすごい

- **一度の走査で済む**: 先頭から一回なめるだけで、最小値がわかります。余分な配列を使いません。
- **空の入力を明示する**: 空のときに何が起きるかを、`assert` で先に示しています。

## まとめ

- `min` は、スライスを一度だけ走査して、最小値を返します。
- 空のスライスは許さず、`assert` で防ぎます。
