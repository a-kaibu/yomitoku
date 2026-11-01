---
title: 「最後の 1 人」だけが合図を出すカウントダウン・ラッチ
description: folly::Latch は N 回の count_down で開く使い捨ての関門。fetch_sub の戻り値で最後の 1 人を判定し、待機は既存のセマフォに丸ごと任せる。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/Latch.h
lines: [84, 158]
function: Latch
difficulty: 1
tags: [並行処理, 設計パターン, API設計, 防御的プログラミング]
---

## ひとことで

`Latch` は、決めた回数 `N` だけ `count_down()` が呼ばれたら開く「関門」です。
たとえば 32 個のスレッドに仕事を配り、全員が終わるまでメインスレッドを `wait()` で待たせる、という使い方をします（クラスの説明コメントにある例）。
C++20 の `std::latch` とほぼ同じですが、時間制限付きの待ちもできます。

## コード

::: code-group

```cpp:line-numbers=84 [日本語訳]
class Latch {
 public:
  /// この実装が扱えるカウンタの最大値
  static constexpr ptrdiff_t max() noexcept {
    return std::numeric_limits<int32_t>::max();
  }

  /// ラッチを作り、内部カウンタを初期化する。
  constexpr explicit Latch(ptrdiff_t expected) : count_(expected) {
    terminate_if(expected < 0 || expected > max());
    if (expected == 0) {
      semaphore_.post();
    }
  }

  /// 呼び出し元をブロックせずに、内部カウンタを不可分に `n` だけ
  /// 減らす。
  FOLLY_ALWAYS_INLINE void count_down(ptrdiff_t n = 1) noexcept {
    terminate_if(n < 0 || n > max());
    if (FOLLY_LIKELY(n)) {
      const auto count = count_.fetch_sub(n, std::memory_order_acq_rel);
      terminate_if(count < n);
      if (FOLLY_UNLIKELY(count == n)) {
        semaphore_.post();
      }
    }
  }

  /// 内部カウンタが 0 に達している場合にだけ true を返す。この関数は
  /// ブロックしない。
  FOLLY_ALWAYS_INLINE bool try_wait() noexcept { return semaphore_.try_wait(); }

  /// 内部カウンタが 0 になるか、指定した `timeout` が
  /// 過ぎるまで待つ。期間内に内部カウンタが 0 になれば true、
  /// そうでなければ false を返す。
  template <typename Rep, typename Period>
  FOLLY_ALWAYS_INLINE bool try_wait_for(
      const std::chrono::duration<Rep, Period>& timeout) noexcept {
    return semaphore_.try_wait_for(timeout);
  }

  /// 内部カウンタが 0 になるか、指定した
  /// `deadline` を過ぎるまで待つ。期限前に内部カウンタが 0 になれば
  /// true、そうでなければ false を返す。
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE bool try_wait_until(
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    return semaphore_.try_wait_until(deadline);
  }

  /// try_wait() と同じだが、const なオブジェクトでも呼べる。
  FOLLY_ALWAYS_INLINE bool ready() const noexcept { return semaphore_.ready(); }

  /// 内部カウンタが 0 になるまで無期限に待つ。
  FOLLY_ALWAYS_INLINE void wait() noexcept { semaphore_.wait(); }

  /// 内部カウンタを不可分に `n` だけ減らし、0 になるまで
  /// 無期限に待つ。`count_down()` の後に
  /// `wait()` を呼ぶのと同じ。
  FOLLY_ALWAYS_INLINE void arrive_and_wait(ptrdiff_t n = 1) noexcept {
    count_down(n);
    wait();
  }

 private:
  FOLLY_ALWAYS_INLINE constexpr void terminate_if(bool cond) noexcept {
    if (cond) {
      folly::terminate_with<std::invalid_argument>(
          "argument outside expected range");
    }
  }

  std::atomic<int32_t> count_;
  SaturatingSemaphore<> semaphore_;
};
```

```cpp:line-numbers=84 [原文]
class Latch {
 public:
  /// The maximum value of counter supported by this implementation
  static constexpr ptrdiff_t max() noexcept {
    return std::numeric_limits<int32_t>::max();
  }

  /// Constructs a latch and initializes its internal counter.
  constexpr explicit Latch(ptrdiff_t expected) : count_(expected) {
    terminate_if(expected < 0 || expected > max());
    if (expected == 0) {
      semaphore_.post();
    }
  }

  /// Atomically decrements the internal counter by `n` without blocking the
  /// caller.
  FOLLY_ALWAYS_INLINE void count_down(ptrdiff_t n = 1) noexcept {
    terminate_if(n < 0 || n > max());
    if (FOLLY_LIKELY(n)) {
      const auto count = count_.fetch_sub(n, std::memory_order_acq_rel);
      terminate_if(count < n);
      if (FOLLY_UNLIKELY(count == n)) {
        semaphore_.post();
      }
    }
  }

  /// Returns true only if the internal counter has reached zero. The function
  /// does not block.
  FOLLY_ALWAYS_INLINE bool try_wait() noexcept { return semaphore_.try_wait(); }

  /// Wait until the internal counter reaches zero, or until the given `timeout`
  /// expires. Returns true if the internal counter reached zero before the
  /// period expired, otherwise false.
  template <typename Rep, typename Period>
  FOLLY_ALWAYS_INLINE bool try_wait_for(
      const std::chrono::duration<Rep, Period>& timeout) noexcept {
    return semaphore_.try_wait_for(timeout);
  }

  /// Wait until the internal counter reaches zero, or until the given
  /// `deadline` expires. Returns true if the internal counter reached zero
  /// before the deadline expired, otherwise false.
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE bool try_wait_until(
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    return semaphore_.try_wait_until(deadline);
  }

  /// Equivalent to try_wait(), but available on const receivers.
  FOLLY_ALWAYS_INLINE bool ready() const noexcept { return semaphore_.ready(); }

  /// Wait until the internal counter reaches zero, indefinitely.
  FOLLY_ALWAYS_INLINE void wait() noexcept { semaphore_.wait(); }

  /// Atomically decrement the internal counter by `n` and wait until the
  /// internal counter reaches zero, indefinitely. Equivalent to `count_down()`
  /// followed by a `wait()`.
  FOLLY_ALWAYS_INLINE void arrive_and_wait(ptrdiff_t n = 1) noexcept {
    count_down(n);
    wait();
  }

 private:
  FOLLY_ALWAYS_INLINE constexpr void terminate_if(bool cond) noexcept {
    if (cond) {
      folly::terminate_with<std::invalid_argument>(
          "argument outside expected range");
    }
  }

  std::atomic<int32_t> count_;
  SaturatingSemaphore<> semaphore_;
};
```

:::

## 前提知識

- **`class` と `public:` / `private:`**: クラスの中で、外から使える部分と内部だけで使う部分を分けます。
- **コンストラクタ（`Latch(ptrdiff_t expected)`）**: オブジェクトを作るときに呼ばれる関数です。`: count_(expected)` の部分は「メンバ `count_` を `expected` で初期化する」という書き方です。
- **`explicit`**: `Latch l = 5;` のような暗黙の変換を禁止し、`Latch l(5);` と明示的に書かせます。
- **`constexpr` コンストラクタ**: 条件がそろえばコンパイル時にオブジェクトを作れます。
- **`ptrdiff_t`**: ポインタの差を表す符号付き整数型です。ここでは「回数」を符号付きで受け取るのに使っています。
- **既定引数（`ptrdiff_t n = 1`）**: 引数を省略すると `1` として扱われます。
- **`fetch_sub(n, order)`**: atomic 変数から `n` を引き、**引く前の値** を返します。
- **`SaturatingSemaphore`**: Folly のセマフォの一種で、一度 `post()` されると以後ずっと「準備完了」のままになる部品です。`wait()` は準備完了になるまで待ちます。
- **`FOLLY_LIKELY` / `FOLLY_UNLIKELY`**: 「この条件はたいてい真（偽）」とコンパイラに伝えるヒントです。

## 何をしているか

### 作るとき

```cpp:line-numbers=92
  constexpr explicit Latch(ptrdiff_t expected) : count_(expected) {
    terminate_if(expected < 0 || expected > max());
    if (expected == 0) {
      semaphore_.post();
    }
  }
```
`count_` に `expected` を入れます。
負の数や `int32_t` の最大値を超える数なら、`terminate_if` でプログラムを終了させます。
`expected` が 0 なら、最初から開いているべきなので、その場でセマフォを `post()` します。

### count_down

```cpp:line-numbers=101
  FOLLY_ALWAYS_INLINE void count_down(ptrdiff_t n = 1) noexcept {
    terminate_if(n < 0 || n > max());
    if (FOLLY_LIKELY(n)) {
      const auto count = count_.fetch_sub(n, std::memory_order_acq_rel);
      terminate_if(count < n);
      if (FOLLY_UNLIKELY(count == n)) {
        semaphore_.post();
      }
    }
  }
```
`Latch latch(3);` を作り、3 つのスレッドが 1 回ずつ `count_down()` を呼ぶとします。

| 呼んだ順 | fetch_sub の戻り値 | 呼んだ後の count_ | post するか |
| --- | --- | --- | --- |
| 1 人目 | 3 | 2 | しない |
| 2 人目 | 2 | 1 | しない |
| 3 人目 | 1 | 0 | **する** |

`count == n` は「引く前の値がちょうど自分の引いた数」、つまり **自分の操作で 0 になった** ことを意味します。
同時に呼ばれても `fetch_sub` は 1 人ずつ順番に処理されるので、この条件を満たすのは必ず 1 人だけです。
`count < n` は、引きすぎ（0 を下回る）を検出して終了させます。
`n` が 0 なら何もしません（`if (FOLLY_LIKELY(n))`）。

### 待つ側

```cpp:line-numbers=114
  FOLLY_ALWAYS_INLINE bool try_wait() noexcept { return semaphore_.try_wait(); }

  /// 内部カウンタが 0 になるか、指定した `timeout` が
  /// 過ぎるまで待つ。期間内に内部カウンタが 0 になれば true、
  /// そうでなければ false を返す。
  template <typename Rep, typename Period>
  FOLLY_ALWAYS_INLINE bool try_wait_for(
      const std::chrono::duration<Rep, Period>& timeout) noexcept {
    return semaphore_.try_wait_for(timeout);
  }

  /// 内部カウンタが 0 になるか、指定した
  /// `deadline` を過ぎるまで待つ。期限前に内部カウンタが 0 になれば
  /// true、そうでなければ false を返す。
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE bool try_wait_until(
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    return semaphore_.try_wait_until(deadline);
  }

  /// try_wait() と同じだが、const なオブジェクトでも呼べる。
  FOLLY_ALWAYS_INLINE bool ready() const noexcept { return semaphore_.ready(); }

  /// 内部カウンタが 0 になるまで無期限に待つ。
  FOLLY_ALWAYS_INLINE void wait() noexcept { semaphore_.wait(); }

  /// 内部カウンタを不可分に `n` だけ減らし、0 になるまで
  /// 無期限に待つ。`count_down()` の後に
  /// `wait()` を呼ぶのと同じ。
  FOLLY_ALWAYS_INLINE void arrive_and_wait(ptrdiff_t n = 1) noexcept {
    count_down(n);
    wait();
  }
```
`try_wait`、`try_wait_for`、`try_wait_until`、`wait` はすべて、中のセマフォの同名関数を呼ぶだけです。
`arrive_and_wait` は「自分も数を減らしてから、全員を待つ」の組み合わせです。

### 範囲外の引数はすぐ終了

```cpp:line-numbers=149
  FOLLY_ALWAYS_INLINE constexpr void terminate_if(bool cond) noexcept {
    if (cond) {
      folly::terminate_with<std::invalid_argument>(
          "argument outside expected range");
    }
  }
```
`terminate_if` は条件が真なら `std::invalid_argument` を理由にプログラムを終了させます。
例外を投げて呼び出し元に処理を任せるのではなく、使い方の誤りとして即座に止める方針です。

## ここがすごい

- **「最後の 1 人」を判定する定石**: 素直に書くと「`count_` を減らす」と「0 になったか読む」を別々の操作にしてしまいがちです。その間に別のスレッドが割り込むと、2 人が同時に「0 になった」と思ったり、誰も気づかなかったりします。`fetch_sub` の **戻り値** を使えば、1 回の不可分操作で判定できます。
- **待機は既存の部品に任せる**: 眠る・起こす・タイムアウトといった難しい部分は、すべて `SaturatingSemaphore` に任せています。`Latch` 自身はカウンタの管理だけに集中できるので、クラス全体が 75 行に収まっています。
- **`acq_rel` の意味**: `fetch_sub` に付けた `acq_rel` により、各スレッドが `count_down` の前に書いたデータは、最後に `post` するスレッドを経由して `wait` から戻ったスレッドまで見えるようになります。
- **よく通る道を明示**: 0 になるのは N 回に 1 回だけなので、`count == n` の判定に `FOLLY_UNLIKELY` を付けています。

## まとめ

- 「自分の操作で 0 になったか」は `fetch_sub` の戻り値で判定する。
- 待機の仕組みは既存の同期部品を組み合わせて作ると、小さく正しいクラスになる。
- 範囲外の引数を例外にするか即終了にするかは、API の方針として決めておく。
- 0 回の関門のような端の場合（コンストラクタの `expected == 0`）も忘れずに扱う。

