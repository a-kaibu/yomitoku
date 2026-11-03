---
title: "区間が重ならないかを lead() で確かめる"
description: "dbt-utils の mutually_exclusive_ranges テスト。下限と上限の列から次の行の下限を lead() で取り、区間どうしが重ならず、すき間もないかを確かめる。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/mutually_exclusive_ranges.sql
lines: [34, 55]
function: "default__test_mutually_exclusive_ranges"
difficulty: 3
tags: [アルゴリズム, 数値計算]
format: 2
---

## ひとことで

`mutually_exclusive_ranges` は、区間を表す行（開始と終了の組）が、互いに重ならないかを確かめるテストです。料金表の期間や、ある人が住んでいた住所の期間などを確かめるのに使えます。すき間を許すかどうかも、引数で切り替えられます。

## コード

```sql:line-numbers=34
with window_functions as (

    select
        {% if partition_by %}
        {{ partition_by }} as partition_by_col,
        {% endif %}
        {{ lower_bound_column }} as lower_bound,
        {{ upper_bound_column }} as upper_bound,

        lead({{ lower_bound_column }}) over (
            {{ partition_clause }}
            order by {{ lower_bound_column }}, {{ upper_bound_column }}
        ) as next_lower_bound,

        row_number() over (
            {{ partition_clause }}
            order by {{ lower_bound_column }} desc, {{ upper_bound_column }} desc
        ) = 1 as is_last_record

    from {{ model }}

),
```

## 前提知識

- **区間（range）**: 下限（開始）と上限（終了）の組で表される範囲。
- **`lead(列)`**: 並び順の次の行の値を取り出す窓関数。`lag` の反対。
- **`row_number()`**: 並び順に従って番号を付ける窓関数。
- **`coalesce(式, 既定値)`**: 最初の `NULL` でない値を返す関数。`NULL` になる比較の結果を、既定の真偽値に置き換えるのに使う。
- **真偽値の列**: `row_number() ... = 1 as is_last_record` のように、比較の結果を列として持つ書き方。

## 何をしているか

### 1. 次の区間の下限と、最後の行かどうかを用意する

窓関数で、次の行の下限（`next_lower_bound`）と、最後の行かどうかの印（`is_last_record`）を付けます。

```sql:line-numbers=43
        lead({{ lower_bound_column }}) over (
            {{ partition_clause }}
            order by {{ lower_bound_column }}, {{ upper_bound_column }}
        ) as next_lower_bound,

        row_number() over (
            {{ partition_clause }}
            order by {{ lower_bound_column }} desc, {{ upper_bound_column }} desc
        ) = 1 as is_last_record
```

`order by 下限, 上限` で並べているので、区間を左から右へ順にたどれます。`partition by` があれば、グループごとに別々に並べます。

### 2. 区間の中の条件を確かめる

下限より上限が大きいことを確かめる条件は、`coalesce` で `NULL` を失敗にそろえています。

```sql:line-numbers=66
        coalesce(
            lower_bound {{ allow_zero_length_operator }} upper_bound,
            false
        ) as lower_bound_{{ allow_zero_length_operator_in_words }}_upper_bound,
```

次の区間との関係も、同じ形で確かめます。最後の行は次が無いので、`is_last_record` が真なら成立させます。

```sql:line-numbers=73
        coalesce(
            upper_bound {{ allow_gaps_operator }} next_lower_bound,
            is_last_record,
            false
        ) as upper_bound_{{ allow_gaps_operator_in_words }}_next_lower_bound
```

### 3. 失敗した行だけを返す

最後に、どちらかの条件が崩れている行だけを残します。

```sql:line-numbers=89
    where not(
```

```sql:line-numbers=91
        lower_bound_{{ allow_zero_length_operator_in_words }}_upper_bound
        and upper_bound_{{ allow_gaps_operator_in_words }}_next_lower_bound
    )
)
```

## ここがすごい

- **隣り合う行どうしを比べる**: 区間の重なりを、全組み合わせの比較ではなく、1 行後との比較だけで確かめられます。計算量が小さく済みます。
- **すき間の扱いを演算子で切り替える**: `=`、`<=`、`<` を書き分けることで、すき間の有無をテストの条件として表しています。
- **`NULL` を失敗として扱う**: `coalesce` で、比べられない行を必ず目立たせるようにしています。
- **トレードオフ**: `order by` の列が同じ値の区間が多いと、並びの順番で結果が変わることがあります。区間の開始が同じものがあるかを、事前に確かめておくとよいです。

## まとめ

- 区間の重なりは、並べたうえで隣との比較にすると簡単に確かめられる。
- 「すき間を許すか」のような仕様は、演算子を切り替える引数で表せる。
- `coalesce` で比べられない行を失敗にすると、見落としが減る。
