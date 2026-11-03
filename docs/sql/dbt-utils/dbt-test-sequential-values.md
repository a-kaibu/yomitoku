---
title: "連番の抜けを lag() で見つけるテスト"
description: "dbt-utils の sequential_values テスト。lag() で 1 行前の値を横に並べ、差が想定の間隔と違う行を取り出す。グループごとに分けて数えることもできる。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/sequential_values.sql
lines: [16, 26]
function: "default__test_sequential_values"
difficulty: 2
tags: [データ構造, アルゴリズム]
format: 2
---

## ひとことで

`sequential_values` は、ある列の値が、一定の間隔で連続しているかを確かめるテストです。連番の抜けや、順番の狂いを見つけます。テストは「失敗した行」を返す形で書かれていて、何も返らなければ合格になります。

## コード

```sql:line-numbers=16
with windowed as (

    select
        {{ select_gb_cols }}
        {{ column_name }},
        lag({{ column_name }}) over (
            {{partition_gb_cols}}
            order by {{ column_name }}
        ) as {{ previous_column_name }}
    from {{ model }}
),
```

## 前提知識

- **dbt のテスト**: モデルの列が条件を満たすかを、SQL の結果で確かめる仕組み。結果が空なら合格、行が返れば失敗。
- **窓関数（window function）**: 行の集まりの中で計算する関数。`OVER (...)` と書く。
- **`lag(列)`**: 並び順の 1 つ前の行の値を取り出す窓関数。
- **`partition by`**: 窓関数の計算を、グループごとに分けて行う指定。
- **Jinja の `if` と変数**: `{% if %}` で条件によって SQL の一部を書き分ける。

## 何をしているか

### 1. 1 行前の値を横に並べる

最初の CTE（`windowed`）は、各行に、並び順で 1 つ前の値を付けます。

```sql:line-numbers=16
with windowed as (

    select
        {{ select_gb_cols }}
        {{ column_name }},
        lag({{ column_name }}) over (
            {{partition_gb_cols}}
            order by {{ column_name }}
        ) as {{ previous_column_name }}
    from {{ model }}
),
```

`lag(列) over (order by 列)` が、1 行前の値を `previous_` の名前の列に入れます。`partition by` が指定されていれば、グループの中だけで 1 つ前を探します。

### 2. 差が期待と違う行を探す

次の CTE（`validation_errors`）は、前の値との差が想定どおりでない行を選びます。

```sql:line-numbers=28
validation_errors as (
    select
        *
    from windowed
    {% if datepart %}
    where not(cast({{ column_name }} as {{ dbt.type_timestamp() }})= cast({{ dbt.dateadd(datepart, interval, previous_column_name) }} as {{ dbt.type_timestamp() }}))
    {% else %}
    where not({{ column_name }} = {{ previous_column_name }} + {{ interval }})
    {% endif %}
)
```

`datepart` が無い場合は、単純に「今の値 = 1 つ前の値 + 間隔」を確かめます。ここで `not(...)` を付けて、期待と違う行だけを残します。

## ここがすごい

- **比較を行どうしの比較に変える**: 「1 行前と比べる」という発想に変えると、連番の抜けを 1 回の `SELECT` で見つけられます。
- **失敗した行をそのまま返す**: テストの結果が、そのまま問題のある行の一覧になるので、原因を調べやすくなっています。
- **日付にも同じ考え方を使う**: `datepart` があれば、日付を単位で足し引きして比べるので、整数と日付の両方に対応できます。
- **トレードオフ**: 並び順を `order by` の列だけで決めるため、同じ値があるときの順番は決まりません。一意な列でテストするとよいです。

## まとめ

- 連続性は、1 行前の値との比較で確かめられる。
- テストの SQL は、失敗した行だけを返すと、結果の読み方が統一される。
- グループごとに `partition by` で区切ると、グループの中の連続性を確かめられる。
