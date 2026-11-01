---
title: "引数を二度評価しない MAX マクロと「使い捨ての変数名」"
description: "素朴な MAX(a,b) マクロは引数を二度実行してしまう。typeof と文式で一度だけ評価し、__COUNTER__ で衝突しない変数名を作る systemd の書き方。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/fundamental/macro.h
lines: [180, 187]
function: "MAX"
difficulty: 3
format: 2
tags: [マクロ, メタプログラミング, 型システム, 防御的プログラミング]
---

## ひとことで

`MAX(a, b)` は 2 つの値の大きい方を返すマクロです。`MAX(3, 7)` は `7` です。
C の教科書によくある `#define MAX(a,b) ((a) > (b) ? (a) : (b))` には「引数が二度実行される」という罠があります。
systemd の `MAX` は、引数を **ちょうど一度だけ** 評価し、さらにマクロを入れ子にしても変数名がぶつからないよう工夫されています。

## コード

```c:line-numbers=180
#undef MAX
#define MAX(a, b) __MAX(UNIQ, a, UNIQ, b)
#define __MAX(aq, a, bq, b)                             \
        ({                                              \
                const typeof(a) UNIQ_T(A, aq) = (a);    \
                const typeof(b) UNIQ_T(B, bq) = (b);    \
                UNIQ_T(A, aq) > UNIQ_T(B, bq) ? UNIQ_T(A, aq) : UNIQ_T(B, bq); \
        })
```

`UNIQ_T` と `UNIQ` は同じファイルで次のように定義されています。

```c:line-numbers=157
#define XCONCATENATE(x, y) x ## y
#define CONCATENATE(x, y) XCONCATENATE(x, y)

#define assert_cc(expr) _Static_assert(expr, #expr)

#define UNIQ_T(x, uniq) CONCATENATE(__unique_prefix_, CONCATENATE(x, uniq))
#define UNIQ __COUNTER__
```

## 前提知識

- **マクロは文字の置き換え**: `#define` は関数ではなく、コンパイル前のテキスト置換です。`MAX(i++, j)` と書くと、`i++` という文字列がそのまま埋め込まれます。
- **`#undef`**: 既にある定義を取り消します。システムのヘッダが別の `MAX` を定義していても、ここで上書きできるようにしています。
- **`typeof(a)`**: GCC/Clang の拡張で、式 `a` の型を取り出します。`int` なら `int`、`double` なら `double` です。
- **`({ ... })`（文式）**: GCC 拡張で、中の文を実行し、最後の式の値を全体の値にします。マクロの中で一時変数を宣言できます。
- **`##` と `__COUNTER__`**: `##` は 2 つの字句をつないで 1 つの名前にします。`__COUNTER__` は GCC/Clang の機能で、使うたびに 0, 1, 2, ... と増える整数に置き換わります。
- **二段階のマクロ**: `##` は引数を展開する前に連結してしまうので、`__COUNTER__` を数値にしてから連結したいときは `CONCATENATE` → `XCONCATENATE` と一段挟みます。

## 何をしているか

### 1. 素朴な MAX の問題

`#define MAX(a,b) ((a) > (b) ? (a) : (b))` で `MAX(i++, 0)` と書くと、展開結果は `((i++) > (0) ? (i++) : (0))` です。
`i = 5` から始めると、比較で 1 回、結果で 1 回、`i` が 2 回増えて `7` になり、返る値は `6` です。期待した「5 を返して 6 になる」とは違います。

### 2. 一度だけ評価する

```c:line-numbers=182
#define __MAX(aq, a, bq, b)                             \
        ({                                              \
                const typeof(a) UNIQ_T(A, aq) = (a);    \
                const typeof(b) UNIQ_T(B, bq) = (b);    \
                UNIQ_T(A, aq) > UNIQ_T(B, bq) ? UNIQ_T(A, aq) : UNIQ_T(B, bq); \
        })
```

`__MAX` は文式の中で、まず `a` と `b` をそれぞれ一時変数にコピーします。
型は `typeof(a)` で元の式と同じにし、`const` で書き換え禁止にしています。
最後の行で、一時変数どうしを比べて大きい方を値にします。これで `a` も `b` も 1 回ずつしか実行されません。

### 3. 衝突しない名前を作る

```c:line-numbers=180
#undef MAX
#define MAX(a, b) __MAX(UNIQ, a, UNIQ, b)
```

一時変数の名前を単に `_a` にすると、`MAX(_a, 3)` と呼ばれたとき `const int _a = (_a);` となり、自分自身で初期化する壊れたコードになります。
入れ子の `MAX(MAX(x, y), z)` でも、内側と外側で同じ名前が重なります。

そこで `MAX` は `__MAX(UNIQ, a, UNIQ, b)` と、`UNIQ`（＝ `__COUNTER__`）を 2 つ渡します。
`UNIQ` は使うたびに違う数になるので、たとえば 12 と 13 になれば、変数名は `__unique_prefix_A12` と `__unique_prefix_B13` のようになります。
呼び出しごとに別の名前になるため、どんな式を渡しても衝突しません。`#undef MAX` は、システムのヘッダが先に定義した `MAX` を取り消してから自前のものに置き換えるためです。

## ここがすごい

- **副作用に強い**: `MAX(read_value(), limit)` のように関数呼び出しを渡しても、関数は一度しか呼ばれません。関数のように「安心して使える」マクロになっています。
- **型を失わない**: 関数で `max` を書くと `int` 用、`double` 用、`uint64_t` 用…と型ごとに必要ですが、`typeof` のおかげで 1 つのマクロでどの型にも対応します。
- **名前の衝突を機械的に回避**: `__COUNTER__` を使った `UNIQ_T` は systemd 全体で使われる部品で、`MIN`、`CLAMP`、`DIV_ROUND_UP` なども同じ方法で一時変数を作っています。
- **トレードオフ**: 文式の結果は定数式ではないので、配列の大きさ（`char buf[MAX(4, 8)];` など）には使えません。そのため systemd には、定数専用の `CONST_MAX` が別に用意されています。

## まとめ

- 素朴な `MAX` マクロは引数を二度評価し、`i++` などで予想外の結果になる。
- `typeof` と文式で一時変数にコピーすれば、引数は一度しか評価されない。
- `__COUNTER__` で毎回違う変数名を作ると、入れ子や同名の引数でも衝突しない。
- `##` で数値を連結するには、マクロを二段にして先に展開させる。
