---
title: 1 ビットの乱数を取り出して、真か偽の値にする
description: Zig 標準ライブラリの Random.boolean。u1 の乱数を 1 ビット作り、0 でないかを比べて、真か偽を一様な確率で返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [67, 69]
function: Random.boolean
difficulty: 1
format: 2
tags: [乱数, イディオム, 標準ライブラリ]
---

## ひとことで

`boolean` は、ランダムに `true` か `false` を返す関数です。硬貨を投げるように、どちらも同じ確率で出ます。

## コード

```zig:line-numbers=67
pub fn boolean(r: Random) bool {
    return r.int(u1) != 0;
}
```

## 前提知識

- **`u1`**: 1 ビットの符号なし整数です。値は 0 か 1 だけです。
- **`r.int(u1)`**: 1 ビットの乱数を作る呼び出しです。`Random` 型の `int` 関数に、型として `u1` を渡しています。
- **比較 `!= 0`**: 値が 0 でないかを調べて、`bool` にする書き方です。
- **`Random`**: 乱数の生成器を表す型です。どの生成器を使っても、`boolean` の形は同じです。
- **一様性**: 0 と 1 が同じ確率で出るとき、真と偽も同じ確率で出ます。

## 何をしているか

### 1. 1 ビットの乱数を作る

```zig:line-numbers=68
    return r.int(u1) != 0;
```

`r.int(u1)` で、0 か 1 の値を作ります。1 ビットなので、その値に偏りがなければ、0 と 1 は半々です。

### 2. 0 でないかを返す

```zig:line-numbers=68
    return r.int(u1) != 0;
```

`!= 0` で、1 のときに `true`、0 のときに `false` を返します。値を `bool` に変える、1 行の書き方です。

## ここがすごい

- **とても短い**: 1 ビットの乱数を、そのまま真偽値にする発想が、1 行に収まっています。
- **型で範囲が決まる**: `u1` を使うので、取り得る値は 2 つだけだと型から分かります。
- **生成器を選ばない**: `Random` の `int` を使うので、どの乱数の生成器でも、同じ関数が動きます。
- **使い道が広い**: 確率 50 パーセントの分岐や、ランダムな選択で、よく使われる部品です。

## まとめ

- `boolean` は、1 ビットの乱数を真偽値にして返します。
- `u1` の乱数を `!= 0` で比べるのが基本の形です。
- 真と偽は、同じ確率で出ます。
