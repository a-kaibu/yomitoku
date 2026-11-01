---
title: 遷移表を渡すだけで待ち方が決まる汎用の待機ループ
description: アトミック変数の値が特定の状態になるまで待ち、CAS で次の状態へ移す汎用関数。どの状態からどこへ移るか、どこで終わるかを表として受け取る。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/base/internal/spinlock_wait.cc
lines: [40, 59]
function: base_internal::SpinLockWait
difficulty: 3
tags: [並行処理, 状態機械, 設計パターン]
---

## ひとことで

`SpinLockWait` は、アトミックな 32 ビット変数を見張り、**表で指定された状態遷移のどれかができるまで待つ** 関数です。
「今の値が A なら B に書き換えて終了」「C なら D に書き換えて待ち続ける」といったルールを、`{from, to, done}` の配列として渡します。

`absl::call_once` などの同期部品が、自分専用の待ちループを書かずに済むように作られた共通エンジンです。

## コード

::: code-group

```cpp:line-numbers=40 [日本語訳]
// 仕様は spinlock_wait.h を参照。
uint32_t SpinLockWait(std::atomic<uint32_t> *w, int n,
                      const SpinLockWaitTransition trans[],
                      base_internal::SchedulingMode scheduling_mode) {
  int loop = 0;
  for (;;) {
    uint32_t v = w->load(std::memory_order_acquire);
    int i;
    for (i = 0; i != n && v != trans[i].from; i++) {
    }
    if (i == n) {
      SpinLockDelay(w, v, ++loop, scheduling_mode);  // 合う遷移がない
    } else if (trans[i].to == v ||                   // 空の遷移
               w->compare_exchange_strong(v, trans[i].to,
                                          std::memory_order_acquire,
                                          std::memory_order_relaxed)) {
      if (trans[i].done) return v;
    }
  }
}
```

```cpp:line-numbers=40 [原文]
// See spinlock_wait.h for spec.
uint32_t SpinLockWait(std::atomic<uint32_t> *w, int n,
                      const SpinLockWaitTransition trans[],
                      base_internal::SchedulingMode scheduling_mode) {
  int loop = 0;
  for (;;) {
    uint32_t v = w->load(std::memory_order_acquire);
    int i;
    for (i = 0; i != n && v != trans[i].from; i++) {
    }
    if (i == n) {
      SpinLockDelay(w, v, ++loop, scheduling_mode);  // no matching transition
    } else if (trans[i].to == v ||                   // null transition
               w->compare_exchange_strong(v, trans[i].to,
                                          std::memory_order_acquire,
                                          std::memory_order_relaxed)) {
      if (trans[i].done) return v;
    }
  }
}
```

:::

## 前提知識

- **`std::atomic<uint32_t> *w`**: 複数スレッドで共有するアトミック整数へのポインタです。`w->load(...)` で値を読みます。
- **`compare_exchange_strong(expected, desired, 成功時の順序, 失敗時の順序)`**: 値が `expected` と等しければ `desired` に書き換えて `true` を返す、不可分な操作（CAS）です。失敗すると `expected` に現在の値が入ります。
- **`memory_order_acquire`**: この読み込みの後のメモリ操作が、読み込みより前に動かされないことを保証します。ほかのスレッドが `release` で書いた内容を確実に見るために使います。
- **`const SpinLockWaitTransition trans[]`**: 構造体の配列を受け取る引数です。構造体は `from`（元の値）、`to`（移す先の値）、`done`（これで終わるか）の 3 つを持ちます（`spinlock_wait.h` で定義）。
- **`for (;;)`**: 条件のない無限ループです。中の `return` でだけ抜けます。
- **`SpinLockDelay`**: 環境ごとに実装される「少し待つ」関数です。何もしない、CPU を譲る、`SpinLockWake` で起こされるまで眠る、のどれかをします。

## 何をしているか

### 1. 今の値に合う行を探す

```cpp:line-numbers=46
    uint32_t v = w->load(std::memory_order_acquire);
    int i;
    for (i = 0; i != n && v != trans[i].from; i++) {
    }
```

`v` に現在の値を読み、表の中から `from == v` の行を線形に探します。内側の `for` は本体が空で、条件だけで `i` を進めています。

### 2. 合う行がなければ待つ

```cpp:line-numbers=50
    if (i == n) {
      SpinLockDelay(w, v, ++loop, scheduling_mode);  // 合う遷移がない
```

`i == n` なら、今の状態からはどの遷移もできません。`SpinLockDelay` で少し待ってからやり直します。`++loop` で待った回数を数え、回数が増えるほど長く待てるようにしています。

### 3. 合う行があれば遷移する

```cpp:line-numbers=52
    } else if (trans[i].to == v ||                   // 空の遷移
               w->compare_exchange_strong(v, trans[i].to,
                                          std::memory_order_acquire,
                                          std::memory_order_relaxed)) {
      if (trans[i].done) return v;
    }
```

- `to == v` なら、値を変える必要がない「空の遷移」です。CAS をせずに成功扱いにします。
- そうでなければ CAS で `v` から `to` に書き換えます。間に他のスレッドが値を変えていたら CAS は失敗し、ループの先頭から読み直します。
- 遷移に成功し、その行の `done` が真なら、遷移前の値 `v` を返して終わります。`done` が偽なら、遷移はしたうえで待ち続けます。

### 4. call_once の表で追う

`call_once` は次の表を渡します。

| from | to | done |
| --- | --- | --- |
| Init | Running | true |
| Running | Waiter | false |
| Done | Done | true |

ほかのスレッドが実行中（`Running`）のときに呼ぶと、こう進みます。

1. `v = Running`。表の 2 番目の行に合うので、CAS で `Waiter` にします。`done` が偽なので続けます。
2. `v = Waiter`。どの行にも合わないので `SpinLockDelay` で眠ります。
3. 実行役が終わって `Done` にし、起こしてくれます。
4. `v = Done`。表の 3 番目の行は `to == v` の空の遷移なので、そのまま `Done` を返します。

## ここがすごい

- **データで振る舞いを決める**: 待ちのロジックを if 文で毎回書く代わりに、遷移表という「データ」で表しています。新しい同期部品を作るときは、表を書くだけで正しい待ちループが手に入ります。
- **「印を付けて待ち続ける」が書ける**: `done = false` の行があることで、「待っている人がいる」という情報を状態に残しつつ待てます。これで、起こす側は待ち人がいるときだけ起床処理をすればよくなります。
- **空の遷移で CAS を省く**: `Done → Done` のように値が変わらない遷移では、CAS（キャッシュラインを書き込み用に取る重い操作）を呼びません。読み込みだけで済ませています。
- **環境依存部分を分離**: 眠り方は OS ごとに違います（Linux なら futex など）。その部分を `SpinLockDelay` に追い出し、この関数自体はどの OS でも同じコードで動きます。

## まとめ

- 状態遷移は `{from, to, done}` の表で表すと、汎用の関数で処理できる。
- 「遷移はするが終わらない」行を用意すると、待ち人の印などを状態に残せる。
- 値が変わらない遷移では CAS を省き、読むだけにする。
- OS に依存する「眠り方」は別の関数に分け、共通ロジックと切り離す。
