---
title: 乱数を範囲に掛け算で写す、時間が一定の偏りありの乱数
description: Zig 標準ライブラリの Random.uintLessThanBiased。乱数を範囲の大きさと掛け算して上位ビットを取る。試行を繰り返さないので実行時間が一定だが、わずかに偏りが出る。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [130, 134]
function: Random.uintLessThanBiased
difficulty: 3
format: 2
tags: [乱数, 最適化, 数値計算]
---

## ひとことで

`uintLessThanBiased` は、0 以上、指定の値未満の符号なし整数の乱数を作る関数です。範囲の掛け算だけで値を作るので、やり直しがなく、実行時間が一定です。その代わり、値のわずかな偏りが許されています。

## コード

```zig:line-numbers=130
pub fn uintLessThanBiased(r: Random, comptime T: type, less_than: T) T {
    comptime assert(@typeInfo(T).int.signedness == .unsigned);
    assert(0 < less_than);
    return limitRangeBiased(T, r.int(T), less_than);
}
```

## 前提知識

- **偏りのない乱数（一様）**: 範囲の各値が、同じ確率で出ることです。
- **剰余による方法の問題**: `乱数 % 範囲` は、範囲が 2 のべきでないと、小さい値が出やすくなります。
- **拒否法**: 偏りをなくすために、範囲外の乱数を捨ててやり直す方法です。実行時間が一定ではありません。
- **`limitRangeBiased`**: 同じファイルにある関数で、乱数を掛け算で範囲に写します。
- **`assert`**: 前提を確かめる関数です。ここでは、符号なしで、範囲が 0 より大きいことを確かめます。

## 何をしているか

### 1. 前提を確かめる

```zig:line-numbers=131
    comptime assert(@typeInfo(T).int.signedness == .unsigned);
    assert(0 < less_than);
```

符号なしの型であることと、範囲が 0 より大きいことを `assert` で確かめます。

### 2. 乱数を範囲に写す

```zig:line-numbers=133
    return limitRangeBiased(T, r.int(T), less_than);
```

`r.int(T)` で、型の全範囲の乱数を作ります。それを `limitRangeBiased` に渡し、`less_than` の範囲に写します。写す方法は、掛け算の上位ビットを取ることです。

## ここがすごい

- **やり直しがない**: 拒否法と違い、乱数を 1 回引くだけで値が決まります。実行時間が予測しやすいです。
- **掛け算で範囲に写す**: 乱数を範囲の大きさと掛けて、上位のビットを取ると、剰余より偏りが小さくなります。
- **偏りを明示している**: 関数名の `Biased` が、偏りがあることを表しています。使う側が選べます。
- **より厳密な版と対**: `uintLessThan` は偏りがありませんが、実行時間が一定ではありません。用途で使い分けます。

## まとめ

- `uintLessThanBiased` は、乱数を 1 回引き、掛け算で範囲に写します。
- 実行時間は一定ですが、わずかな偏りがあります。
- 偏りが問題になる場合は、`uintLessThan` を使います。
