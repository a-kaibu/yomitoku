---
title: たった 1 バイトのロック、しかも「ゼロ埋めすれば初期化済み」
description: Folly の MicroSpinLock は 1 バイトの整数をそのままロックとして使うスピンロック。POD 型を守るために std::atomic をあえてメンバに置かない工夫が光る。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/MicroSpinLock.h
lines: [61, 109]
function: MicroSpinLock
difficulty: 2
tags: [並行処理, ロック不要, メモリ管理, 低レイヤ]
---

## ひとことで

`MicroSpinLock` は **1 バイトしか使わないロック** です。
ロックの状態は `0`（空き）か `1`（使用中）だけで、取れなければ取れるまでぐるぐる待つ「スピンロック」として動きます。
小さなデータを大量に持つ構造体の中に、1 個ずつロックを埋め込みたいときに使います。

## コード

::: code-group

```cpp:line-numbers=61 [日本語訳]
struct MicroSpinLock {
  enum { FREE = 0, LOCKED = 1 };
  // POD 型のままにするため、lock_ は std::atomic<> にできない。
  uint8_t lock_;

  // この MSL を初期化する。MicroSpinLock をゼロ初期化した場合は
  // これを呼ぶ必要はない。
  void init() noexcept { payload()->store(FREE); }

  bool try_lock() noexcept {
    bool ret = xchg_acquire(LOCKED) == FREE;
    annotate_rwlock_try_acquired(
        this, annotate_rwlock_level::wrlock, ret, __FILE__, __LINE__);
    return ret;
  }

  void lock() noexcept {
    detail::Sleeper sleeper;
    while (xchg_acquire(LOCKED) != FREE) {
      do {
        sleeper.wait();
      } while (payload()->load(std::memory_order_relaxed) == LOCKED);
    }
    assert(payload()->load() == LOCKED);
    annotate_rwlock_acquired(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
  }

  void unlock() noexcept {
    assert(payload()->load() == LOCKED);
    annotate_rwlock_released(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
    payload()->store(FREE, std::memory_order_release);
  }

 private:
  std::atomic<uint8_t>* payload() noexcept {
    return reinterpret_cast<std::atomic<uint8_t>*>(&this->lock_);
  }

  uint8_t xchg_acquire(uint8_t newVal) noexcept {
    return std::atomic_exchange_explicit(
        payload(), newVal, std::memory_order_acquire);
  }
};
static_assert(
    std::is_standard_layout<MicroSpinLock>::value &&
        std::is_trivial<MicroSpinLock>::value,
    "MicroSpinLock must be kept a POD type.");
```

```cpp:line-numbers=61 [原文]
struct MicroSpinLock {
  enum { FREE = 0, LOCKED = 1 };
  // lock_ can't be std::atomic<> to preserve POD-ness.
  uint8_t lock_;

  // Initialize this MSL.  It is unnecessary to call this if you
  // zero-initialize the MicroSpinLock.
  void init() noexcept { payload()->store(FREE); }

  bool try_lock() noexcept {
    bool ret = xchg_acquire(LOCKED) == FREE;
    annotate_rwlock_try_acquired(
        this, annotate_rwlock_level::wrlock, ret, __FILE__, __LINE__);
    return ret;
  }

  void lock() noexcept {
    detail::Sleeper sleeper;
    while (xchg_acquire(LOCKED) != FREE) {
      do {
        sleeper.wait();
      } while (payload()->load(std::memory_order_relaxed) == LOCKED);
    }
    assert(payload()->load() == LOCKED);
    annotate_rwlock_acquired(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
  }

  void unlock() noexcept {
    assert(payload()->load() == LOCKED);
    annotate_rwlock_released(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
    payload()->store(FREE, std::memory_order_release);
  }

 private:
  std::atomic<uint8_t>* payload() noexcept {
    return reinterpret_cast<std::atomic<uint8_t>*>(&this->lock_);
  }

  uint8_t xchg_acquire(uint8_t newVal) noexcept {
    return std::atomic_exchange_explicit(
        payload(), newVal, std::memory_order_acquire);
  }
};
static_assert(
    std::is_standard_layout<MicroSpinLock>::value &&
        std::is_trivial<MicroSpinLock>::value,
    "MicroSpinLock must be kept a POD type.");
```

:::

## 前提知識

- **`struct`**: C++ では `class` とほぼ同じで、メンバが既定で公開（public）になる点だけが違います。
- **POD（Plain Old Data）**: C 言語の構造体と同じように、ただのバイト列として扱える型のことです。コンストラクタを持たず、`memset` で 0 埋めしたりそのままコピーしたりできます。
- **`std::atomic<T>`**: 複数のスレッドから同時に読み書きしても壊れない変数です。`load`（読む）、`store`（書く）、`exchange`（書いて古い値を返す）などの操作があります。
- **メモリオーダー（`std::memory_order_acquire` / `release` / `relaxed`）**: CPU やコンパイラは命令の順序を入れ替えることがあります。`acquire` は「これより後の読み書きを前に出さない」、`release` は「これより前の読み書きを後ろに回さない」という約束です。`relaxed` は順序の約束をせず、値の読み書きだけを不可分に行います。
- **`reinterpret_cast`**: ポインタの型を無理やり読み替える変換です。ここでは `uint8_t*` を `std::atomic<uint8_t>*` と見なしています。
- **`noexcept`**: この関数は例外を投げない、という宣言です。
- **`static_assert`**: コンパイル時に条件を確かめ、満たさなければコンパイルエラーにする仕組みです。
- **`__FILE__` / `__LINE__`**: コンパイラが埋め込む「今のファイル名」と「今の行番号」です。

## 何をしているか

### 1. 状態は 1 バイトの整数

```cpp:line-numbers=62
  enum { FREE = 0, LOCKED = 1 };
  // POD 型のままにするため、lock_ は std::atomic<> にできない。
  uint8_t lock_;
```

状態は `FREE = 0` と `LOCKED = 1` の 2 つだけです。
本体は `uint8_t lock_;` という普通の 1 バイト整数で、`std::atomic<uint8_t>` ではありません。
コメントのとおり、`std::atomic` をメンバにすると POD でなくなってしまうからです。

### 2. 普通の整数を atomic として読み替える

```cpp:line-numbers=96
 private:
  std::atomic<uint8_t>* payload() noexcept {
    return reinterpret_cast<std::atomic<uint8_t>*>(&this->lock_);
  }

  uint8_t xchg_acquire(uint8_t newVal) noexcept {
    return std::atomic_exchange_explicit(
        payload(), newVal, std::memory_order_acquire);
  }
```

`payload()` は `lock_` のアドレスを `std::atomic<uint8_t>*` に読み替えて返します。
これで「ふだんはただの整数、操作するときだけ atomic」という使い方ができます。
`xchg_acquire(LOCKED)` は「`1` を書き込み、書き込む前の値を返す」操作を不可分に行います。

### 3. try_lock：1 回だけ試す

```cpp:line-numbers=70
  bool try_lock() noexcept {
    bool ret = xchg_acquire(LOCKED) == FREE;
    annotate_rwlock_try_acquired(
        this, annotate_rwlock_level::wrlock, ret, __FILE__, __LINE__);
    return ret;
  }
```

`xchg_acquire(LOCKED) == FREE` なら、自分が `0` を `1` に変えた本人なのでロック成功です。
すでに `1` だったなら、`1` を `1` で上書きしただけなので何も壊れません。
`annotate_rwlock_try_acquired` は、スレッド検査ツール（ThreadSanitizer）にロック取得を知らせる注釈です。

### 4. lock：取れるまで待つ

```cpp:line-numbers=77
  void lock() noexcept {
    detail::Sleeper sleeper;
    while (xchg_acquire(LOCKED) != FREE) {
      do {
        sleeper.wait();
      } while (payload()->load(std::memory_order_relaxed) == LOCKED);
    }
    assert(payload()->load() == LOCKED);
    annotate_rwlock_acquired(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
  }
```

スレッド A がロックを持っている間に、スレッド B が `lock()` を呼んだとします。

1. B は外側の `while` で `exchange` しますが、返ってくるのは `1` なのでループに入ります。
2. 内側の `do-while` では `exchange` をせず、`relaxed` の `load` で値を **眺めるだけ** にします。その間 `sleeper.wait()` で少しずつ待ちます。
3. A が `unlock()` して値が `0` になると内側ループを抜け、もう一度 `exchange` に挑戦します。

### 5. unlock：0 を書くだけ

```cpp:line-numbers=89
  void unlock() noexcept {
    assert(payload()->load() == LOCKED);
    annotate_rwlock_released(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
    payload()->store(FREE, std::memory_order_release);
  }
```

`release` 付きで `FREE` を書き込みます。
ロックを持っている間に書いたデータが、次にロックを取ったスレッドから必ず見えるようになります。

### 6. POD であることをコンパイル時に保証

```cpp:line-numbers=106
static_assert(
    std::is_standard_layout<MicroSpinLock>::value &&
        std::is_trivial<MicroSpinLock>::value,
    "MicroSpinLock must be kept a POD type.");
```

`std::is_standard_layout` と `std::is_trivial` の両方が真であることを `static_assert` で確認しています。
誰かがうっかりコンストラクタを足すと、その時点でコンパイルが失敗します。

## ここがすごい

- **「待つ間は書かない」**: `exchange` は書き込みを伴うので、何度も呼ぶとそのキャッシュライン（CPU がまとめて扱うメモリの単位）を CPU 同士で奪い合います。内側ループで読むだけにすると、各 CPU は自分のキャッシュにある値を眺めるだけで済みます。これは TTAS（Test and Test-and-Set）と呼ばれる定番の工夫です。
- **ゼロ初期化＝ロック解除状態**: 空き状態を `0` にしているので、`calloc` で確保したメモリやゼロ埋めした構造体の中にそのまま置けます。構造体の直前のコメントにも、ゼロ初期化は `init()` と同じだと明記されています。
- **POD を守る執念**: `std::atomic` をメンバにすれば読み替えは不要ですが、POD でなくなり、GCC のパック構造体（`__attribute__((__packed__))`）に入れられなくなります。構造体の直前のコメントがその理由を説明しています。
- **ルールをコードで縛る**: 「POD のままにすること」をコメントだけでなく `static_assert` で強制しています。

なお、このファイルの冒頭コメントは「ほとんどの場合スピンロックは使うべきではない」と注意しています。OS がロックを持つスレッドを止めてしまうと、待つ側は CPU を無駄に回し続けるからです。

## まとめ

- ロックは本質的には「0 か 1 かを不可分に切り替える整数」にすぎない。
- 取れないときは書き込まずに読むだけで待つと、キャッシュの奪い合いを減らせる。
- 「ゼロ埋め＝初期状態」になるように値を設計すると、使う側が楽になる。
- 守りたい性質は `static_assert` でコンパイル時に検査できる。

