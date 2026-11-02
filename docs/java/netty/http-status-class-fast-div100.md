---
title: "割り算をせず、掛け算と右シフトで 100 で割る"
description: "Netty の HttpStatusClass.fast_div100。HTTP のステータスコードの百の位を、100 で割る代わりに、定数の掛け算と 37 ビットの右シフトで求める。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2014 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: codec-http/src/main/java/io/netty/handler/codec/http/HttpStatusClass.java
lines: [78, 80]
function: "HttpStatusClass.fast_div100"
difficulty: 3
format: 2
tags: [数値計算, 最適化, ビット演算]
---

## ひとことで

HTTP のステータスコードは、`200`、`404`、`503` のように 3 桁の数です。百の位が、その種類（1xx から 5xx）を表します。

Netty の `HttpStatusClass.valueOf(int)` は、その百の位を求めるために、`fast_div100` で 100 で割った商を求めます。割り算の命令を使わずに、掛け算とシフトで同じ結果を出しています。

## コード

```java:line-numbers=78
    private static int fast_div100(int dividend) {
        return (int) ((dividend * 1374389535L) >> 37);
    }
```

## 前提知識

- **整数の割り算の遅さ**: CPU の割り算の命令は、掛け算より時間がかかることが多いです。定数で割る場合は、掛け算とシフトに置き換えられます。
- **固定小数点の考え方**: 2 の累乗で割るシフトを使い、割る数の逆数を、整数の係数として掛けておく方法です。
- **`dividend`**: 割られる数です。コメントには「0 以上」と書かれています。
- **`long` の掛け算**: `int` の掛け算はオーバーフローするので、`1374389535L` のように `long` で計算しています。

## 何をしているか

### 1. 100 の逆数を、2 の 37 乗を基準にした整数で表す

```java:line-numbers=79
        return (int) ((dividend * 1374389535L) >> 37);
```

`1374389535` は、`2^37 / 100`（約 `1374389534.72`）を切り上げた値です。`dividend * 1374389535` を、`2^37` で割る（`>> 37`）と、おおよそ `dividend / 100` になります。

例として `404` は、`404 * 1374389535 >> 37` が `4` になります。`404 / 100` の商も `4` です。

### 2. 百の位で、ステータスの種類を選ぶ

```java:line-numbers=71
        return statusArray[fast_div100(code)];
```

`valueOf` は、まず `UNKNOWN` の範囲かを確かめます。そうでなければ、`fast_div100(code)` で得た百の位を、`statusArray` の添字にして、種類を返します。

## ここがすごい

- **割り算の命令を使わない**: 掛け算 1 回と右シフト 1 回で、商が求まります。
- **誤差が商を狂わせない**: 係数は `2^37 / 100` より `0.28` だけ大きいので、結果は `x / 100` に `0.01` 未満の誤差が加わる程度です。`x / 100` の小数部は最大でも `0.99` なので、切り捨ての結果は必ず正しい商になります（`int` の範囲の正の値に対して）。
- **`long` で桁あふれを防ぐ**: 掛け算の結果は `int` を超えることがあるので、`long` で計算してから、シフトで必要な桁を取り出しています。
- **HTTP の用途に合っている**: 対象は 3 桁のコードだけなので、この方法で十分に速く、結果も正確です。

## まとめ

- `fast_div100` は、`dividend * 1374389535` を `>> 37` して、100 で割った商を求める。
- 係数は `2^37 / 100` を切り上げた値で、非負の `int` に対して正しい商になる。
- ステータスコードの百の位を、割り算なしで求め、種類の配列の添字にしている。
