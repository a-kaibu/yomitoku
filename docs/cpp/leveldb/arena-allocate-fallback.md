---
title: 大きな要求だけ別扱いにして無駄を抑えるメモリアリーナ
description: LevelDB の Arena が、ブロックの残りでは足りないときに呼ぶ関数。「4 分の 1 ルール」で、大きな割り当てだけを専用ブロックに逃がして無駄を小さくしている。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/arena.cc
lines: [20, 36]
function: Arena::AllocateFallback
difficulty: 1
format: 2
tags: [メモリ管理, 最適化, データ構造]
---

## ひとことで

`Arena`（アリーナ）は、小さなメモリをたくさん、速く確保するための仕組みです。4096 バイトの大きな塊（ブロック）を先に確保しておき、そこから少しずつ切り出して渡します。
`AllocateFallback` は、今のブロックの残りでは足りないときに呼ばれる「予備ルート」です。要求が大きいか小さいかで、2 通りの対応を使い分けます。

## コード

::: code-group

```cpp:line-numbers=20 [日本語訳]
char* Arena::AllocateFallback(size_t bytes) {
  if (bytes > kBlockSize / 4) {
    // オブジェクトがブロックサイズの 4 分の 1 より大きい。別に確保して
    // 余りのバイトを無駄にしすぎないようにする。
    char* result = AllocateNewBlock(bytes);
    return result;
  }

  // 今のブロックの残りは捨てる。
  alloc_ptr_ = AllocateNewBlock(kBlockSize);
  alloc_bytes_remaining_ = kBlockSize;

  char* result = alloc_ptr_;
  alloc_ptr_ += bytes;
  alloc_bytes_remaining_ -= bytes;
  return result;
}
```

```cpp:line-numbers=20 [原文]
char* Arena::AllocateFallback(size_t bytes) {
  if (bytes > kBlockSize / 4) {
    // Object is more than a quarter of our block size.  Allocate it separately
    // to avoid wasting too much space in leftover bytes.
    char* result = AllocateNewBlock(bytes);
    return result;
  }

  // We waste the remaining space in the current block.
  alloc_ptr_ = AllocateNewBlock(kBlockSize);
  alloc_bytes_remaining_ = kBlockSize;

  char* result = alloc_ptr_;
  alloc_ptr_ += bytes;
  alloc_bytes_remaining_ -= bytes;
  return result;
}
```

:::

ふだん呼ばれる速い経路（`util/arena.h` の `Allocate`）は次のとおりです。残りが足りるときはポインタを進めるだけで終わり、足りないときだけ上の関数に来ます。

<!-- source: util/arena.h -->
```cpp:line-numbers=55
inline char* Arena::Allocate(size_t bytes) {
  // 0 バイトの割り当てを許すと、何を返すべきかの意味が少しややこしく
  // なるので、ここでは禁止している（内部の用途では
  // 必要ない）。
  assert(bytes > 0);
  if (bytes <= alloc_bytes_remaining_) {
    char* result = alloc_ptr_;
    alloc_ptr_ += bytes;
    alloc_bytes_remaining_ -= bytes;
    return result;
  }
  return AllocateFallback(bytes);
}
```

## 前提知識

- **`char*`**: 「`char`（1 バイト）が置いてある場所」を指すポインタです。ポインタはメモリ上の住所（アドレス）を持つ変数です。`char*` に整数を足すと、その数のバイトだけ先の住所になります。ここでは「生のメモリ領域の先頭」を表すのに使っています。
- **`size_t`**: メモリの大きさを表す、符号なし（マイナスにならない）整数の型です。
- **`Arena::AllocateFallback`**: `::` は「`Arena` クラスに属する」という意味です。クラスの外で、メンバー関数の中身を書くときに使います。
- **末尾が `_` の変数**: `alloc_ptr_` のように末尾に `_` が付いた名前は、Google のコーディング規約で「クラスのメンバー変数」を表します。文法上の意味はありません。
- **`new char[n]`**: n バイトの配列をヒープ（プログラム実行中に自由に確保できるメモリ領域）に確保します。`AllocateNewBlock` の中で使われ、確保したブロックは `blocks_` に記録されて、アリーナが破棄されるときにまとめて解放されます。

## 何をしているか

前提として、`alloc_ptr_` は「次に切り出す位置」、`alloc_bytes_remaining_` は「今のブロックの残りバイト数」です。`kBlockSize` は同じファイルの先頭で 4096 と決められています。

```cpp:line-numbers=9
static const int kBlockSize = 4096;
```

### 1. 大きな要求は専用ブロックへ

```cpp:line-numbers=21
  if (bytes > kBlockSize / 4) {
    // オブジェクトがブロックサイズの 4 分の 1 より大きい。別に確保して
    // 余りのバイトを無駄にしすぎないようにする。
    char* result = AllocateNewBlock(bytes);
    return result;
  }
```
`kBlockSize / 4`、つまり 1024 バイトより大きい要求は、**その大きさぴったりの専用ブロック** を新しく確保して返します。
たとえば残りが 100 バイトのときに 2000 バイトを頼まれたとします。新しく 4096 バイトのブロックを作ると、今のブロックの 100 バイトが捨てられます。そこで専用ブロックを作り、`alloc_ptr_` は動かしません。今のブロックの残り 100 バイトは、次の小さな要求に使えます。

### 2. 小さな要求は新しいブロックに乗り換え

```cpp:line-numbers=28
  // 今のブロックの残りは捨てる。
  alloc_ptr_ = AllocateNewBlock(kBlockSize);
  alloc_bytes_remaining_ = kBlockSize;
```
1024 バイト以下の要求なら、新しい 4096 バイトのブロックを確保し、そちらに乗り換えます。古いブロックの残りは捨てます（コメントにある「waste」です）。

### 3. 新しいブロックから切り出す

```cpp:line-numbers=32
  char* result = alloc_ptr_;
  alloc_ptr_ += bytes;
  alloc_bytes_remaining_ -= bytes;
  return result;
```
あとは `Allocate` と同じです。先頭を `result` として覚え、`alloc_ptr_` を `bytes` だけ進め、残りを減らします。
たとえば 300 バイトの要求なら、`result` はブロック先頭、`alloc_ptr_` は先頭から 300 バイト目、残りは 3796 バイトになります。

## ここがすごい

- **捨てる量に上限がある**: 小さな要求（1024 バイト以下）だけが乗り換えを起こします。乗り換えが起きるのは「残りが要求より少ないとき」なので、捨てられる量は最大でも約 1024 バイト、つまりブロックの 4 分の 1 ほどに抑えられます。
- **大きな要求で今のブロックを無駄にしない**: 素直に「足りなければ新しいブロック」とだけ書くと、大きな要求が来るたびに古いブロックの残りが失われます。さらに要求がブロックより大きいと、そもそも入りません。専用ブロックに逃がすことで、両方の問題をまとめて避けています。
- **速い経路と遅い経路を分ける**: `Allocate` は `inline`（呼び出し元に中身を展開する指定）でヘッダに置かれ、比較 1 回と足し算だけで終わります。めったに通らない処理を別関数に分けると、よく通る経路が小さく速く保てます。
- **個別に解放しない割り切り**: アリーナは切り出したメモリを 1 つずつ返す機能を持ちません。LevelDB の MemTable（書き込みをためておくメモリ上の表）のように「全部まとめて捨てる」用途だからこそ、この単純さで済みます。

## まとめ

- 小さな割り当てが多いなら、大きな塊から切り出す「アリーナ」が速くて簡単。
- 「大きいものは別扱い」というしきい値を 1 つ入れるだけで、無駄の上限を決められる。
- よく通る速い経路は小さく保ち、まれな処理は別関数に逃がす。
- 個別解放をあきらめる代わりに、まとめて解放できる用途では強力な手法になる。
