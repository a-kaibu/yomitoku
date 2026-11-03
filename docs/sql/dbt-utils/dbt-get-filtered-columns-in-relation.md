---
title: "除外したい列を外して列名の一覧を返す get_filtered_columns_in_relation"
description: "dbt-utils の get_filtered_columns_in_relation。モデルの列名を取り出し、除外の一覧に入っていない列名だけを、大文字小文字を区別せずに選んで返す。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/get_filtered_columns_in_relation.sql
lines: [14, 23]
function: "default__get_filtered_columns_in_relation"
difficulty: 2
tags: [文字列処理, イディオム]
format: 2
---

## ひとことで

`get_filtered_columns_in_relation` は、モデルの列の名前から、除外したいものを取り除いた一覧を返すマクロです。たとえば、ID や作成日時を除いた列だけを使って、別の SQL を組み立てるときに役立ちます。

## コード

```sql:line-numbers=14
    {%- set include_cols = [] %}
    {%- set cols = adapter.get_columns_in_relation(from) -%}
    {%- set except = except | map("lower") | list %}
    {%- for col in cols -%}
        {%- if col.column|lower not in except -%}
            {% do include_cols.append(col.column) %}
        {%- endif %}
    {%- endfor %}

    {{ return(include_cols) }}
```

## 前提知識

- **`adapter.get_columns_in_relation`**: 指定したモデルの列の情報を、データベースから取り出す関数。
- **`map("lower")`**: 一覧の全要素に、`lower`（小文字化）を当てる Jinja のフィルタ。
- **`not in`**: 値が一覧に含まれないかを調べる条件。
- **`loop`**: Jinja の繰り返しの中で、`for` の一回ごとの処理を書く形。

## 何をしているか

### 1. 列の名前を取り出す

```sql:line-numbers=15
    {%- set cols = adapter.get_columns_in_relation(from) -%}
```

データベースに問い合わせて、対象のモデルの列の情報を取り出します。

### 2. 除外の一覧を小文字にそろえる

```sql:line-numbers=16
    {%- set except = except | map("lower") | list %}
```

除外する列の名前を、すべて小文字にします。こうすると、大文字小文字の違いで除外が漏れなくなります。

### 3. 除外されていない列だけを残す

```sql:line-numbers=17
    {%- for col in cols -%}
        {%- if col.column|lower not in except -%}
            {% do include_cols.append(col.column) %}
        {%- endif %}
    {%- endfor %}

```

列の名前を小文字にして除外の一覧と比べ、入っていない列だけを `include_cols` に追加します。最後に、その一覧を返します。

## ここがすごい

- **大文字小文字の違いを吸収する**: 両方を小文字にそろえてから比べるので、列の名前の書き方に左右されません。
- **除外を名前の一覧で指定する**: 残す列を並べる代わりに、外したい列だけを書けば済みます。
- **解析の段階を飛ばす**: 前の記事と同じく、実行段階でのみデータベースに問い合わせます。

## まとめ

- 比べる前に大文字小文字をそろえると、判定の漏れを防げる。
- 「外すもの」を指定すると、残りの列を自動で集められる。
- データベースの情報取得は、実行段階に限って行う。
