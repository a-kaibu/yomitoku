---
title: "行数が少ないかを比べる fewer_rows_than"
description: "dbt-utils の fewer_rows_than テスト。二つのモデルの行数を比べ、差を結果の値として返す。行数が多い、または等しい場合は失敗になる。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright (c) 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/fewer_rows_than.sql
lines: [46, 62]
function: "default__test_fewer_rows_than"
difficulty: 3
tags: [テスト, 数値計算]
format: 2
---

## ひとことで

`fewer_rows_than` は、このモデルの行数が、比べる相手のモデルより少ないかを確かめるテストです。たとえば、集計後の表が元の表より行数が多くなっていないかを、確かめられます。

## コード

```sql:line-numbers=46
counts as (

    select

        {% for c in group_by_columns -%}
          a.{{c}} as {{c}}_a,
          b.{{c}} as {{c}}_b,
        {% endfor %}

        count_our_model,
        count_comparison_model
    from a
    full join b on 
    a.id_dbtutils_test_fewer_rows_than = b.id_dbtutils_test_fewer_rows_than
    {{ join_gb_cols }}

),
```

## 前提知識

- **`count(*)`**: 行の数を数える集計。
- **`full join`**: 両側の行を、対応がなくても残す結合。
- **`coalesce`**: 最初に `NULL` でない値を返す関数。ここでは、差の `NULL` を 0 として扱う。
- **`fail_calc`**: テストが失敗したかを、どの列の合計で判断するかを指定する設定。

## 何をしているか

### 1. 結合の土台を作る

```sql:line-numbers=65
    select *,
        case
```

どちらの表でも行数を数え、`full join` で結び付けます。結合の条件は、後から付け加えた仮のキーを使います。

### 2. 行数の差を値にする

```sql:line-numbers=67
            -- fail the test if we have more rows than the reference model and return the row count delta
            when count_our_model > count_comparison_model then (count_our_model - count_comparison_model)
            -- fail the test if they are the same number
            when count_our_model = count_comparison_model then 1
            -- pass the test if the delta is positive (i.e. return the number 0)
            else 0
    end as row_count_delta
```

このモデルの行数が多ければ差を返し、同じなら 1 を返し、少なければ 0 を返します。テストは、返った値の合計で失敗を判断します。

## ここがすごい

- **結果を数で返す**: 失敗かどうかだけでなく、どれだけ差があるかも見せられます。
- **仮のキーで結合を固定する**: グループの列が無くても同じ書き方で結合できるように、仮のキーを足しています。
- **`fail_calc` で判断を指定する**: テストの結果の数え方を、設定で明示しています。

## まとめ

- 行数を数えて、両方を結合して比べる。
- 差を値として返すと、失敗の大きさも分かる。
- 仮のキーを足すと、グループの有無に関係なく結合の形が揃う。
