---
title: 時計が逆戻りしても壊れない、期限付きのスピン待ち
description: 条件が真になるか期限が来るまで回り続ける spin_pause_until。結果を 3 通りに分けて返し、時計の巻き戻りにも備える。Baton などの待機処理の第 1 段階。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/detail/Spin.h
lines: [35, 76]
function: detail::spin_pause_until
difficulty: 2
tags: [並行処理, 日時, 防御的プログラミング, ジェネリクス]
---

## ひとことで

`spin_pause_until(deadline, opt, f)` は、関数 `f()` が `true` を返すまで、CPU のヒント命令 `pause` を挟みながら回り続ける関数です。
ただし、全体の期限 `deadline` を過ぎたら `timeout`、回ってよい時間 `opt.spin_max()` を使い切ったら `advance`（次の待ち方に進め）を返して抜けます。
Baton やセマフォの「まず少し回ってみて、だめなら眠る」の **回る** 部分を担当しています。

## コード

::: code-group

```cpp:line-numbers=35 [日本語訳]
template <typename Clock, typename Duration, typename F>
spin_result spin_pause_until(
    std::chrono::time_point<Clock, Duration> const& deadline,
    WaitOptions const& opt,
    F f) {
  if (opt.spin_max() <= opt.spin_max().zero()) {
    return spin_result::advance;
  }

  if (f()) {
    return spin_result::success;
  }

  constexpr auto min = std::chrono::time_point<Clock, Duration>::min();
  if (deadline == min) {
    return spin_result::timeout;
  }

  auto tbegin = Clock::now();
  while (true) {
    if (f()) {
      return spin_result::success;
    }

    auto const tnow = Clock::now();
    if (tnow >= deadline) {
      return spin_result::timeout;
    }

    //  Clock の時刻が後ろに飛んだ？ ブロック前の開始時点を修正する
    tbegin = std::min(tbegin, tnow);
    if (tnow >= tbegin + opt.spin_max()) {
      return spin_result::advance;
    }

    //  pause 命令は行儀のよいスピンの方法だが、使えない場合に省いても
    //  正しさには実際には影響しない。pause すると、現在のコアの全能力を
    //  同じコアの他のハイパースレッドに
    //  十数サイクルほど譲る。
    asm_volatile_pause();
  }
}
```

```cpp:line-numbers=35 [原文]
template <typename Clock, typename Duration, typename F>
spin_result spin_pause_until(
    std::chrono::time_point<Clock, Duration> const& deadline,
    WaitOptions const& opt,
    F f) {
  if (opt.spin_max() <= opt.spin_max().zero()) {
    return spin_result::advance;
  }

  if (f()) {
    return spin_result::success;
  }

  constexpr auto min = std::chrono::time_point<Clock, Duration>::min();
  if (deadline == min) {
    return spin_result::timeout;
  }

  auto tbegin = Clock::now();
  while (true) {
    if (f()) {
      return spin_result::success;
    }

    auto const tnow = Clock::now();
    if (tnow >= deadline) {
      return spin_result::timeout;
    }

    //  Backward time discontinuity in Clock? revise pre_block starting point
    tbegin = std::min(tbegin, tnow);
    if (tnow >= tbegin + opt.spin_max()) {
      return spin_result::advance;
    }

    //  The pause instruction is the polite way to spin, but it doesn't
    //  actually affect correctness to omit it if we don't have it. Pausing
    //  donates the full capabilities of the current core to its other
    //  hyperthreads for a dozen cycles or so.
    asm_volatile_pause();
  }
}
```

:::

戻り値の型は同じファイルの少し上で定義されています。

```cpp:line-numbers=29
enum class spin_result {
  success, // condition passed
  timeout, // exceeded deadline
  advance, // exceeded current wait-options component timeout
};
```

## 前提知識

- **テンプレート引数 `Clock, Duration, F`**: 時計の種類、時間の単位、条件を調べる関数の型を、呼び出し側に合わせて自動で決めます。`F` には `[this] { return ready(); }` のようなラムダ式（その場で書く無名関数）が入ります。
- **`std::chrono::time_point<Clock, Duration>`**: ある時計で測った「時刻」を表す型です。`Clock::now()` で今の時刻が取れます。時刻同士の比較や、時刻に時間を足す計算ができます。
- **`time_point::min()`**: その型で表せる最も古い時刻です。ここでは「待たずに 1 回だけ調べる」の印として使われています。
- **`opt.spin_max()`**: `WaitOptions` が持つ「回ってよい最大時間」です。`.zero()` は長さ 0 の時間です。
- **`const&`**: 引数を「コピーせず、書き換えもしない」形で受け取る書き方です。
- **`std::min`**: 2 つのうち小さいほうを返します。
- **`asm_volatile_pause()`**: x86 の `pause` 命令などを出す Folly の関数です。

## 何をしているか

### 1. そもそも回らない設定なら即座に次へ

```cpp:line-numbers=40
  if (opt.spin_max() <= opt.spin_max().zero()) {
    return spin_result::advance;
  }
```

`spin_max` が 0 以下なら、回る段階を飛ばしたいという指定です。条件も調べずに `advance` を返します。

### 2. まず 1 回だけ調べる

```cpp:line-numbers=44
  if (f()) {
    return spin_result::success;
  }

  constexpr auto min = std::chrono::time_point<Clock, Duration>::min();
  if (deadline == min) {
    return spin_result::timeout;
  }
```

`f()` がすでに真なら `success` です。
期限が `min()`（最も古い時刻）なら、それは「1 回調べてだめなら諦める」という意味なので `timeout` を返します。
ここで `Clock::now()` を呼ばずに済ませているのがポイントです。

### 3. 本番のループ

```cpp:line-numbers=53
  auto tbegin = Clock::now();
  while (true) {
    if (f()) {
      return spin_result::success;
    }

    auto const tnow = Clock::now();
    if (tnow >= deadline) {
      return spin_result::timeout;
    }

    //  Clock の時刻が後ろに飛んだ？ ブロック前の開始時点を修正する
    tbegin = std::min(tbegin, tnow);
    if (tnow >= tbegin + opt.spin_max()) {
      return spin_result::advance;
    }

    //  pause 命令は行儀のよいスピンの方法だが、使えない場合に省いても
    //  正しさには実際には影響しない。pause すると、現在のコアの全能力を
    //  同じコアの他のハイパースレッドに
    //  十数サイクルほど譲る。
    asm_volatile_pause();
  }
```

`spin_max` が 2 マイクロ秒、期限は十分先だとします。

1. ループに入る前に開始時刻 `tbegin` を記録します。
2. ループの先頭で `f()` を調べ、真なら `success` です。
3. 今の時刻 `tnow` を取り、期限を過ぎていれば `timeout` です。
4. 開始から 2 マイクロ秒経っていれば `advance` です。
5. どれでもなければ `pause` を 1 回出して先頭へ戻ります。

### 4. 時計の巻き戻りに備える

```cpp:line-numbers=64
    //  Clock の時刻が後ろに飛んだ？ ブロック前の開始時点を修正する
    tbegin = std::min(tbegin, tnow);
```

`tbegin = std::min(tbegin, tnow);` は、時計が過去に戻った場合への備えです。
たとえば `tbegin` が 100、次に読んだ時刻が 90 だったとします。
このままだと「100 + 2 を超えるまで」待つことになり、本来より長く回ってしまいます。
`tbegin` を 90 に下げれば、そこから 2 だけ回って抜けられます。

## ここがすごい

- **3 値で返す**: `true/false` ではなく `success / timeout / advance` の 3 つにしたことで、呼び出し側は「成功」「全体の期限切れ」「回る段階の終わり（次は眠る）」をはっきり区別できます。Baton の `tryWaitSlow` は `switch` でこの 3 つを受け、`advance` のときだけ futex で眠る段階に進みます。
- **時刻を読む回数を減らす**: 最初の判定では時計を読みません。すぐに条件が満たされる多くの場合に、時刻取得の費用を払わずに済みます。
- **任意の時計で動く**: テンプレートなので、`steady_clock` でもテスト用の偽の時計でも同じコードで動きます。
- **巻き戻りへの 1 行の防御**: どの時計でも単調に進むとは限らないという前提で、最小限のコストで対処しています。
- **pause の意味をコメントで説明**: 「正しさには影響しないが、同じコアの別ハイパースレッドに資源を譲る」と理由が書かれています。

## まとめ

- 待機処理は「回る」「眠る」の段階に分け、段階の終わりを結果として返すと組み立てやすい。
- 期限付きのループでは、時刻を読む前にまず条件を 1 回調べるとよい。
- 時計が逆戻りする可能性があるなら、基準時刻を `min` で更新して対処できる。
- テンプレートで時計の型を受け取ると、テストや別の時計への差し替えが容易になる。

