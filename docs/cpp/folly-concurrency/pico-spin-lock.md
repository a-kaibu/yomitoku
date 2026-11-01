---
title: 整数の 1 ビットだけを借りてロックにする
description: PicoSpinLock は既存の整数の空きビット 1 つをロックとして使う。残りのビットには普通のデータを入れたまま、ビット単位の不可分操作で排他制御する。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/PicoSpinLock.h
lines: [103, 164]
function: PicoSpinLock
difficulty: 2
tags: [並行処理, ビット演算, メモリ管理, ジェネリクス]
---

## ひとことで

`PicoSpinLock<IntType, Bit>` は、整数の **1 ビットだけ** をロックとして使うスピンロックです。
たとえば 64 ビット整数の最上位ビットをロックにして、残り 63 ビットにはカウンタなど別のデータを入れておけます。
ロックのためだけに別の変数を用意しなくて済むので、メモリを極限まで節約できます。

## コード

::: code-group

```cpp:line-numbers=103 [日本語訳]
  IntType getData() const {
    auto ref = make_atomic_ref(lock_);
    auto val = ref.load(std::memory_order_relaxed);
    return val & ~kLockBitMask_;
  }

  /*
   * 整数のうち、ロック以外のビットの値を設定する。
   *
   * ロックを持っていないときは使わないこと。ただし、他のスレッドが
   * これを使おうとしないと保証できる場合は別。
   */
  void setData(IntType w) {
    FOLLY_SAFE_CHECK(!(w & kLockBitMask_));
    auto ref = make_atomic_ref(lock_);
    auto val = ref.load(std::memory_order_relaxed);
    val = (val & kLockBitMask_) | w;
    ref.store(val, std::memory_order_relaxed);
  }

  /*
   * ブロックせずにロックの取得を試みる。取得できたかどうかを
   * 返す。
   */
  bool try_lock() const {
    auto ret = try_lock_internal();
    annotate_rwlock_try_acquired(
        this, annotate_rwlock_level::wrlock, ret, __FILE__, __LINE__);
    return ret;
  }

  /*
   * ロックを取得できるまでブロックする。待機には Sleeper を使う。
   */
  void lock() const {
    detail::Sleeper sleeper;
    while (!try_lock_internal()) {
      sleeper.wait();
    }
    annotate_rwlock_acquired(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
  }

  /*
   * ロックを解放する。整数の残りのビットの値は
   * 変えない。
   */
  void unlock() const {
    auto ref = make_atomic_ref(lock_);
    annotate_rwlock_released(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
    auto previous = atomic_fetch_reset(ref, Bit, std::memory_order_release);
    FOLLY_SAFE_DCHECK(previous);
  }

 private:
  // lock/try_lock から呼ばれる。これは TSAN を意識していない
  bool try_lock_internal() const {
    auto ref = make_atomic_ref(lock_);
    auto previous = atomic_fetch_set(ref, Bit, std::memory_order_acquire);
    return !previous;
  }
```

```cpp:line-numbers=103 [原文]
  IntType getData() const {
    auto ref = make_atomic_ref(lock_);
    auto val = ref.load(std::memory_order_relaxed);
    return val & ~kLockBitMask_;
  }

  /*
   * Set the value of the other bits in our integer.
   *
   * Don't use this when you aren't holding the lock, unless it can be
   * guaranteed that no other threads may be trying to use this.
   */
  void setData(IntType w) {
    FOLLY_SAFE_CHECK(!(w & kLockBitMask_));
    auto ref = make_atomic_ref(lock_);
    auto val = ref.load(std::memory_order_relaxed);
    val = (val & kLockBitMask_) | w;
    ref.store(val, std::memory_order_relaxed);
  }

  /*
   * Try to get the lock without blocking: returns whether or not we
   * got it.
   */
  bool try_lock() const {
    auto ret = try_lock_internal();
    annotate_rwlock_try_acquired(
        this, annotate_rwlock_level::wrlock, ret, __FILE__, __LINE__);
    return ret;
  }

  /*
   * Block until we can acquire the lock.  Uses Sleeper to wait.
   */
  void lock() const {
    detail::Sleeper sleeper;
    while (!try_lock_internal()) {
      sleeper.wait();
    }
    annotate_rwlock_acquired(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
  }

  /*
   * Release the lock, without changing the value of the rest of the
   * integer.
   */
  void unlock() const {
    auto ref = make_atomic_ref(lock_);
    annotate_rwlock_released(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
    auto previous = atomic_fetch_reset(ref, Bit, std::memory_order_release);
    FOLLY_SAFE_DCHECK(previous);
  }

 private:
  // called by lock/try_lock - this is not TSAN aware
  bool try_lock_internal() const {
    auto ref = make_atomic_ref(lock_);
    auto previous = atomic_fetch_set(ref, Bit, std::memory_order_acquire);
    return !previous;
  }
```

:::

ここで使われている型と定数は、同じクラスの少し上で定義されています。`Bit` の既定値は `sizeof(IntType) * 8 - 1`、つまり最上位ビットです。

```cpp:line-numbers=64
template <class IntType, int Bit = sizeof(IntType) * 8 - 1>
struct PicoSpinLock {
  // Internally we deal with the unsigned version of the type.
  using UIntType = std::make_unsigned_t<IntType>;
```

```cpp:line-numbers=76
  static constexpr UIntType kLockBitMask_ = UIntType(1) << Bit;
  alignas(atomic_ref<UIntType>::required_alignment) mutable UIntType lock_;
```

## 前提知識

- **テンプレート引数 `IntType` と `Bit`**: `PicoSpinLock<uint64_t, 63>` のように、使う整数の型とロックに使うビット番号を指定します。
- **`UIntType`**: `IntType` の符号なし版です。ビット操作は符号なし整数で行うのが安全です。
- **`&`、`|`、`~`**: ビットごとの AND、OR、反転です。`val & ~mask` は「mask のビットだけ 0 にする」、`(val & mask) | w` は「mask のビットは残し、他を w に置き換える」です。
- **`atomic_ref`**: 普通の変数を、操作するときだけ atomic として扱うための「参照」です。`make_atomic_ref(lock_)` で作ります。変数自体は普通の整数のままなので、構造体を POD に保てます。
- **`mutable`**: `const` なメンバ関数の中からでも書き換えてよいメンバであることを示します。`lock()` が `const` 関数なのはこのためです。
- **`atomic_fetch_set(ref, bit, order)`**: Folly の関数で、指定ビットを不可分に 1 にして「元の値が 1 だったか」を返します。`atomic_fetch_reset` はビットを 0 にします。
- **`FOLLY_SAFE_CHECK` / `FOLLY_SAFE_DCHECK`**: 条件が偽ならプログラムを止める検査マクロです。`DCHECK` はデバッグビルドでだけ有効です。

## 何をしているか

`PicoSpinLock<uint16_t>` で考えます。`Bit` は 15、`kLockBitMask_` は `0x8000` です。

### 1. getData：ロックビットを隠して読む

```cpp:line-numbers=103
  IntType getData() const {
    auto ref = make_atomic_ref(lock_);
    auto val = ref.load(std::memory_order_relaxed);
    return val & ~kLockBitMask_;
  }
```

`lock_` が `0x8005`（ロック中で、データは 5）なら、`0x8005 & ~0x8000 = 0x0005` を返します。
ロック中かどうかに関係なく、データ部分だけが取り出せます。

### 2. setData：ロックビットを残して書く

```cpp:line-numbers=115
  void setData(IntType w) {
    FOLLY_SAFE_CHECK(!(w & kLockBitMask_));
    auto ref = make_atomic_ref(lock_);
    auto val = ref.load(std::memory_order_relaxed);
    val = (val & kLockBitMask_) | w;
    ref.store(val, std::memory_order_relaxed);
  }
```

最初の `FOLLY_SAFE_CHECK` で、新しいデータ `w` がロックビットに食い込んでいないか確認します。
今の値が `0x8005` で `w = 9` なら、`(0x8005 & 0x8000) | 9 = 0x8009` になります。
ロックビットはそのまま、データだけが置き換わります。
直前のコメントのとおり、ロックを持っているときに呼ぶ前提です。

### 3. try_lock_internal：ビットを立ててみる

```cpp:line-numbers=158
 private:
  // lock/try_lock から呼ばれる。これは TSAN を意識していない
  bool try_lock_internal() const {
    auto ref = make_atomic_ref(lock_);
    auto previous = atomic_fetch_set(ref, Bit, std::memory_order_acquire);
    return !previous;
  }
```

`atomic_fetch_set` でビット 15 を 1 にし、元の値を受け取ります。
元が 0 なら自分がロックを取った本人なので `true` を返します。
元が 1 なら誰かが持っていたので `false` です。どちらの場合もデータ部分は変わりません。

### 4. lock と unlock

```cpp:line-numbers=137
  void lock() const {
    detail::Sleeper sleeper;
    while (!try_lock_internal()) {
      sleeper.wait();
    }
    annotate_rwlock_acquired(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
  }

  /*
   * ロックを解放する。整数の残りのビットの値は
   * 変えない。
   */
  void unlock() const {
    auto ref = make_atomic_ref(lock_);
    annotate_rwlock_released(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
    auto previous = atomic_fetch_reset(ref, Bit, std::memory_order_release);
    FOLLY_SAFE_DCHECK(previous);
  }
```

`lock()` は `try_lock_internal()` が成功するまで `Sleeper` で待ちながら繰り返します。
`unlock()` は `atomic_fetch_reset` でビット 15 を 0 に戻し、元が 1 だったこと（本当にロック中だったこと）を `DCHECK` で確認します。
`annotate_rwlock_*` は ThreadSanitizer 向けの注釈です。

## ここがすごい

- **ロックのコストが 0 バイト**: 1 バイトの `MicroSpinLock` でも、アライメントのための詰め物で構造体が大きくなることがあります。空きビットがある整数なら、この方法では 1 バイトも増えません。ポインタの使われない上位ビットや、上限が分かっているカウンタなどが候補です。
- **データを壊さない操作だけを使う**: 素直に `compare_exchange` で「ロックビットだけ変えた値」に置き換えようとすると、他のビットが変わるたびに失敗してやり直しになります。ビット単位の操作なら、他のビットの値に関係なく一発で済みます。
- **CPU 命令に直結**: `atomic_fetch_set` は x86 では `lock bts` 命令（ビットを立てて元の値を返す命令）になるよう工夫されています。
- **型の制約をコンパイル時に検査**: クラス冒頭の `static_assert` で、整数型であることと 2・4・8 バイトであることを確かめています。

## まとめ

- 整数の 1 ビットは、それだけでロックとして使える。
- データとロックを同じ整数に同居させるなら、ビットマスクで読み書きを分ける。
- 「特定のビットだけを不可分に変える」操作を使うと、他のビットとの競合でやり直しにならない。
- `atomic_ref` を使えば、普通の整数のまま必要なときだけ atomic に扱える。

