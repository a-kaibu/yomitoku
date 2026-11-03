---
title: "空文字の列を見つける not_empty_string"
description: "dbt-utils の not_empty_string テスト。列の値の前後の空白を取り除いてから、空文字になっている行を探し、見つかった行を失敗として返す。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/not_empty_string.sql
lines: [7, 39]
function: "default__test_not_empty_string"
difficulty: 1
tags: [文字列処理, テスト]
format: 2
---

## ひとことで

`not_empty_string` は、文字の列に空の文字列が入っていないかを確かめるテストです。見た目は値があっても、空白だけの値は空とみなせるため、設定によって前後の空白を取り除いてから確かめます。

## コード

```sql:line-numbers=7
{% macro default__test_not_empty_string(model, column_name, trim_whitespace=true) %}

    with
    
    all_values as (

        select 


            {% if trim_whitespace == true -%}

                trim({{ column_name }}) as {{ column_name }}

            {%- else -%}

                {{ column_name }}

            {%- endif %}
            
        from {{ model }}

    ),

    errors as (

        select * from all_values
        where {{ column_name }} = ''

    )

    select * from errors

{% endmacro %}
```

## 前提知識

- **空文字列**: 長さが 0 の文字列 `''`。`NULL` とは違う値。
- **`trim`**: 文字列の前後の空白を取り除く関数。
- **CTE（`with`）**: 途中の結果に名前を付けて、後の処理で使うための書き方。
- **汎用テスト**: 列名を引数に取り、どのモデルにも使えるテストの形。

## 何をしているか

### 1. 空白を取り除くかを選ぶ

```sql:line-numbers=16
            {% if trim_whitespace == true -%}

                trim({{ column_name }}) as {{ column_name }}

            {%- else -%}

                {{ column_name }}

            {%- endif %}
```

`trim_whitespace` が真なら、列の値の前後の空白を `trim` で取り除きます。偽なら、列の値をそのまま使います。

### 2. 空文字の行を探す

```sql:line-numbers=30
    errors as (

        select * from all_values
        where {{ column_name }} = ''

    )
```

`where` で、値がちょうど `''` の行を残します。`NULL` は比べられないので、ここには含まれません。

## ここがすごい

- **空白だけの値も検出する**: 前後の空白を取ってから比べるので、見た目が空の値を見逃しません。
- **設定で厳しさを選べる**: `trim_whitespace` を切り替えると、空白を許すかどうかを決められます。
- **結果が行で返る**: 失敗した行をそのまま見られるので、修正がしやすくなります。

## まとめ

- 空白を取り除くかどうかは、引数で切り替えられる。
- 空文字は `=''` で比べ、`NULL` とは分けて考える。
- テストは、問題のある行を返す形で書くと扱いやすい。
