---
title: "全部が NULL の列を見つけるテスト"
description: "dbt-utils の at_least_one テスト。対象の列に値が 1 つも無い（すべて NULL）グループを、count() と having で見つける。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/at_least_one.sql
lines: [23, 32]
function: "default__test_at_least_one"
difficulty: 2
tags: [防御的プログラミング, データ構造]
format: 2
---

## ひとことで

`at_least_one` は、ある列に少なくとも 1 つ値が入っているかを確かめるテストです。全部が `NULL` のときに失敗として報告します。グループごとに確かめることもできます。

## コード

```sql:line-numbers=23
select *
from (
    with pruned_rows as (
      select
        {{ select_pruned_cols }}
      from {{ model }}
      {% if group_by_columns|length() == 0 %}
        where {{ column_name }} is not null
        limit 1
      {% endif %}
```

## 前提知識

- **`NULL`**: 値が無いことを表す特別な状態。`count(列)` は `NULL` を数えないので、値の有無を調べるのに使える。
- **`count(列)`**: 列の中で、`NULL` でない値の数を数える集計関数。
- **`having`**: `group by` で作ったグループに対して条件をかける句。`where` は行に、`having` はグループにかかる。
- **`limit 1`**: 結果を 1 行だけに絞る指定。
- **サブクエリ**: `from (...)` の中に書く `select`。

## 何をしているか

### 1. 対象の列を取り出す

グループ化の指定が無いときは、列に `NULL` でない値が 1 つあるかを、`limit 1` で素早く調べます。

```sql:line-numbers=23
select *
from (
    with pruned_rows as (
      select
        {{ select_pruned_cols }}
      from {{ model }}
      {% if group_by_columns|length() == 0 %}
        where {{ column_name }} is not null
        limit 1
      {% endif %}
```

`where 列 is not null` で値のある行だけを残し、`limit 1` で 1 行見つかった時点で止めます。これで、大きな表を全部読まずに済みます。

### 2. 値が 0 のグループを探す

最後に、`count(列)` が `0` のものを `having` で残します。値が 1 つも無いのに、行だけはあるグループです。

```sql:line-numbers=37
      {{select_gb_cols}}
      count({{ column_name }}) as filler_column

    from pruned_rows

    {{groupby_gb_cols}}

    having count({{ column_name }}) = 0

) validation_errors
```

`filler_column` という名前は、TSQL（SQL Server）の仕様に合わせるための付け足しです。サブクエリの集計列には別名が必要なので、その別名を付けています。

## ここがすごい

- **`count` の性質を検査に使う**: `count(列)` が `NULL` を数えないことを利用して、値の有無を 1 つの式で表しています。
- **早く止まる工夫**: グループ化が無い場合は `limit 1` で、見つけた時点で読むのをやめます。
- **データベースの違いに配慮**: 別名の付け方など、特定のデータベースの仕様の制約を、コメントで理由とともに残しています。
- **トレードオフ**: `limit 1` は、グループ化が無いときだけ使われます。グループがある場合は、全体を集計するので、大きな表では時間がかかることがあります。

## まとめ

- `count(列)` は `NULL` を数えないので、値の有無の確認に使える。
- 「1 件見つかれば十分」の検査は、`limit 1` で止めると速い。
- データベースごとの制約は、理由をコメントに残すと保守しやすい。
