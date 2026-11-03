---
title: "禁止された値を探す not_accepted_values"
description: "dbt-utils の not_accepted_values テスト。列の中の値を重複を除いて取り出し、禁止のリストに入っている値を見つけて失敗として返す。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright (c) 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/not_accepted_values.sql
lines: [5, 37]
function: "default__test_not_accepted_values"
difficulty: 2
tags: [テスト, 防御的プログラミング]
format: 2
---

## ひとことで

`not_accepted_values` は、列に入ってはいけない値がないかを確かめるテストです。禁止のリストを引数で渡し、そのどれかが見つかれば、その値を返して失敗にします。`accepted_values` の反対の考え方です。

## コード

```sql:line-numbers=5
{% macro default__test_not_accepted_values(model, column_name, values, quote=True) %}
with all_values as (

    select distinct
        {{ column_name }} as value_field

    from {{ model }}

),

validation_errors as (

    select
        value_field

    from all_values
    where value_field in (
        {% for value in values -%}
            {% if quote -%}
            '{{ value }}'
            {%- else -%}
            {{ value }}
            {%- endif -%}
            {%- if not loop.last -%},{%- endif %}
        {%- endfor %}
        )

)

select *
from validation_errors

{% endmacro %}
```

## 前提知識

- **`distinct`**: 同じ値を 1 つにまとめる指定。
- **`in (...)`**: 値がリストの中のどれかに一致するかを調べる条件。
- **`quote` 引数**: 値を文字列として囲むかどうかを決める引数。
- **Jinja の `for` ループ**: リストの要素を一つずつ SQL の断片にして並べるための制御。

## 何をしているか

### 1. 列の値を重複なく集める

```sql:line-numbers=8
    select distinct
        {{ column_name }} as value_field

    from {{ model }}
```

`select distinct` で、列の値を一つずつ取り出します。同じ値が何度出てきても、1 行にまとまります。

### 2. 禁止のリストと比べる

```sql:line-numbers=21
    where value_field in (
        {% for value in values -%}
            {% if quote -%}
            '{{ value }}'
            {%- else -%}
            {{ value }}
            {%- endif -%}
            {%- if not loop.last -%},{%- endif %}
        {%- endfor %}
        )
```

`where value_field in (...)` で、禁止の値に一致するものを残します。Jinja の `for` は、リストの各値を並べ、最後の値の後にはカンマを付けません。

## ここがすごい

- **重複を先に消す**: 値の種類だけを比べるので、行数が多い表でも効率よく調べられます。
- **リストを SQL に変える**: 値の並びを Jinja で作るので、同じマクロを色々な禁止リストに使えます。
- **引用の有無を選べる**: 数値の列と文字の列を、同じ仕組みで扱えます。

## まとめ

- `distinct` で値の種類だけを集めて比べる。
- 禁止の値は、Jinja の `for` でリストから SQL に変える。
- テストは、見つかった値を返して失敗させる。
