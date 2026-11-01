---
title: "「最初の 1 回だけ真」を 1 語で書く ONCE マクロ"
description: "if (ONCE) と書くだけで、その場所を初めて通ったときだけ真になる。呼び出し箇所ごとに隠れた static 変数を作り、アトミック交換で 1 回きりを保証する。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/fundamental/macro.h
lines: [165, 174]
function: "ONCE"
difficulty: 2
format: 2
tags: [マクロ, 並行処理, イディオム, ロック不要]
---

## ひとことで

`ONCE` は、**その場所を初めて通ったときだけ真** になり、2 回目以降は偽になる式です。
`if (ONCE) log_warning("この設定は非推奨です");` と書けば、警告は何度呼ばれても 1 回だけ出ます。
フラグ用の変数を自分で宣言する必要はありません。マクロが呼び出し箇所ごとに、見えない変数を用意してくれます。

## コード

::: code-group

```c:line-numbers=165 [日本語訳]
/* このマクロは、コードブロックが初めて呼ばれたときに真になり、2 回目以降は偽になる。
 * pthread_once() とは動作が違うことに注意: このマクロはコードの実行を同期しない。つまり、
 * このマクロを条件にして実行されるコードは、同じように条件付けされた他のすべてのコードと並行に走りうる。
 * 順序や完了は何も保証されない。 */
#define ONCE __ONCE(UNIQ_T(_once_, UNIQ))
#define __ONCE(o)                                                       \
        ({                                                              \
                static bool (o) = false;                                \
                !__atomic_exchange_n(&(o), true, __ATOMIC_SEQ_CST);     \
        })
```

```c:line-numbers=165 [原文]
/* The macro is true when the code block is called first time, and is false for the second and later times.
 * Note that this works differently from pthread_once(): this macro does not synchronize code execution, i.e.
 * code that is run conditionalized on this macro will run concurrently to all other code conditionalized the
 * same way, there's no ordering or completion enforced. */
#define ONCE __ONCE(UNIQ_T(_once_, UNIQ))
#define __ONCE(o)                                                       \
        ({                                                              \
                static bool (o) = false;                                \
                !__atomic_exchange_n(&(o), true, __ATOMIC_SEQ_CST);     \
        })
```

:::

## 前提知識

- **関数内の `static` 変数**: 関数の中で `static bool done = false;` と宣言すると、その変数はプログラムが終わるまで値を保ちます。関数を何度呼んでも、初期化は最初の 1 回だけです。
- **`({ ... })`（文式）**: GCC 拡張で、中の文を実行し、最後の式の値を全体の値にします。中で変数を宣言できます。
- **`UNIQ_T(_once_, UNIQ)`**: systemd のマクロで、`__COUNTER__`（使うたびに 0, 1, 2… と増える数）を使って、呼び出しごとに違う変数名（`__unique_prefix__once_7` のような名前）を作ります。
- **アトミック操作**: 複数のスレッド（同時に動く処理の流れ）が同じ変数を触っても、途中の状態を見られずに一気に行われる操作です。
- **`__atomic_exchange_n(&o, v, order)`**: GCC の組み込み関数で、変数 `o` に `v` を書き込み、**書き込む前の値** を返す操作をアトミックに行います。`__ATOMIC_SEQ_CST` は最も強い順序保証の指定です。

## 何をしているか

### 1. 呼び出しごとに専用の変数を作る

```c:line-numbers=169
#define ONCE __ONCE(UNIQ_T(_once_, UNIQ))
```

`ONCE` は `__ONCE(UNIQ_T(_once_, UNIQ))` に展開されます。`UNIQ` は使われるたびに違う数になるので、ソースコード上の `ONCE` 1 つにつき 1 つ、別の名前の変数が作られます。
同じ関数の中に `ONCE` が 2 か所あっても、それぞれ独立に「初回」を判定できます。

### 2. static 変数で状態を覚える

```c:line-numbers=170
#define __ONCE(o)                                                       \
        ({                                                              \
                static bool (o) = false;                                \
```

文式の中で `static bool (o) = false;` を宣言します。`static` なので、この行を何度通っても初期化は最初の 1 回だけで、値はずっと保たれます。

### 3. 交換して前の値を見る

```c:line-numbers=173
                !__atomic_exchange_n(&(o), true, __ATOMIC_SEQ_CST);     \
        })
```

`__atomic_exchange_n(&(o), true, ...)` で、変数に `true` を書き込みつつ、書き込む前の値を受け取ります。

- 1 回目: 前の値は `false`。`!false` で式全体は **真**。
- 2 回目以降: 前の値は `true`（1 回目に書いたもの）。`!true` で **偽**。

### 使い方の例

```c
for (int i = 0; i < 1000; i++)
        if (ONCE)
                log_debug("ループに入りました");   /* 1 回だけ出る */
```

## ここがすごい

- **フラグ変数を書かなくてよい**: 素直に書くと、`static bool warned = false; if (!warned) { warned = true; ... }` と 3 行と変数名が必要です。`ONCE` はそれを 1 語にまとめ、名前を考える手間も、名前の衝突も無くしています。
- **スレッドに対して安全な「1 回」**: 「読んでから書く」を 2 つの操作で行うと、2 つのスレッドが同時に `false` を読み、両方が初回だと思い込むことがあります。アトミックな交換なら、`false` を受け取れるのは必ず 1 つのスレッドだけです。
- **用途の限定をコメントで明示**: マクロの直前のコメントは、これが `pthread_once()` とは違うと注意しています。`ONCE` は「誰が最初か」を決めるだけで、他のスレッドが初回の処理の **完了を待つ** ことはしません。初期化の完了を保証したい用途には向かない、とはっきり書かれているのは親切です。
- **コストが小さい**: 毎回の判定はアトミック交換 1 回だけで、ロック（排他制御の仕組み）を取る必要がありません。

## まとめ

- `ONCE` は、その場所を初めて通ったときだけ真になる式。
- 関数内の `static` 変数は、何度呼ばれても値を保ち続ける。
- `__atomic_exchange_n` で「書き込みつつ前の値を得る」と、複数スレッドでも初回を 1 つに決められる。
- 初回処理の完了を他のスレッドが待つ仕組みではないので、用途を見極めて使う。
