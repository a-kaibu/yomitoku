---
title: "問い合わせの最初の値を取り出す get_single_value"
description: "dbt-utils の get_single_value。問い合わせを実行して 1 行 1 列の値を取り出し、行が無いときは既定の値を使い、解析の段階では問い合わせを実行しない。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/get_single_value.sql
lines: [15, 23]
function: "default__get_single_value"
difficulty: 2
tags: [エラー処理, 防御的プログラミング]
format: 2
---

## ひとことで

`get_single_value` は、問い合わせの結果から 1 つの値だけを取り出すマクロです。たとえば「最新の日付」のような値を、Jinja の変数に入れて後の処理で使えます。結果が空だったときは、呼び出し側が渡した既定の値を使います。

## コード

```sql:line-numbers=15
    {%- if execute -%}

        {% set r = load_result('get_query_result').table.columns[0].values() %}
        {% if r | length == 0 %}
            {{ log("Query `" ~ query ~ "` returned no rows. Using the default value: " ~ default) }}
            {% set sql_result = default %}
        {% else %}
            {% set sql_result = r[0] %}
        {% endif %}
```

## 前提知識

- **Jinja**: dbt でテンプレートを書くための仕組み。マクロの中で、SQL の結果を読めます。
- **`execute`**: dbt が実際に問い合わせを走らせる段階かどうかを表す変数。解析だけの段階では偽になる。
- **`load_result`**: 実行した問い合わせの結果を Jinja から読むための関数。
- **既定値（default）**: 値が取れないときに使う、呼び出し側が決めた値。

## 何をしているか

### 1. 実行段階かを確かめる

```sql:line-numbers=15
    {%- if execute -%}

```

`execute` が真のときだけ、問い合わせの結果を読みます。解析だけの段階では、問い合わせを走らせず、既定の値を使います。

### 2. 行が無いときは既定値を使う

```sql:line-numbers=18
        {% if r | length == 0 %}
            {{ log("Query `" ~ query ~ "` returned no rows. Using the default value: " ~ default) }}
            {% set sql_result = default %}
```

結果の最初の列の値が空なら、ログを出して既定の値を使います。空でないときは、先頭の値を取ります。

## ここがすごい

- **結果が空でも止まらない**: 既定の値に逃がすので、問い合わせの結果に頼る処理が途中で失敗しません。
- **実行段階を見分ける**: 解析の段階で不要な問い合わせを走らせないので、ビルドが無駄に遅くなりません。
- **呼び出しの側で決められる**: 既定の値を引数にしているので、マクロの中で値を決め打ちしていません。

## まとめ

- 問い合わせの結果は、Jinja の変数として取り出せる。
- 値が無い場合に備えて、既定の値を用意しておく。
- 実行段階と解析段階を分けると、無駄な問い合わせを避けられる。
