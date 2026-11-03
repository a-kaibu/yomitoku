---
title: "条件が成り立つかを行ごとに確かめる expression_is_true"
description: "dbt-utils の expression_is_true テスト。指定した式を否定した条件で行を探し、式が偽になる行を失敗として返す汎用テスト。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright (c) 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/expression_is_true.sql
lines: [5, 18]
function: "default__test_expression_is_true"
difficulty: 2
tags: [テスト, 防御的プログラミング]
format: 2
---

## ひとことで

`expression_is_true` は、表のすべての行で、ある条件が成り立っているかを確かめるテストです。たとえば「金額は 0 以上」といった条件を書くと、それに反する行を探して返します。

## コード

```sql:line-numbers=5
{% macro default__test_expression_is_true(model, expression, column_name) %}

{% set column_list = '*' if should_store_failures() else "1" %}

select
    {{ column_list }}
from {{ model }}
{% if column_name is none %}
where not({{ expression }})
{%- else %}
where not({{ column_name }} {{ expression }})
{%- endif %}

{% endmacro %}
```

## 前提知識

- **`not(...)`**: 条件を否定する式。真は偽に、偽は真になる。
- **`should_store_failures`**: 失敗した行を後から見られるように、テストの結果を保存するかを返す dbt の関数。
- **列の指定の有無**: 列名を渡すと列の前に付けて式を組み立て、渡さないと式をそのまま使う。

## 何をしているか

### 1. 表示する列を決める

```sql:line-numbers=7
{% set column_list = '*' if should_store_failures() else "1" %}
```

失敗の行を保存するときは全部の列、そうでなければ `1` だけを選びます。`1` だけなら、結果の大きさを抑えられます。

### 2. 式を否定して探す

```sql:line-numbers=9
select
    {{ column_list }}
from {{ model }}
{% if column_name is none %}
where not({{ expression }})
{%- else %}
where not({{ column_name }} {{ expression }})
{%- endif %}
```

`where not(式)` で、式が成り立たない行だけを残します。列名が無いときは式全体を、あるときは列名と式を組み合わせて書きます。

## ここがすごい

- **条件を書くだけでテストになる**: 式を渡すだけで、どんな条件でも確かめられます。
- **否定で失敗の行を集める**: 「成り立つ」ではなく「成り立たない」行を返すので、結果が分かりやすくなります。
- **保存と表示を切り替える**: 失敗の行を保存するかどうかで、列の数を変えています。

## まとめ

- 条件は否定して、反する行を探す。
- 失敗の行を保存するかで、選ぶ列を切り替える。
- 列名と式を分けて渡すと、同じマクロで色々な確かめ方ができる。
