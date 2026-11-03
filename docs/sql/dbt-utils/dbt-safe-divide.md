---
title: "分母が 0 のときだけ NULL にして割る"
description: "dbt-utils の safe_divide。分母に nullif(分母, 0) を使い、0 で割ってエラーになる代わりに NULL を返す。割り算の書き方を 1 か所にまとめる。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/safe_divide.sql
lines: [5, 6]
function: "default__safe_divide"
difficulty: 1
tags: [数値計算, 防御的プログラミング]
format: 2
---

## ひとことで

`safe_divide` は、割り算をするマクロです。分母が `0` のときに、データベースがエラーで止まるのを防ぎ、代わりに `NULL` を返します。たった 1 行の `nullif` で、この安全な割り算を作っています。

## コード

```sql:line-numbers=5
{% macro default__safe_divide(numerator, denominator) %}
    ( {{ numerator }} ) / nullif( ( {{ denominator }} ), 0)
```

## 前提知識

- **ゼロ除算**: 0 で割ること。多くのデータベースでは、実行がエラーになる。
- **`nullif(a, b)`**: `a` と `b` が等しいなら `NULL` を、違うなら `a` を返す関数。
- **`NULL` の割り算**: `NULL` と何を割っても結果は `NULL` になる。
- **マクロの引数**: `{{ numerator }}` のように、呼び出し側が渡した式が SQL に埋め込まれる。

## 何をしているか

### 1. 分母を nullif で包む

`nullif((分母), 0)` は、分母が `0` のときだけ `NULL` にします。

```sql:line-numbers=6
    ( {{ numerator }} ) / nullif( ( {{ denominator }} ), 0)
```

分母が `0` 以外なら、そのまま値が返ります。分母が `0` なら `NULL` になり、割り算の結果は `NULL` になります。エラーで止まらずに、結果が空として扱われます。

### 2. 分子と分母にかっこを付ける

分子と分母はそれぞれ丸括弧で囲まれています。これは、渡された式が `a + b` のような形でも、正しい順番で計算されるようにするためです。

## ここがすごい

- **1 行で安全さを表す**: エラーを捕まえる複雑な分岐を書かず、`nullif` の 1 つの関数で、ゼロ除算を避けています。
- **割り算の意味を変えない**: 0 以外のときは、普通の割り算と同じ結果になります。
- **`NULL` で結果の欠けを表す**: 割れなかったことを `NULL` にすると、集計の時に無視できます。
- **トレードオフ**: `NULL` は、「0 で割った」ことと「データが無い」ことを区別しません。後で値を見るときは、その区別が必要かを考える必要があります。

## まとめ

- ゼロ除算は、分母を `nullif` で `NULL` にすると避けられる。
- 割り算を 1 つのマクロにまとめると、安全さを統一して保てる。
- `NULL` は「計算できなかった」を表す値として使うと、結果が読みやすい。
