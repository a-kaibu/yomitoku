---
title: ビットマスクでアドレスの「ずれ」を測るアライン付き確保
description: LevelDB の Arena で、ポインタ境界にそろったメモリを返す関数。2 のべき乗を使ったビットマスクで余りを求め、必要な詰め物だけを足す。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/arena.cc
lines: [38, 56]
function: Arena::AllocateAligned
difficulty: 2
format: 2
tags: [メモリ管理, ビット演算, 低レイヤ]
---

## ひとことで

`AllocateAligned` は、アリーナ（大きなメモリの塊から少しずつ切り出す仕組み）から、**8 の倍数などきりのいい住所から始まるメモリ** を切り出す関数です。
ポインタや 64 ビット整数を置くメモリは、住所がそろっていない（アラインされていない）と、遅くなったり CPU によってはエラーになったりします。この関数は、必要なぶんだけ「詰め物」をはさんで住所をそろえます。

## コード

::: code-group

```cpp:line-numbers=38 [日本語訳]
char* Arena::AllocateAligned(size_t bytes) {
  const int align = (sizeof(void*) > 8) ? sizeof(void*) : 8;
  static_assert((align & (align - 1)) == 0,
                "Pointer size should be a power of 2");
  size_t current_mod = reinterpret_cast<uintptr_t>(alloc_ptr_) & (align - 1);
  size_t slop = (current_mod == 0 ? 0 : align - current_mod);
  size_t needed = bytes + slop;
  char* result;
  if (needed <= alloc_bytes_remaining_) {
    result = alloc_ptr_ + slop;
    alloc_ptr_ += needed;
    alloc_bytes_remaining_ -= needed;
  } else {
    // AllocateFallback は常にアラインされたメモリを返す
    result = AllocateFallback(bytes);
  }
  assert((reinterpret_cast<uintptr_t>(result) & (align - 1)) == 0);
  return result;
}
```

```cpp:line-numbers=38 [原文]
char* Arena::AllocateAligned(size_t bytes) {
  const int align = (sizeof(void*) > 8) ? sizeof(void*) : 8;
  static_assert((align & (align - 1)) == 0,
                "Pointer size should be a power of 2");
  size_t current_mod = reinterpret_cast<uintptr_t>(alloc_ptr_) & (align - 1);
  size_t slop = (current_mod == 0 ? 0 : align - current_mod);
  size_t needed = bytes + slop;
  char* result;
  if (needed <= alloc_bytes_remaining_) {
    result = alloc_ptr_ + slop;
    alloc_ptr_ += needed;
    alloc_bytes_remaining_ -= needed;
  } else {
    // AllocateFallback always returned aligned memory
    result = AllocateFallback(bytes);
  }
  assert((reinterpret_cast<uintptr_t>(result) & (align - 1)) == 0);
  return result;
}
```

:::

## 前提知識

- **アライメント**: データを置く住所を、ある数（8 など）の倍数にそろえることです。8 バイトの整数を住所 16 に置くのは OK、住所 13 に置くのはずれている、という具合です。
- **`sizeof(void*)`**: ポインタ 1 個の大きさ（バイト数）です。64 ビット環境ではふつう 8 です。`sizeof` はコンパイル時に決まる値です。
- **`static_assert(条件, "メッセージ")`**: コンパイル時に条件を確かめ、成り立たなければコンパイルを失敗させます。実行時のコストはゼロです。
- **`reinterpret_cast<uintptr_t>(p)`**: ポインタ `p` を、同じビットの整数として読み替えます。`uintptr_t` はポインタを入れられる大きさの符号なし整数型です。住所を数値として計算したいときに使います。
- **`x & (align - 1)`**: `align` が 2 のべき乗（8 など）のとき、`x % align`（割った余り）と同じ結果になります。`8 - 1 = 7` は 2 進数で `111` なので、下位 3 ビットだけが残ります。
- **`assert(条件)`**: デバッグ時に条件を確かめ、成り立たなければプログラムを止めます。

## 何をしているか

### 1. そろえる単位を決める

```cpp:line-numbers=39
  const int align = (sizeof(void*) > 8) ? sizeof(void*) : 8;
  static_assert((align & (align - 1)) == 0,
                "Pointer size should be a power of 2");
```
`align` は「ポインタの大きさ」と 8 の大きいほうです。64 ビット環境なら 8 です。
`static_assert` で、`align` が 2 のべき乗であることをコンパイル時に確かめます。`(align & (align - 1)) == 0` は 2 のべき乗かどうかを調べる定番の式です。8 なら `1000 & 0111 = 0` で合格します。6 なら `110 & 101 = 100` となり不合格です。

### 2. ずれを測る

```cpp:line-numbers=42
  size_t current_mod = reinterpret_cast<uintptr_t>(alloc_ptr_) & (align - 1);
  size_t slop = (current_mod == 0 ? 0 : align - current_mod);
  size_t needed = bytes + slop;
```
今の切り出し位置 `alloc_ptr_` の住所を整数にして、`& (align - 1)` で 8 で割った余りを求めます。
たとえば住所が `0x1003` なら、下位 3 ビットは `011` なので `current_mod = 3` です。次の 8 の倍数 `0x1008` まで進むには、`slop = 8 - 3 = 5` バイトの詰め物が必要です。
もともとそろっていれば `slop = 0` です。必要な合計は `needed = bytes + slop` です。

### 3. 残りで足りれば切り出す

```cpp:line-numbers=46
  if (needed <= alloc_bytes_remaining_) {
    result = alloc_ptr_ + slop;
    alloc_ptr_ += needed;
    alloc_bytes_remaining_ -= needed;
```
残りが `needed` 以上なら、返す住所は `alloc_ptr_ + slop`（そろえた位置）です。`alloc_ptr_` は詰め物込みで `needed` だけ進めます。
住所 `0x1003` で 16 バイト要求なら、返すのは `0x1008`、次の切り出し位置は `0x1018` です。

### 4. 足りなければ予備ルートへ

```cpp:line-numbers=50
  } else {
    // AllocateFallback は常にアラインされたメモリを返す
    result = AllocateFallback(bytes);
  }
```
残りが足りなければ `AllocateFallback` に任せます。コメントのとおり、そこで返るのは `new char[]` で確保したばかりのブロックの先頭です。`new` が返すメモリはもともと十分にそろっているので、詰め物はいりません。

### 5. 最後に確認

```cpp:line-numbers=54
  assert((reinterpret_cast<uintptr_t>(result) & (align - 1)) == 0);
```
返す住所の下位ビットが 0 であることを `assert` で確かめます。

## ここがすごい

- **割り算を使わない**: `%` の代わりに `& (align - 1)` を使っています。`align` が 2 のべき乗だと `static_assert` で保証しているからこそ、この置き換えが安全です。前提をコードで固定している点がうまいところです。
- **詰め物は最小限**: いつも 8 バイト余分に取るのではなく、ずれの分だけ足します。アリーナは小さな割り当てが大量にあるので、この差が積み重なります。
- **ふつうの `Allocate` と使い分け**: 文字列のようにそろえる必要のないデータは `Allocate`、ポインタを含む構造体は `AllocateAligned`、と分けています。LevelDB のスキップリストのノードは後者で確保されます。
- **予備ルートの性質を利用**: 新しいブロックの先頭がそろっていることを利用して、その場合の計算を丸ごと省いています。

## まとめ

- 2 のべき乗 `n` なら `x % n` は `x & (n - 1)` で計算できる。
- `(n & (n - 1)) == 0` で 2 のべき乗かどうかを判定できる。
- 前提条件は `static_assert` でコンパイル時に固定しておくと、最適化を安心して使える。
- アライメントの詰め物は「必要な分だけ」足せば無駄が少ない。
