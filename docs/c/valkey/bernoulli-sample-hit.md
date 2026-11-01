---
title: "割り算もロックも使わずに「確率 p% で当たり」を引く"
description: "指定したパーセントの確率で 1 を返すサンプラー。スレッドごとの xorshift64* 乱数と、割り算を掛け算に置き換えた比較で、毎回呼んでも軽い。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2009-2012, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/util.c
lines: [1732, 1748]
function: "bernoulliSampleHit"
difficulty: 3
tags: [乱数, 並行処理, 最適化, ビット演算]
---

## ひとことで

`bernoulliSampleHit(percentage)` は、`percentage`％の確率で `1`（当たり）、それ以外は `0` を返す関数です。
`bernoulliSampleHit(10)` なら、およそ 10 回に 1 回だけ `1` が返ります。
イベントのたびに呼ばれるような「ホットパス」（頻繁に実行される部分）で使うため、割り算・剰余・ロックを一切使わずに書かれています。

## コード

```c:line-numbers=1732
/* Lock-free, per-thread Bernoulli sampler: advances a thread-local xorshift64*
 * PRNG and returns 1 with probability `percentage`/100, using only a multiply +
 * compare (no modulo, and no glibc rand() internal lock) so it stays cheap on
 * hot paths that call it for every event. */
int bernoulliSampleHit(int percentage) {
    static __thread uint64_t s = 0;
    if (s == 0) {
        s = (uint64_t)(uintptr_t)&s ^ 0x9E3779B97F4A7C15ULL; /* seed from stack address; multiplier from Vigna's xorshift64* paper */
        s |= 1;                                              /* xorshift64 needs a nonzero state */
    }
    s ^= s >> 12;
    s ^= s << 25;
    s ^= s >> 27;
    uint32_t r = (uint32_t)((s * 0x2545F4914F6CDD1DULL) >> 32); /* multiplier from Vigna's xorshift64* paper */
    /* r/2^32 < pct/100  <=>  r*100 < pct*2^32  (no division). */
    return (uint64_t)r * 100 < ((uint64_t)percentage << 32);
}
```

## 前提知識

- **`static __thread`**: `static` は「関数を抜けても値を覚えている変数」、`__thread` は GCC/Clang の拡張で「スレッドごとに別々の変数」を作る指定です。組み合わせると、各スレッドが自分専用の乱数の状態を持ちます。ほかのスレッドと共有しないので、ロック（排他制御）がいりません。
- **xorshift**: シフトと XOR だけで次の乱数を作る、とても軽い乱数生成器です。状態が 0 だと永遠に 0 のままになるので、0 以外で始める必要があります。
- **xorshift64\***: xorshift の出力に大きな奇数を掛けて、品質を上げた変種です。セバスティアーノ・ヴィーニャ（Vigna）の論文で提案された定数を使います。
- **`(uintptr_t)&s`**: 変数 `s` のアドレスを整数として取り出します。スレッドごとに `s` は別の場所にあるので、スレッドごとに違う値になります。
- **`|= 1`**: 最下位ビットを 1 にします。これで値が 0 でないことが保証されます。
- **`ULL`**: 整数リテラルを `unsigned long long`（64 ビット符号なし）として扱う印です。
- **`(uint32_t)(x >> 32)`**: 64 ビットの値の上位 32 ビットを取り出します。

## 何をしているか

### 1. スレッドごとの種（1737〜1741 行目）

初回だけ `s == 0` なので、`s` のアドレスと定数 `0x9E3779B97F4A7C15` を XOR して種にします。コメントによると、この定数もヴィーニャの論文由来です。最後に `s |= 1` で 0 を避けます。

### 2. 乱数を 1 つ進める（1742〜1745 行目）

`s ^= s >> 12; s ^= s << 25; s ^= s >> 27;` が xorshift64 の 1 ステップです。そのあと `s` に定数 `0x2545F4914F6CDD1D` を掛け、上位 32 ビットを `r` として取り出します。xorshift の出力は下位ビットの品質が低めなので、掛け算で混ぜた後の **上位** を使うのが定石です。

### 3. 割り算なしで確率を判定（1746〜1747 行目）

`r` は 0〜2^32-1 の一様な乱数です。「`r / 2^32 < percentage / 100` なら当たり」と判定したいのですが、割り算を避けるために両辺に `100 * 2^32` を掛けて、

`r * 100 < percentage * 2^32`

と変形しています。`percentage << 32` は `percentage * 2^32` のことです。

`percentage = 10` なら右辺は `10 * 2^32`。`r * 100` がそれより小さくなるのは `r < 2^32 / 10` のときで、`r` が一様ならちょうど 10％の確率です。

`r` は 32 ビット、`100` を掛けても 2^39 程度なので、64 ビットに収まりあふれません。

## ここがすごい

**`rand()` を使わない理由**: コメントにあるとおり、glibc の `rand()` は内部でロックを取ります。複数スレッドから毎回呼ぶと、そのロックの奪い合いが遅さの原因になります。この関数はスレッドごとの状態を持つので、ロックが不要です。

**`%` を使わない理由**: 「`rand() % 100 < percentage`」という素直な書き方には、遅い剰余演算が入ります。さらに 2^32 は 100 で割り切れないので、剰余を使うとわずかに偏りが出ます。この関数は「掛け算して比較」に変形することで、剰余も割り算もなしに判定しています。

**種の作り方の割り切り**: 種はスレッドの変数のアドレスから作るので、暗号的な乱数ではありません。しかし目的は「だいたい p% の割合でサンプリングする」ことなので、軽さを優先した妥当な選択です。

**数学の変形をコードに残す**: 1746 行目のコメント `r/2^32 < pct/100 <=> r*100 < pct*2^32` は、読む人が式の正しさをすぐ確かめられるようにする、よい書き方です。

## まとめ

- `__thread` でスレッドごとの状態を持てば、乱数生成にロックはいらない。
- xorshift64\* はシフト・XOR と掛け算 1 回でそこそこの品質の乱数を作る。出力は上位ビットを使う。
- 「`a/b < c/d`」は「`a*d < c*b`」に変形すれば割り算なしで比べられる（あふれないことを確認して）。
- 剰余 `%` で範囲を縮めると、割り切れない場合にわずかな偏りが出る。
