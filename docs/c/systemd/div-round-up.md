---
title: "「切り上げ割り算」をオーバーフローさせない DIV_ROUND_UP"
description: "定番の (x + y - 1) / y は x が大きいと桁あふれする。x / y + !!(x % y) に書き換え、さらに倍数への切り上げ ROUND_UP では掛け算のあふれも検出する。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/fundamental/macro.h
lines: [352, 372]
function: "DIV_ROUND_UP / ROUND_UP"
difficulty: 2
format: 2
tags: [数値計算, マクロ, 防御的プログラミング, ビット演算]
---

## ひとことで

`DIV_ROUND_UP(x, y)` は、割り算の結果を **切り上げ** るマクロです。`DIV_ROUND_UP(10, 4)` は 2.5 を切り上げて `3` になります。
`ROUND_UP(x, y)` は `x` を「`y` の倍数」に切り上げます。`ROUND_UP(10, 4)` は `12` です。
どちらも、計算途中で整数が **桁あふれ（オーバーフロー）** しないよう注意深く書かれています。

## コード

::: code-group

```c:line-numbers=352 [日本語訳]
/* [(x + y - 1) / y] は、計算自体はその型で可能なはずなのに整数オーバーフローを
 * 起こす。そこで [x / y + !!(x % y)] を使う。「本物の CPU」では割り算で
 * 商と余りが両方得られるので、どちらも同じくらい速いはずである。 */
 * quotient and the remainder, so both should be equally fast. */
#define DIV_ROUND_UP(x, y) __DIV_ROUND_UP(UNIQ, x, UNIQ, y)
#define __DIV_ROUND_UP(xq, x, yq, y)                                    \
        ({                                                              \
                const typeof(x) UNIQ_T(X, xq) = (x);                    \
                const typeof(y) UNIQ_T(Y, yq) = (y);                    \
                (UNIQ_T(X, xq) / UNIQ_T(Y, yq) + !!(UNIQ_T(X, xq) % UNIQ_T(Y, yq))); \
        })

/* x を y の次の倍数に切り上げる。オーバーフローした場合は typeof(x) の -1 になる */
#define __ROUND_UP(q, x, y)                                             \
        ({                                                              \
                const typeof(y) UNIQ_T(A, q) = (y);                     \
                const typeof(x) UNIQ_T(B, q) = DIV_ROUND_UP(x, UNIQ_T(A, q)); \
                typeof(x) UNIQ_T(C, q);                                 \
                MUL_SAFE(&UNIQ_T(C, q), UNIQ_T(B, q), UNIQ_T(A, q)) ? UNIQ_T(C, q) : (typeof(x)) -1; \
        })
#define ROUND_UP(x, y) __ROUND_UP(UNIQ, x, y)
```

```c:line-numbers=352 [原文]
/* [(x + y - 1) / y] suffers from an integer overflow, even though the
 * computation should be possible in the given type. Therefore, we use
 * [x / y + !!(x % y)]. Note that on "Real CPUs" a division returns both the
 * quotient and the remainder, so both should be equally fast. */
#define DIV_ROUND_UP(x, y) __DIV_ROUND_UP(UNIQ, x, UNIQ, y)
#define __DIV_ROUND_UP(xq, x, yq, y)                                    \
        ({                                                              \
                const typeof(x) UNIQ_T(X, xq) = (x);                    \
                const typeof(y) UNIQ_T(Y, yq) = (y);                    \
                (UNIQ_T(X, xq) / UNIQ_T(Y, yq) + !!(UNIQ_T(X, xq) % UNIQ_T(Y, yq))); \
        })

/* Rounds up x to the next multiple of y. Resolves to typeof(x) -1 in case of overflow */
#define __ROUND_UP(q, x, y)                                             \
        ({                                                              \
                const typeof(y) UNIQ_T(A, q) = (y);                     \
                const typeof(x) UNIQ_T(B, q) = DIV_ROUND_UP(x, UNIQ_T(A, q)); \
                typeof(x) UNIQ_T(C, q);                                 \
                MUL_SAFE(&UNIQ_T(C, q), UNIQ_T(B, q), UNIQ_T(A, q)) ? UNIQ_T(C, q) : (typeof(x)) -1; \
        })
#define ROUND_UP(x, y) __ROUND_UP(UNIQ, x, y)
```

:::

## 前提知識

- **整数の割り算**: C の整数どうしの `/` は、小数点以下を切り捨てます。`10 / 4` は `2` です。`%` は余りで、`10 % 4` は `2` です。
- **符号なし整数のオーバーフロー**: `unsigned`（負の数を持たない整数）は、最大値を超えると 0 に戻って数え直します。32 ビットなら 4294967295 の次は 0 です。エラーにはならず、黙って小さな値になります。
- **`!!x`**: `!` は「0 なら 1、それ以外なら 0」を返す論理否定です。2 回重ねると「0 なら 0、それ以外なら 1」になり、どんな値も 0 か 1 に変換できます。
- **`typeof`、文式 `({ })`、`UNIQ_T`**: `typeof(x)` は式の型を取り出す GCC 拡張、`({ ... })` は最後の式の値を返す複文、`UNIQ_T(X, xq)` は呼び出しごとに名前が重ならない一時変数を作る systemd のマクロです。いずれも「引数を一度だけ評価する」ために使われています。
- **`MUL_SAFE(ret, a, b)`**: 同じファイルで `#define MUL_SAFE(ret, a, b) (!__builtin_mul_overflow(a, b, ret))` と定義されています。`a * b` を `*ret` に入れ、あふれなければ真を返します。

## 何をしているか

### 1. 定番の式の問題点

```c:line-numbers=352
/* [(x + y - 1) / y] suffers from an integer overflow, even though the
 * computation should be possible in the given type. Therefore, we use
 * [x / y + !!(x % y)]. Note that on "Real CPUs" a division returns both the
 * quotient and the remainder, so both should be equally fast. */
```

切り上げ割り算は、よく `(x + y - 1) / y` と書かれます。`x = 10, y = 4` なら `13 / 4 = 3` で正しく動きます。
しかし 32 ビット符号なし整数で `x = 4294967290, y = 10` とすると、`x + 9` が最大値を超えて `3` に戻り、結果は `3 / 10 = 0` になってしまいます。本当の答えは `429496729` です。
コメントは「本来その型で計算できるはずなのに、途中でオーバーフローする」と指摘しています。

### 2. 割ってから余りを足す

```c:line-numbers=356
#define DIV_ROUND_UP(x, y) __DIV_ROUND_UP(UNIQ, x, UNIQ, y)
#define __DIV_ROUND_UP(xq, x, yq, y)                                    \
        ({                                                              \
                const typeof(x) UNIQ_T(X, xq) = (x);                    \
                const typeof(y) UNIQ_T(Y, yq) = (y);                    \
                (UNIQ_T(X, xq) / UNIQ_T(Y, yq) + !!(UNIQ_T(X, xq) % UNIQ_T(Y, yq))); \
        })
```

systemd は代わりに `x / y + !!(x % y)` と計算します。

- `x = 10, y = 4`: `10 / 4 = 2`、余り `2` は 0 でないので `!!2 = 1`。合計 `3`。
- `x = 12, y = 4`: `12 / 4 = 3`、余り `0` なので `!!0 = 0`。合計 `3`。

割り算の結果は必ず `x` 以下なので、足し算をしても桁あふれしません。
コメントには「実際の CPU は割り算で商と余りを同時に求めるので、速さは同じ」とあり、性能面の心配もないと説明しています。

### 3. 倍数への切り上げ

```c:line-numbers=364
/* Rounds up x to the next multiple of y. Resolves to typeof(x) -1 in case of overflow */
#define __ROUND_UP(q, x, y)                                             \
        ({                                                              \
                const typeof(y) UNIQ_T(A, q) = (y);                     \
                const typeof(x) UNIQ_T(B, q) = DIV_ROUND_UP(x, UNIQ_T(A, q)); \
                typeof(x) UNIQ_T(C, q);                                 \
                MUL_SAFE(&UNIQ_T(C, q), UNIQ_T(B, q), UNIQ_T(A, q)) ? UNIQ_T(C, q) : (typeof(x)) -1; \
        })
#define ROUND_UP(x, y) __ROUND_UP(UNIQ, x, y)
```

`ROUND_UP(x, y)` は、まず `DIV_ROUND_UP` で「何個ぶんか」を求め、それに `y` を掛けて倍数に戻します。
`x = 10, y = 4` なら、`3` 個ぶん × `4` = `12` です。

ただし掛け算は桁あふれする可能性があります。そこで `MUL_SAFE` で掛け算を試み、成功したら結果を、失敗したら `(typeof(x)) -1`（その型の最大値）を返します。
コメントどおり、「あふれたら -1」という約束です。

## ここがすごい

- **桁あふれの起きない並べ替え**: 足してから割るのではなく、割ってから 0 か 1 を足す、という順番の入れ替えだけで、オーバーフローの可能性を消しています。数学的には同じ式でも、コンピュータの整数では結果が違うことがあるという好例です。
- **`!!` で条件を数にする**: `if` を使わず、「余りがあれば 1」を `!!(x % y)` で書いています。短く、分岐もありません。
- **失敗を値で知らせる**: `ROUND_UP` は桁あふれを最大値で表します。呼び出し側は「結果が最大値か」を調べるだけで、異常を検出できます。黙って小さな値になるより、ずっと安全です。
- **`__builtin_mul_overflow` の活用**: 掛け算のあふれを自力で判定するのは意外と難しいのですが、GCC/Clang の組み込み関数に任せることで、正確で速いコードになります。
- **一度だけ評価**: `x` と `y` を最初に一時変数にコピーしているので、副作用のある式を渡しても安全です。

## まとめ

- 切り上げ割り算の定番 `(x + y - 1) / y` は、`x` が大きいと桁あふれする。
- `x / y + !!(x % y)` なら、途中の値が `x` を超えないので安全。
- `!!` を使うと「0 か、それ以外か」を 0/1 の数として扱える。
- 掛け算のあふれは `__builtin_mul_overflow` で検出し、失敗を特別な値で返す。
