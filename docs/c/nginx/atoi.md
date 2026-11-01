---
title: "あふれる「前に」止める、安全な文字列→整数変換"
description: "数字の並びを整数に変換する関数。掛け算や足し算であふれる前に、上限を 10 で割った値と余りを使って判定し、符号つき整数のオーバーフローを一度も起こさない。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_string.c
lines: [966, 991]
function: "ngx_atoi"
difficulty: 2
format: 2
tags: [パース, 防御的プログラミング, 数値計算]
---

## ひとことで

`ngx_atoi` は、`"8080"` のような数字の並び（長さ `n`）を整数 `8080` に変換する関数です。数字以外の文字が混じっていたり、値が大きすぎて型に収まらなかったりすると、`NGX_ERROR`（-1）を返します。
設定ファイルの数値や HTTP ヘッダの数値など、**外から来た信用できない文字列** を読むのに使われます。

## コード

```c:line-numbers=966
ngx_int_t
ngx_atoi(u_char *line, size_t n)
{
    ngx_int_t  value, cutoff, cutlim;

    if (n == 0) {
        return NGX_ERROR;
    }

    cutoff = NGX_MAX_INT_T_VALUE / 10;
    cutlim = NGX_MAX_INT_T_VALUE % 10;

    for (value = 0; n--; line++) {
        if (*line < '0' || *line > '9') {
            return NGX_ERROR;
        }

        if (value >= cutoff && (value > cutoff || *line - '0' > cutlim)) {
            return NGX_ERROR;
        }

        value = value * 10 + (*line - '0');
    }

    return value;
}
```

## 前提知識

- **`ngx_int_t`**: nginx の符号つき整数型です。64 ビット環境では 8 バイトで、最大値は `9223372036854775807` です。この最大値が `NGX_MAX_INT_T_VALUE` という定数で定義されています。
- **オーバーフロー**: 型に入りきらない大きな値を計算してしまうことです。C では、**符号つき整数のオーバーフローは「未定義動作」** で、何が起きても文句が言えない（コンパイラの最適化で予想外の結果になる）とされています。
- **`/` と `%`**: 整数の割り算は小数点以下を切り捨て、`%` は余りです。`17 / 10 = 1`、`17 % 10 = 7` です。
- **文字と数字**: `'0'`〜`'9'` の文字は ASCII で連続した番号（48〜57）です。`*line - '0'` で、文字 `'7'` を数値 7 に変えられます。
- **`u_char *line` と `line++`**: `line` は文字列を指すポインタで、`*line` で今の文字を読み、`line++` で次へ進みます。
- **`for (value = 0; n--; line++)`**: 最初に `value = 0` とし、`n` が 0 になるまで（毎回 1 減らしながら）繰り返します。
- **`&&` の短絡評価**: `a && b` は、`a` が偽なら `b` を調べません。

## 何をしているか

### 1. 空文字列はエラー

```c:line-numbers=971
    if (n == 0) {
        return NGX_ERROR;
    }
```

長さ 0 は数値ではないのでエラーです。

### 2. 「あと 1 桁足せるか」の境目を用意する

```c:line-numbers=975
    cutoff = NGX_MAX_INT_T_VALUE / 10;
    cutlim = NGX_MAX_INT_T_VALUE % 10;
```

`cutoff` は最大値を 10 で割った値、`cutlim` はその余りです。説明しやすいよう、最大値が `127` の小さな型で考えます。すると `cutoff = 12`、`cutlim = 7` です。

### 3. 1 桁ずつ読みながら、あふれないか先に調べる

```c:line-numbers=978
    for (value = 0; n--; line++) {
        if (*line < '0' || *line > '9') {
            return NGX_ERROR;
        }

        if (value >= cutoff && (value > cutoff || *line - '0' > cutlim)) {
            return NGX_ERROR;
        }

        value = value * 10 + (*line - '0');
    }
```

数字でなければすぐエラーです（`if (*line < '0' || *line > '9')`）。
次の `if (value >= cutoff && (value > cutoff || *line - '0' > cutlim))`が核心です。`value * 10 + d`（`d` は今の桁）を計算する **前に**、それが最大値を超えないかを調べます。

- `value > cutoff` なら、10 倍しただけで最大値を超えます（`13 * 10 = 130 > 127`）。
- `value == cutoff` なら、10 倍は `120` でぎりぎり大丈夫ですが、足す `d` が `cutlim`（7）を超えるとあふれます（`120 + 8 = 128`）。

`"127"` なら、`value = 12` のときに `d = 7` で、`7 > 7` ではないので通り、127 になります。`"128"` なら `8 > 7` でエラーです。

`value >= cutoff && (...)` と書いているのは、ほとんどの桁では `value < cutoff` なので、`&&` の左だけで判定が終わるようにするためです。

### 4. 値を更新する

```c:line-numbers=987
        value = value * 10 + (*line - '0');
```

安全と分かってから `value * 10 + d` を計算します。

## ここがすごい

- **オーバーフローを一度も起こさない**: 素直に書くと「計算してから、値が負になっていたらあふれた」と調べたくなります。しかし符号つき整数のあふれは未定義動作なので、コンパイラが「あふれは起きない」と仮定して、その確認自体を消してしまうことさえあります。この関数は計算の前に判定するので、未定義動作に一度も触れません。
- **割り算は最初の 1 回だけ**: 「`value > (MAX - d) / 10` か」と毎桁調べる方法もありますが、それでは毎回割り算が必要です。`cutoff` と `cutlim` を最初に 1 回だけ求めておけば、ループの中は比較だけで済みます。これは BSD 系の `strtol` の実装などでも見られる古典的な技法です。
- **符号を扱わない割り切り**: この関数は `-` も `+` も受け付けません。nginx が読む数値（ポート番号、サイズ、個数など）は負にならないので、受け付ける形を狭くしたほうが安全で、コードも短くなります。
- **エラーを値で返す**: 結果は 0 以上の数なので、負の値 `NGX_ERROR` を「失敗」の印に使えます。呼び出し側は `if (n == NGX_ERROR)` と書くだけで済み、別の出力用の引数がいりません。

## まとめ

- 外から来た文字列を数値にするときは、あふれを「後から検出」ではなく「前もって防ぐ」。
- `上限 / 10` と `上限 % 10` を先に用意すると、ループ内は比較だけで安全確認ができる。
- 受け付ける形式を狭くすることも、防御的プログラミングの一部。
