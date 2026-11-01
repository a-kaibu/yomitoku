---
title: "小数を使わずに「10.5」を 1050 として読む固定小数点パーサ"
description: "「33.3」のような小数表記を、浮動小数点を一切使わずに整数として読む関数。小数点以下の桁数を引数で決め、足りない桁は 0 で埋め、多すぎればエラーにする。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_string.c
lines: [994, 1047]
function: "ngx_atofp"
difficulty: 2
format: 2
tags: [パース, 数値計算, 防御的プログラミング]
---

## ひとことで

`ngx_atofp` は、`"10.5"` のような小数の文字列を、**小数点以下 `point` 桁の固定小数点数** として整数で返す関数です。
コメントにあるとおり、`ngx_atofp("10.5", 4, 2)` は `1050` を返します。「10.50 を 100 倍した値」というわけです。nginx の `split_clients` モジュールでは、`"33.3%"` のような割合を 2 桁の固定小数点として読むのに使われています。

## コード

::: code-group

```c:line-numbers=994 [日本語訳]
/* 固定小数点数をパースする。例: ngx_atofp("10.5", 4, 2) は 1050 を返す */

ngx_int_t
ngx_atofp(u_char *line, size_t n, size_t point)
{
    ngx_int_t   value, cutoff, cutlim;
    ngx_uint_t  dot;

    if (n == 0) {
        return NGX_ERROR;
    }

    cutoff = NGX_MAX_INT_T_VALUE / 10;
    cutlim = NGX_MAX_INT_T_VALUE % 10;

    dot = 0;

    for (value = 0; n--; line++) {

        if (point == 0) {
            return NGX_ERROR;
        }

        if (*line == '.') {
            if (dot) {
                return NGX_ERROR;
            }

            dot = 1;
            continue;
        }

        if (*line < '0' || *line > '9') {
            return NGX_ERROR;
        }

        if (value >= cutoff && (value > cutoff || *line - '0' > cutlim)) {
            return NGX_ERROR;
        }

        value = value * 10 + (*line - '0');
        point -= dot;
    }

    while (point--) {
        if (value > cutoff) {
            return NGX_ERROR;
        }

        value = value * 10;
    }

    return value;
}
```

```c:line-numbers=994 [原文]
/* parse a fixed point number, e.g., ngx_atofp("10.5", 4, 2) returns 1050 */

ngx_int_t
ngx_atofp(u_char *line, size_t n, size_t point)
{
    ngx_int_t   value, cutoff, cutlim;
    ngx_uint_t  dot;

    if (n == 0) {
        return NGX_ERROR;
    }

    cutoff = NGX_MAX_INT_T_VALUE / 10;
    cutlim = NGX_MAX_INT_T_VALUE % 10;

    dot = 0;

    for (value = 0; n--; line++) {

        if (point == 0) {
            return NGX_ERROR;
        }

        if (*line == '.') {
            if (dot) {
                return NGX_ERROR;
            }

            dot = 1;
            continue;
        }

        if (*line < '0' || *line > '9') {
            return NGX_ERROR;
        }

        if (value >= cutoff && (value > cutoff || *line - '0' > cutlim)) {
            return NGX_ERROR;
        }

        value = value * 10 + (*line - '0');
        point -= dot;
    }

    while (point--) {
        if (value > cutoff) {
            return NGX_ERROR;
        }

        value = value * 10;
    }

    return value;
}
```

:::

## 前提知識

- **浮動小数点数**: `double` などの小数の型です。便利ですが、`0.1` を正確に表せないなど誤差があります。
- **固定小数点数**: 小数点の位置を決めておき、整数で小数を表す方法です。「小数点以下 2 桁」と決めれば、`10.5` を `1050` と表せます。整数なので誤差がありません。
- **`ngx_int_t` / `ngx_uint_t`**: nginx の符号つき・符号なし整数型です。`size_t` も符号なしの整数型です。
- **`NGX_MAX_INT_T_VALUE`**: `ngx_int_t` が表せる最大値です。
- **`*line - '0'`**: 文字 `'7'` から文字 `'0'` を引くと数値 7 になります（ASCII で数字が連続しているため）。
- **`for (value = 0; n--; line++)`**: `n` 文字ぶん、1 文字ずつ進むループです。
- **`continue`**: ループの残りを飛ばして次の周へ進みます。
- **`while (point--)`**: `point` が 0 になるまで、1 ずつ減らしながら繰り返します。

## 何をしているか

### 1. 準備

```c:line-numbers=1002
    if (n == 0) {
        return NGX_ERROR;
    }

    cutoff = NGX_MAX_INT_T_VALUE / 10;
    cutlim = NGX_MAX_INT_T_VALUE % 10;

    dot = 0;
```

空文字列はエラーです。`cutoff` と `cutlim` は、あふれを事前に検出するための値です（最大値を 10 で割った商と余り）。`dot` は「すでに小数点を見たか」の印です。

### 2. 1 文字ずつ読む

```c:line-numbers=1011
    for (value = 0; n--; line++) {

        if (point == 0) {
            return NGX_ERROR;
        }

        if (*line == '.') {
            if (dot) {
                return NGX_ERROR;
            }

            dot = 1;
            continue;
        }

        if (*line < '0' || *line > '9') {
            return NGX_ERROR;
        }

        if (value >= cutoff && (value > cutoff || *line - '0' > cutlim)) {
            return NGX_ERROR;
        }

        value = value * 10 + (*line - '0');
        point -= dot;
    }
```

ループの中では、次の順に調べます。

- `if (point == 0)`: `point` が 0 なのにまだ数字が残っているなら、小数点以下の桁が多すぎるのでエラー。
- `if (*line == '.')`: `.` なら印を付けて次へ。2 個目の `.` はエラー。
- `if (*line < '0' || *line > '9')`: 数字以外はエラー。
- `if (value >= cutoff && ...)`: 10 倍して足すとあふれるならエラー。
- `value = value * 10 + (*line - '0');`: 値を 1 桁ぶん更新。
- `point -= dot;`: 小数点より後ろの数字を 1 つ読むたびに、残りの桁数を 1 減らします。

`dot` は 0 か 1 なので、`point -= dot` は「小数点を過ぎていれば 1 減らす」を、`if` を書かずに表しています。

`"10.5"`、`point = 2` で追います。

- `'1'`: value = 1（point は 2 のまま）
- `'0'`: value = 10
- `'.'`: dot = 1
- `'5'`: value = 105、point = 1

### 3. 足りない桁を 0 で埋める

```c:line-numbers=1038
    while (point--) {
        if (value > cutoff) {
            return NGX_ERROR;
        }

        value = value * 10;
    }
```

残った `point` の回数だけ 10 倍します。ここでは 1 回なので `1050` です。`"10"` なら 2 回 10 倍して `1000`、`"10.55"` ならループ後に `point` は 0 で `1055` のままです。`"10.555"` なら、3 つ目の `5` を読む前に `if (point == 0)` でエラーになります。

10 倍するたびに `value > cutoff` を調べ、ここでもあふれを防いでいます。

## ここがすごい

- **浮動小数点を使わない**: `strtod` などで `double` に変換してから 100 倍すると、`33.3` が `3329.9999…` になり、切り捨てで `3329` になるといった誤差が起きえます。この関数は最初から整数として読むので、`3330` が確実に得られます。設定値の比較や合計（`split_clients` の割合の合計が 100% を超えないか）を整数で正確に行えます。
- **`point -= dot` の小さな技**: 「小数点を過ぎたか」を 0/1 の整数で持ち、そのまま引き算に使うことで、分岐を 1 つ減らしています。
- **桁が多すぎることもエラーにする**: 黙って切り捨てる設計もありえますが、設定の書き間違いに気づけるよう、精度を超える入力ははっきり拒否しています。`"10."` のような書き方は受け付けますが、`"1.2.3"` や `"abc"` は拒否します。
- **あふれ検出を 2 か所で**: 数字を読むときと、0 を埋めるときの両方で、計算の前に上限を確かめています。符号つき整数のあふれは C では未定義動作なので、計算する前に止めることが大切です。

## まとめ

- 小数を誤差なく扱いたいときは、固定小数点（整数に倍率を掛けた形）が強い味方になる。
- 0/1 のフラグを引き算に使うと、条件分岐を書かずに「ある時点からだけ数える」が書ける。
- 精度を超える入力は黙って丸めず、エラーにすると設定ミスを見つけやすい。
