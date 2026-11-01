---
title: 4 つの状態と遷移表で作る「一度だけ実行」
description: absl::call_once の中核。32 ビットの状態変数 1 つと遷移表で、初回の 1 スレッドだけが関数を実行し、残りは完了まで待つ仕組みを作る。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/base/call_once.h
lines: [135, 192]
function: base_internal::CallOnceImpl
difficulty: 3
tags: [並行処理, 状態機械, ロック不要]
---

## ひとことで

`absl::call_once(flag, fn)` は、何スレッドから同時に呼ばれても `fn` を **ちょうど 1 回だけ** 実行する関数です。初期化処理を 1 度だけ行いたいときに使います。
`CallOnceImpl` はその中核で、`std::atomic<uint32_t>` の状態 1 つを **4 つの値の状態機械** として扱い、遷移表を使って「実行役」「待ち役」を決めます。

## コード

::: code-group

```cpp:line-numbers=135 [日本語訳]
// call_once の状態機械で使う値のビットパターン。内部の実装の詳細で、
// 利用者が使うためのものではない。
//
// ビットパターンは、デバッグしやすいように「ありえなさそうな値」から適当に選んだ。
// ただし kOnceInit は 0 でなければならない。そうすればゼロ初期化された
// once_flag をそのまま使える。
enum {
  kOnceInit = 0,
  kOnceRunning = 0x65C2937B,
  kOnceWaiter = 0x05A308D2,
  // kOnceDone にはとても小さな定数を選んだ。主要な命令セットの多くで、
  // 即値との比較 1 命令に収まるようにするためだ。これは
  // x86、POWER、ARM で確認済み。
  kOnceDone = 221,    // 乱数で選んだ値
};

template <typename Callable, typename... Args>
    void
    CallOnceImpl(std::atomic<uint32_t>* absl_nonnull control,
                 base_internal::SchedulingMode scheduling_mode, Callable&& fn,
                 Args&&... args) {
#ifndef NDEBUG
  {
    uint32_t old_control = control->load(std::memory_order_relaxed);
    if (old_control != kOnceInit &&
        old_control != kOnceRunning &&
        old_control != kOnceWaiter &&
        old_control != kOnceDone) {
      // メモリ破壊でこのエラーになることがある。
      ABSL_RAW_LOG(FATAL, "Unexpected value for control word: 0x%lx",
                   static_cast<unsigned long>(old_control));  // NOLINT（lint の警告を抑止）
    }
  }
#endif  // NDEBUG の分岐ここまで
  static const base_internal::SpinLockWaitTransition trans[] = {
      {kOnceInit, kOnceRunning, true},
      {kOnceRunning, kOnceWaiter, false},
      {kOnceDone, kOnceDone, true}};

  // 制御ワードの状態を変える可能性がある処理より前に、これを行うこと。
  base_internal::SchedulingHelper maybe_disable_scheduling(scheduling_mode);
  // いちばん単純なケースを近道して、関数呼び出しのオーバーヘッドを避ける。
  // base_internal::SpinLockWait() の戻り値は kOnceInit か
  // kOnceDone のどちらか。kOnceDone を返したなら、制御ワードを
  // std::memory_order_acquire で読み、kOnceDone を見たということだ。
  uint32_t old_control = kOnceInit;
  if (control->compare_exchange_strong(old_control, kOnceRunning,
                                       std::memory_order_relaxed) ||
      base_internal::SpinLockWait(control, static_cast<int>(std::size(trans)),
                                  trans, scheduling_mode) == kOnceInit) {
    std::invoke(std::forward<Callable>(fn), std::forward<Args>(args)...);
    old_control =
        control->exchange(base_internal::kOnceDone, std::memory_order_release);
    if (old_control == base_internal::kOnceWaiter) {
      base_internal::SpinLockWake(control, true);
    }
  }  // else の場合、*control はすでに kOnceDone
}
```

```cpp:line-numbers=135 [原文]
// Bit patterns for call_once state machine values.  Internal implementation
// detail, not for use by clients.
//
// The bit patterns are arbitrarily chosen from unlikely values, to aid in
// debugging.  However, kOnceInit must be 0, so that a zero-initialized
// once_flag will be valid for immediate use.
enum {
  kOnceInit = 0,
  kOnceRunning = 0x65C2937B,
  kOnceWaiter = 0x05A308D2,
  // A very small constant is chosen for kOnceDone so that it fit in a single
  // compare with immediate instruction for most common ISAs.  This is verified
  // for x86, POWER and ARM.
  kOnceDone = 221,    // Random Number
};

template <typename Callable, typename... Args>
    void
    CallOnceImpl(std::atomic<uint32_t>* absl_nonnull control,
                 base_internal::SchedulingMode scheduling_mode, Callable&& fn,
                 Args&&... args) {
#ifndef NDEBUG
  {
    uint32_t old_control = control->load(std::memory_order_relaxed);
    if (old_control != kOnceInit &&
        old_control != kOnceRunning &&
        old_control != kOnceWaiter &&
        old_control != kOnceDone) {
      // Memory corruption may cause this error.
      ABSL_RAW_LOG(FATAL, "Unexpected value for control word: 0x%lx",
                   static_cast<unsigned long>(old_control));  // NOLINT
    }
  }
#endif  // NDEBUG
  static const base_internal::SpinLockWaitTransition trans[] = {
      {kOnceInit, kOnceRunning, true},
      {kOnceRunning, kOnceWaiter, false},
      {kOnceDone, kOnceDone, true}};

  // Must do this before potentially modifying control word's state.
  base_internal::SchedulingHelper maybe_disable_scheduling(scheduling_mode);
  // Short circuit the simplest case to avoid procedure call overhead.
  // The base_internal::SpinLockWait() call returns either kOnceInit or
  // kOnceDone. If it returns kOnceDone, it must have loaded the control word
  // with std::memory_order_acquire and seen a value of kOnceDone.
  uint32_t old_control = kOnceInit;
  if (control->compare_exchange_strong(old_control, kOnceRunning,
                                       std::memory_order_relaxed) ||
      base_internal::SpinLockWait(control, static_cast<int>(std::size(trans)),
                                  trans, scheduling_mode) == kOnceInit) {
    std::invoke(std::forward<Callable>(fn), std::forward<Args>(args)...);
    old_control =
        control->exchange(base_internal::kOnceDone, std::memory_order_release);
    if (old_control == base_internal::kOnceWaiter) {
      base_internal::SpinLockWake(control, true);
    }
  }  // else *control is already kOnceDone
}
```

:::

## 前提知識

- **`std::atomic<uint32_t>`**: 複数のスレッドから同時に読み書きしても壊れない整数です。`load`（読む）、`exchange`（書いて古い値を返す）、`compare_exchange_strong`（後述）などの操作があります。
- **`compare_exchange_strong(expected, desired)`**: 「今の値が `expected` なら `desired` に書き換えて `true`、違えば `expected` に今の値を入れて `false`」を **不可分に**（途中で他のスレッドに割り込まれずに）行います。CAS とも呼ばれます。
- **メモリオーダー**: `memory_order_release` で書いた値を `memory_order_acquire` で読むと、書く前に行ったメモリ操作がすべて見えることが保証されます。`relaxed` はその保証がない、いちばん軽い指定です。
- **可変長テンプレート `typename... Args`**: 引数を何個でも受け取れるテンプレートです。`Args&&... args` と `std::forward<Args>(args)...` の組み合わせで、受け取った引数をそのままの形で次に渡せます（完全転送）。
- **`std::invoke(fn, args...)`**: 関数・関数オブジェクト・メンバ関数ポインタなど、呼び出せるものなら何でも同じ書き方で呼び出します。
- **RAII**: オブジェクトの寿命に処理を結び付ける書き方です。`maybe_disable_scheduling` に使われている `SchedulingHelper` は、モードによっては作られたときにスレッドの切り替え（再スケジューリング）を止め、スコープを抜けるときにデストラクタで元に戻します。

## 何をしているか

### 1. 状態の値

```cpp:line-numbers=141
enum {
  kOnceInit = 0,
  kOnceRunning = 0x65C2937B,
  kOnceWaiter = 0x05A308D2,
  // kOnceDone にはとても小さな定数を選んだ。主要な命令セットの多くで、
  // 即値との比較 1 命令に収まるようにするためだ。これは
  // x86、POWER、ARM で確認済み。
  kOnceDone = 221,    // 乱数で選んだ値
};
```

状態は 4 つあります。

- `kOnceInit = 0`: まだ誰も実行していない
- `kOnceRunning`: 誰かが実行中
- `kOnceWaiter`: 実行中で、しかも待っているスレッドがいる
- `kOnceDone = 221`: 実行済み

`kOnceInit` が 0 なのは、ゼロ初期化された `once_flag` をそのまま使えるようにするためです。

### 2. 壊れた値の検出

```cpp:line-numbers=156
#ifndef NDEBUG
  {
    uint32_t old_control = control->load(std::memory_order_relaxed);
    if (old_control != kOnceInit &&
        old_control != kOnceRunning &&
        old_control != kOnceWaiter &&
        old_control != kOnceDone) {
      // メモリ破壊でこのエラーになることがある。
      ABSL_RAW_LOG(FATAL, "Unexpected value for control word: 0x%lx",
                   static_cast<unsigned long>(old_control));  // NOLINT（lint の警告を抑止）
    }
  }
#endif  // NDEBUG の分岐ここまで
```

デバッグビルドでは、状態が 4 つのどれでもなければ「メモリ破壊の可能性あり」としてログを出して止めます。

### 3. 遷移表

```cpp:line-numbers=169
  static const base_internal::SpinLockWaitTransition trans[] = {
      {kOnceInit, kOnceRunning, true},
      {kOnceRunning, kOnceWaiter, false},
      {kOnceDone, kOnceDone, true}};
```

`{from, to, done}` の 3 つ組の表です。待ち関数 `SpinLockWait` は、今の値が `from` に一致する行を探し、CAS で `to` に書き換え、`done` が真なら終わります。

- `Init → Running`（done）: 自分が実行役になれた
- `Running → Waiter`（続行）: 「待っている人がいる」と印をつけて、さらに待つ
- `Done → Done`（done）: もう終わっていた

### 4. 実行役を決める

```cpp:line-numbers=180
  uint32_t old_control = kOnceInit;
  if (control->compare_exchange_strong(old_control, kOnceRunning,
                                       std::memory_order_relaxed) ||
      base_internal::SpinLockWait(control, static_cast<int>(std::size(trans)),
                                  trans, scheduling_mode) == kOnceInit) {
    std::invoke(std::forward<Callable>(fn), std::forward<Args>(args)...);
```

スレッド A と B が同時に来た場合で追います。

- A の CAS（`Init → Running`）が成功し、A が `fn` を実行します。
- B の CAS は失敗するので、`SpinLockWait` に入ります。状態が `Running` なので `Waiter` に書き換え、眠って待ちます。

### 5. 完了を知らせる

```cpp:line-numbers=186
    old_control =
        control->exchange(base_internal::kOnceDone, std::memory_order_release);
    if (old_control == base_internal::kOnceWaiter) {
      base_internal::SpinLockWake(control, true);
    }
```

A は `fn` を終えると、`exchange` で状態を `kOnceDone` にし、古い値を受け取ります。古い値が `kOnceWaiter` なら、待っている人がいるので `SpinLockWake` で起こします。
起きた B は状態 `Done` を見て、表の 3 番目の行で終了します。`fn` は 1 回しか実行されません。

## ここがすごい

- **待ち人がいないときは起こす処理を省く**: `Running` と `Waiter` を分けたおかげで、誰も待っていなければ `SpinLockWake`（システムコールになりうる重い処理）を呼ばずに済みます。
- **状態値を「ありえなさそうな数」にする**: `0x65C2937B` のような値は、メモリ破壊でたまたま作られにくい値です。破壊を検出しやすくする工夫です。
- **完了の値は小さく**: `kOnceDone = 221` は、多くの CPU で「即値と比較」の命令 1 つに収まる大きさです。2 回目以降の呼び出しは、`call_once`で `kOnceDone` と比べるだけで終わるので、この比較が最速であることが大事です。
- **最初の CAS で近道**: コメントにあるとおり、競合がなければ CAS 1 回で実行役が決まり、表を使う関数呼び出しを省けます。

## まとめ

- 「一度だけ実行」は、アトミック変数 1 つの状態機械で作れる。
- 待ち人の有無を状態に含めると、不要な起床処理を省ける。
- 状態遷移を表にすると、待ちのロジックを汎用の関数に任せられる。
- よく通る道（実行済みかの確認）は比較 1 回になるよう、値の選び方まで工夫する。
