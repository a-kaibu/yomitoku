---
title: "二つの表の行数が同じかを確かめる equal_rowcount"
description: "dbt-utils の equal_rowcount テスト。二つのモデルの行数を数えて完全結合し、行数の差の絶対値を返す。差が無いときだけ成功になる。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright (c) 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/equal_rowcount.sql
lines: [52, 72]
function: "default__test_equal_rowcount"
difficulty: 3
tags: [テスト, 数値計算]
format: 2
---

## ひとことで

`equal_rowcount` は、二つのモデルの行数が同じかを確かめるテストです。移行の前後で、行数が変わっていないかを調べるときなどに使います。差があれば、その差の大きさを値として返します。

## コード

```sql:line-numbers=52
final as (

    select
    
        {% for c in group_by_columns -%}
          a.{{c}} as {{c}}_a,
          b.{{c}} as {{c}}_b,
        {% endfor %}

        count_a,
        count_b,
        abs(count_a - count_b) as diff_count

    from a
    full join b
    on
    a.id_dbtutils_test_equal_rowcount = b.id_dbtutils_test_equal_rowcount
    {{join_gb_cols}}


)
```

## 前提知識

- **`abs`**: 数の符号を取り除き、絶対値にする関数。
- **`full join`**: 両側の行を、対応がなくても残す結合。
- **`count(*)`**: 行の数を数える集計。
- **既存の `fewer_rows_than`**: 同じ形の比べ方をする別のテスト。

## 何をしているか

### 1. 結合の条件を作る

```sql:line-numbers=28
{% set group_by_columns = ['id_dbtutils_test_equal_rowcount'] + group_by_columns %}
{% set groupby_gb_cols = 'group by ' + group_by_columns|join(',') %}
```

グループの列が無いときも結合できるように、仮のキーを先頭に足します。`group by` の句も、このキーを含めて作り直します。

### 2. 差の絶対値を取る

```sql:line-numbers=61
        count_a,
        count_b,
        abs(count_a - count_b) as diff_count
```

両方の行数を並べ、`abs(count_a - count_b)` で差の大きさだけを取り出します。どちらが多くても、同じ形で差を見られます。

## ここがすごい

- **完全結合で漏れを残す**: 片方にしか無いグループも残るので、行数の違いを取りこぼしません。
- **差の向きを捨てる**: 絶対値にすることで、どちらが多いかに関係なく同じ基準で失敗を判定できます。
- **`fewer_rows_than` と対になる**: 二つのテストは、同じ土台から書かれているので、読み比べると理解が進みます。

## まとめ

- 行数はグループごとに数えて、完全結合で比べる。
- 絶対値を取ると、差の大きさだけを基準にできる。
- 似た目的のテストは、同じ土台で揃えると保守しやすい。
