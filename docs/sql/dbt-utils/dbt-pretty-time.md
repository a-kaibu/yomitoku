---
title: "現在の時刻を指定の形式で返す pretty_time"
description: "dbt-utils の pretty_time。Python の datetime を使い、現在の時刻を strftime の書式で文字列にする。既定は時:分:秒の形。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/jinja_helpers/pretty_time.sql
lines: [5, 7]
function: "default__pretty_time"
difficulty: 1
tags: [日時, 標準ライブラリ]
format: 2
---

## ひとことで

`pretty_time` は、現在の時刻を、読みやすい文字列にして返すマクロです。書式を引数で指定でき、省略すると「時:分:秒」の形になります。ログの表示などに使われます。

## コード

```sql:line-numbers=5
{% macro default__pretty_time(format='%H:%M:%S') %}
    {{ return(modules.datetime.datetime.now().strftime(format)) }}
{% endmacro %}
```

## 前提知識

- **`strftime`**: 日時を、書式の文字列に従って文字列にする関数。`%H` は時、`%M` は分、`%S` は秒。
- **`modules.datetime`**: dbt の Jinja の中から、Python の標準ライブラリ `datetime` を呼ぶための入口。
- **既定の引数**: 呼び出し側が省いたときに使われる値。ここでは書式の文字列。
- **`adapter.dispatch`**: 方言ごとに別の版を選ぶ仕組み。この記事の対象の `default__` 版は、標準の版。

## 何をしているか

### 1. 現在の時刻を取る

```sql:line-numbers=6
    {{ return(modules.datetime.datetime.now().strftime(format)) }}
```

`modules.datetime.datetime.now()` で、今の日時を取ります。

### 2. 書式に従って文字列にする

```sql:line-numbers=6
    {{ return(modules.datetime.datetime.now().strftime(format)) }}
```

`strftime(format)` で、取った日時を、引数の書式の文字列に変えます。引数を省くと、`%H:%M:%S` の形になります。

## ここがすごい

- **Python の標準の機能を借りる**: 日時の整形を、自分で書かずに既存の仕組みに任せています。
- **書式を外から変えられる**: 引数で形式を選べるので、用途に応じて表示を変えられます。
- **既定の書式がある**: 何も渡さなくても、よく使う形で時刻が得られます。

## まとめ

- 日時の整形は、言語の標準の機能に任せると確実になる。
- 書式を引数にすると、同じ関数で複数の表示に対応できる。
- 既定の値を用意すると、呼び出し側が引数を省ける。
