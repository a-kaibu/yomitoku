---
title: "重複行を DISTINCT ON で 1 行にする"
description: "dbt-utils の deduplicate マクロの PostgreSQL 版。DISTINCT ON を使い、指定した列ごとに並び順の先頭の 1 行だけを残す。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/deduplicate.sql
lines: [50, 57]
function: "postgres__deduplicate"
difficulty: 2
tags: [データ構造, イディオム]
format: 2
---

## ひとことで

`deduplicate` は、同じ値の行が重複しているテーブルから、各グループの代表となる 1 行だけを残すマクロです。PostgreSQL 版は、`DISTINCT ON` という専用の構文を使って、短く書いています。

## コード

```sql:line-numbers=50
{%- macro postgres__deduplicate(relation, partition_by, order_by) -%}

    select
        distinct on ({{ partition_by }}) *
    from {{ relation }}
    order by {{ partition_by }}{{ ',' ~ order_by }}

{%- endmacro -%}
```

## 前提知識

- **重複**: 同じキー（ここでは `partition_by` の列）を持つ複数の行。
- **`DISTINCT ON (列)`**: PostgreSQL の独自の構文。指定した列の値ごとに、`ORDER BY` で並べた先頭の 1 行だけを残す。
- **`ORDER BY`**: 行の並び順を指定する句。`DISTINCT ON` では、どの行を残すかを決める。
- **`{{ }}`**: Jinja の変数の展開。マクロの引数を SQL の文字列として埋め込む。
- **マクロの接尾辞**: `postgres__deduplicate` の `postgres__` は、この版が PostgreSQL 向けであることを表す。

## 何をしているか

### 1. 同じキーの行を並べて、1 つ残す

本体は、`DISTINCT ON` に `partition_by` を渡し、その後に `order_by` を並べるだけです。

```sql:line-numbers=52
    select
        distinct on ({{ partition_by }}) *
    from {{ relation }}
    order by {{ partition_by }}{{ ',' ~ order_by }}
```

`DISTINCT ON (キー)` は、キーが同じ行のうち、並び順の最初の 1 行だけを残します。どの行が最初になるかは、`ORDER BY` の後半（`order_by`）で決まります。

### 2. 並び順にキーを先に入れる

`order by {{ partition_by }}{{ ',' ~ order_by }}` のように、キーを先頭に置いてから残りの順番を並べます。

```sql:line-numbers=56

{%- endmacro -%}
```

`DISTINCT ON` は、先頭の式の並びで区切りを判定するので、キーを先頭に置かないと正しく動きません。

## ここがすごい

- **1 つの構文で済む**: 他のデータベースのように `row_number()` と外側の `WHERE` を組み合わせなくても、同じ結果が得られます。
- **データベースの機能を生かす**: 共通の書き方ではなく、PostgreSQL の独自構文を選んで、最も短い形を採っています。
- **マクロで差を隠す**: 呼び出す側は、どのデータベースでも同じ `deduplicate` を使うだけで済みます。
- **トレードオフ**: `DISTINCT ON` は PostgreSQL 独自の構文なので、他のデータベースに移すと動きません。移植性は、マクロの振り分けで保っています。

## まとめ

- 重複の除去は、データベースの独自の構文を使うと簡潔に書ける。
- `DISTINCT ON` では、並び順の先頭の列がグループの区切りになる。
- 共通の名前のマクロで、データベースごとの書き方を隠せる。
