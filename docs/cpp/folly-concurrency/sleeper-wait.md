---
title: 「回る」から「眠る」へ切り替える待ち方の作法
description: スピンロックの待ち時間を担当する Sleeper::wait。最初は CPU のヒント命令で軽く回り、長引いたら 0.5 ミリ秒ずつ眠る。ARM では待ち回数を倍々に増やす。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/detail/Sleeper.h
lines: [53, 71]
function: Sleeper::wait
difficulty: 2
tags: [並行処理, 最適化, 移植性, 低レイヤ]
---

## ひとことで

`Sleeper::wait()` は、ロックが空くのを待つ間に 1 回ずつ呼ばれる「待ち方」の関数です。
最初のうちは CPU に「今は待っています」と伝える `pause` 命令を挟みながら回り（スピン）、回数が増えたら OS に頼んで少し眠ります。
`MicroSpinLock` や `PicoSpinLock` の `lock()` がこれを使っています。

## コード

::: code-group

```cpp:line-numbers=53 [日本語訳]
  void wait() noexcept {
    bool doSpin = useBackOff
        ? spinCountTarget <= kMaxActiveSpin
        : spinCount < kMaxActiveSpin;
    if (doSpin) {
      if constexpr (useBackOff) {
        do {
          asm_volatile_pause();
        } while (++spinCount < spinCountTarget);
        spinCountTarget <<= 1;
      } else {
        ++spinCount;
        asm_volatile_pause();
      }
    } else {
      /* sleep override（意図的な sleep の目印） */
      std::this_thread::sleep_for(delta);
    }
  }
```

```cpp:line-numbers=53 [原文]
  void wait() noexcept {
    bool doSpin = useBackOff
        ? spinCountTarget <= kMaxActiveSpin
        : spinCount < kMaxActiveSpin;
    if (doSpin) {
      if constexpr (useBackOff) {
        do {
          asm_volatile_pause();
        } while (++spinCount < spinCountTarget);
        spinCountTarget <<= 1;
      } else {
        ++spinCount;
        asm_volatile_pause();
      }
    } else {
      /* sleep override */
      std::this_thread::sleep_for(delta);
    }
  }
```

:::

関数の外で定義されている値は次のとおりです。

```cpp:line-numbers=36
  const std::chrono::nanoseconds delta;

  static constexpr uint32_t kMaxActiveSpin = 4096;
  static constexpr bool useBackOff = kIsArchAArch64 && !kIsMobile;

  uint32_t spinCount = 0;

  uint32_t spinCountTarget = 1;

 public:
  static constexpr std::chrono::nanoseconds kMinYieldingSleep =
      std::chrono::microseconds(500);

  constexpr Sleeper() noexcept : delta(kMinYieldingSleep) {}
```

## 前提知識

- **メンバ変数**: `spinCount` などはオブジェクトが持つ変数で、`wait()` を呼ぶたびに値が引き継がれます。`Sleeper` は `lock()` の中でローカル変数として作られるので、1 回のロック取得ごとにカウントが 0 から始まります。
- **`static constexpr`**: クラス全体で共有される、コンパイル時に決まる定数です。
- **`if constexpr`**: 条件をコンパイル時に評価し、偽の側のコードは **そもそもコンパイルしない** if 文です。CPU の種類ごとに別のコードを作るのに使えます。
- **`?:`（三項演算子）**: `条件 ? A : B` は条件が真なら A、偽なら B になる式です。
- **`<<=`**: 左シフトして代入します。`x <<= 1` は `x` を 2 倍にするのと同じです。
- **`std::chrono`**: 時間を型付きで扱う標準ライブラリです。`microseconds(500)` は 500 マイクロ秒を表します。
- **`std::this_thread::sleep_for(d)`**: 今のスレッドを `d` の間止めます。
- **`asm_volatile_pause()`**: Folly が用意した関数で、x86 なら `pause`、ARM なら `yield` などのヒント命令を出します。「スピン中なので少し休んでよい」と CPU に伝え、電力消費や同じコアの別スレッドへの影響を減らします。

## 何をしているか

### 1. 回るか眠るかを決める

```cpp:line-numbers=54
    bool doSpin = useBackOff
        ? spinCountTarget <= kMaxActiveSpin
        : spinCount < kMaxActiveSpin;
```

`useBackOff` が偽（x86 など）のときは、`spinCount < 4096` の間はスピンします。
真（モバイル以外の ARM64）のときは、`spinCountTarget <= 4096` の間スピンします。

### 2. x86 など：1 回呼ばれたら pause 1 回

```cpp:line-numbers=63
      } else {
        ++spinCount;
        asm_volatile_pause();
      }
```

`spinCount` を 1 増やして `pause` を 1 回出すだけです。
`lock()` のループから 4096 回呼ばれるまでは、この軽い待ち方を続けます。

### 3. ARM64：待つ回数を倍々に増やす

```cpp:line-numbers=58
      if constexpr (useBackOff) {
        do {
          asm_volatile_pause();
        } while (++spinCount < spinCountTarget);
        spinCountTarget <<= 1;
```

`spinCountTarget` は 1 から始まり、呼ばれるたびに 2 倍になります。
`do-while` は「`spinCount` が `spinCountTarget` に届くまで `pause` を繰り返す」ループです。
`spinCount` は累計なので、実際に追うと次のようになります。

| 呼び出し | 開始時 spinCount | target | この回の pause 数 |
| --- | --- | --- | --- |
| 1 回目 | 0 | 1 | 1 |
| 2 回目 | 1 | 2 | 1 |
| 3 回目 | 2 | 4 | 2 |
| 4 回目 | 4 | 8 | 4 |

1 回の待ちがだんだん長くなる、いわゆる指数バックオフです。
`target` が 4096 を超えると（13 回目の呼び出しの後）、スピンをやめます。

### 4. それでも空かなければ眠る

```cpp:line-numbers=67
    } else {
      /* sleep override（意図的な sleep の目印） */
      std::this_thread::sleep_for(delta);
    }
```

`sleep_for(delta)` で `delta` の間眠ります。既定値は 500 マイクロ秒です。
`/* sleep override */` は、Folly 内で「ここで sleep を使うのは意図的」と示す目印のコメントです。

## ここがすごい

- **2 段構えの待ち方**: ロックはたいていすぐ空くので、最初は眠らずに回るのが速いです。眠ると OS を呼ぶ費用がかかり、起きるのも遅れるからです。一方で長く待つなら CPU を手放すべきです。この関数は回数で両者を切り替えます。
- **CPU ごとに最適な戦略**: `if constexpr` により、x86 版のバイナリには ARM 用のループが一切含まれません。実行時の分岐コストもありません。
- **指数バックオフで競合を散らす**: 多数のスレッドが同時に再挑戦すると、また同時に衝突します。待ち時間を倍々に伸ばすと再挑戦のタイミングがばらけ、衝突が減ります。
- **呼び出し側を単純にする**: `lock()` は `while (取れない) sleeper.wait();` と書くだけで済みます。待ち方の工夫はすべて `Sleeper` の中に閉じ込められています。

## まとめ

- 短い待ちはスピン、長い待ちはスリープ、という切り替えが待機処理の基本。
- スピン中は `pause` などのヒント命令を挟むのが行儀のよい回り方。
- `if constexpr` を使うと、CPU やプラットフォームごとに無駄のないコードを生成できる。
- 待ち方を小さなクラスに切り出すと、複数のロックで同じ戦略を使い回せる。

