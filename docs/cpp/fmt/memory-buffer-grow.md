---
title: 小さいうちは自前の配列、足りなくなったら 1.5 倍に育つバッファ
description: "{fmt} の出力バッファ basic_memory_buffer の容量を増やす関数。最初は内蔵配列を使い、あふれたら 1.5 倍の領域を確保して中身を移す。コンパイル時実行にも対応している。"
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [979, 1007]
function: basic_memory_buffer::grow
difficulty: 2
format: 2
tags: [メモリ管理, データ構造, 最適化]
---

## ひとことで

`basic_memory_buffer` は {fmt} が文字列を組み立てるときに使うバッファで、**最初は自分の中に持っている配列（デフォルト 500 要素）** に書きます。短い文字列ならヒープ（`new` や `malloc` で取るメモリ）を一度も使いません。

`grow` は、書き込みが内蔵配列やいまの領域に収まらなくなったときに呼ばれ、**今の 1.5 倍** の新しい領域を確保して中身を移します。

## コード

::: code-group

```cpp:line-numbers=979 [日本語訳]
  static FMT_CONSTEXPR20 void grow(detail::buffer<T>& buf, size_t size) {
    detail::abort_fuzzing_if(size > 5000);
    auto& self = static_cast<basic_memory_buffer&>(buf);
    size_t max_size = std::allocator_traits<Allocator>::max_size(self.alloc_);
    size_t old_capacity = buf.capacity();
    size_t new_capacity = old_capacity + old_capacity / 2;
    if (size > new_capacity)
      new_capacity = size;
    else if (new_capacity > max_size)
      new_capacity = max_of(size, max_size);
    T* old_data = buf.data();
    T* new_data = self.alloc_.allocate(new_capacity);
    // 以下のコードは例外を投げないので、上の生ポインタがリークすることはない。
    if (detail::is_constant_evaluated()) {
      for (size_t i = 0; i < new_capacity; ++i) {
        std::allocator_traits<Allocator>::construct(
            self.alloc_, new_data + i, i < buf.size() ? old_data[i] : T());
      }
    } else {
      // gcc 13.1 の誤った -Wstringop-overflow 警告を抑える (#3481)。
      detail::assume(buf.size() <= new_capacity);
      memcpy(new_data, old_data, buf.size() * sizeof(T));
    }
    self.set(new_data, new_capacity);
    // 規格上 deallocate は例外を投げてはならないが、仮に投げても、
    // バッファはすでに新しい領域を使っており、それはデストラクタで
    // 解放される。
    if (old_data != self.store_) self.alloc_.deallocate(old_data, old_capacity);
  }
```

```cpp:line-numbers=979 [原文]
  static FMT_CONSTEXPR20 void grow(detail::buffer<T>& buf, size_t size) {
    detail::abort_fuzzing_if(size > 5000);
    auto& self = static_cast<basic_memory_buffer&>(buf);
    size_t max_size = std::allocator_traits<Allocator>::max_size(self.alloc_);
    size_t old_capacity = buf.capacity();
    size_t new_capacity = old_capacity + old_capacity / 2;
    if (size > new_capacity)
      new_capacity = size;
    else if (new_capacity > max_size)
      new_capacity = max_of(size, max_size);
    T* old_data = buf.data();
    T* new_data = self.alloc_.allocate(new_capacity);
    // The following code doesn't throw, so the raw pointer above doesn't leak.
    if (detail::is_constant_evaluated()) {
      for (size_t i = 0; i < new_capacity; ++i) {
        std::allocator_traits<Allocator>::construct(
            self.alloc_, new_data + i, i < buf.size() ? old_data[i] : T());
      }
    } else {
      // Suppress a bogus -Wstringop-overflow in gcc 13.1 (#3481).
      detail::assume(buf.size() <= new_capacity);
      memcpy(new_data, old_data, buf.size() * sizeof(T));
    }
    self.set(new_data, new_capacity);
    // deallocate must not throw according to the standard, but even if it does,
    // the buffer already uses the new storage and will deallocate it in
    // destructor.
    if (old_data != self.store_) self.alloc_.deallocate(old_data, old_capacity);
  }
```

:::

## 前提知識

- **クラスのメンバ**: `store_` は内蔵配列（`T store_[SIZE];`）、`alloc_` はメモリを確保する係（アロケータ）です。
- **`static` メンバ関数と `self`**: `grow` は `static` なので `this` がありません。基底クラス `buffer<T>` への参照 `buf` を受け取り、`static_cast` で自分の型 `basic_memory_buffer&` に戻して `self` と呼んでいます。
- **関数ポインタで呼ばれる**: 基底クラス `buffer` は、仮想関数の代わりにこの `grow` の関数ポインタを持っています（コンストラクタで `buffer<T>(grow)` と渡す）。
- **`T*`（生ポインタ）**: 確保したメモリの先頭を指すポインタです。
- **`std::allocator_traits`**: どんなアロケータでも同じ書き方で使えるようにする標準の道具です。`max_size` で確保できる最大数、`construct` で要素の作成ができます。
- **`memcpy`**: メモリをバイト単位でそのままコピーします。
- **`is_constant_evaluated()`**: コンパイル時に実行されているかを返します。

## 何をしているか

### 1. 新しい容量を決める

```cpp:line-numbers=982
    size_t max_size = std::allocator_traits<Allocator>::max_size(self.alloc_);
    size_t old_capacity = buf.capacity();
    size_t new_capacity = old_capacity + old_capacity / 2;
    if (size > new_capacity)
      new_capacity = size;
    else if (new_capacity > max_size)
      new_capacity = max_of(size, max_size);
```

基本は `old_capacity + old_capacity / 2`、つまり 1.5 倍です。

- 内蔵配列 500 要素が満杯なら、新しい容量は 750。
- ただし要求サイズ `size` がそれより大きければ（たとえば一度に 2000 要素書きたい）、`size` をそのまま使います。
- 1.5 倍がアロケータの上限を超えるときは、上限に抑えます。

### 2. 新しい領域を確保して中身を移す

```cpp:line-numbers=989
    T* old_data = buf.data();
    T* new_data = self.alloc_.allocate(new_capacity);
    // 以下のコードは例外を投げないので、上の生ポインタがリークすることはない。
    if (detail::is_constant_evaluated()) {
      for (size_t i = 0; i < new_capacity; ++i) {
        std::allocator_traits<Allocator>::construct(
            self.alloc_, new_data + i, i < buf.size() ? old_data[i] : T());
      }
    } else {
      // gcc 13.1 の誤った -Wstringop-overflow 警告を抑える (#3481)。
      detail::assume(buf.size() <= new_capacity);
      memcpy(new_data, old_data, buf.size() * sizeof(T));
    }
```

実行時は `memcpy` で今の中身を一気にコピーします。コンパイル時は `memcpy` が使えないので、1 要素ずつ `construct` で作ります。残りの要素も `T()` で初期化するのは、コンパイル時には未初期化のメモリが許されないからです。

### 3. 付け替えて古い領域を返す

```cpp:line-numbers=1002
    self.set(new_data, new_capacity);
    // 規格上 deallocate は例外を投げてはならないが、仮に投げても、
    // バッファはすでに新しい領域を使っており、それはデストラクタで
    // 解放される。
    if (old_data != self.store_) self.alloc_.deallocate(old_data, old_capacity);
```

`self.set` でバッファの指す先を新しい領域に変えます。古い領域が **内蔵配列でなければ** 解放します。内蔵配列はオブジェクトの一部なので、解放してはいけません。

## ここがすごい

- **小さい文字列はヒープ不要**: ログやメッセージの多くは数百文字以内です。内蔵配列（スモールバッファ最適化）のおかげで、その場合はメモリ確保のコストがゼロになります。
- **1.5 倍ずつ育てる**: 1 文字ずつ増やすと、追加のたびにコピーが起きて全体で O(n²) になります。倍率で増やすと、コピーの合計が要素数に比例する量で済みます。2 倍より 1.5 倍は無駄な領域が少なめです。
- **例外安全の順序**: 関数の中の 2 つのコメントのとおり、確保（例外が起きうる）→コピー→付け替え→解放、の順にしています。途中で失敗しても、確保済みのメモリが行方不明になりません。
- **仮想関数を使わない**: `grow` を関数ポインタで渡す設計なので、基底クラスに vtable が要りません。`push_back` などの頻繁な操作は基底クラスの中で完結し、容量が足りないときだけこの関数が呼ばれます。
- **ファジング対策**: 先頭の `abort_fuzzing_if` は、ファジング（ランダム入力での試験）用のビルドでだけ、巨大な確保を打ち切るためのものです。普段は何もしません。

## まとめ

- 小さいデータは内蔵配列で持ち、あふれたときだけヒープを使うと速い。
- 容量は一定量ずつでなく倍率で増やすと、コピーの総量が抑えられる。
- 確保→コピー→付け替え→解放の順にすると、失敗してもメモリが漏れない。
- 仮想関数の代わりに関数ポインタを持つと、軽い多態が実現できる。
