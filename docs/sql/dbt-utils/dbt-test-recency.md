---
title: "最新の日時が古すぎないかを確かめるテスト"
description: "dbt-utils の recency テスト。max() で最新の日時を求め、今から指定した期間より前なら失敗にする。日付だけで比べるオプションもある。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/recency.sql
lines: [17, 32]
function: "default__test_recency"
difficulty: 2
tags: [日時, 防御的プログラミング]
format: 2
---

## ひとことで

`recency` は、データの最新の日時が、今から見て十分に新しいかを確かめるテストです。たとえば「最新の注文が 1 日以内にあるか」を調べます。古すぎるときや、データが無いときに、失敗として報告します。

## コード

```sql:line-numbers=17
with recency as (

    select 

      {{ select_gb_cols }}
      {% if ignore_time_component %}
        cast(max({{ field }}) as date) as most_recent
      {%- else %}
        max({{ field }}) as most_recent
      {%- endif %}

    from {{ model }}

    {{ groupby_gb_cols }}

)
```

## 前提知識

- **`max()`**: 列の中の最大の値を返す集計関数。日時の列では、最も新しい時刻になる。
- **`dateadd`**: 日時に、指定した単位の数を足す dbt のマクロ。ここでは負の数を足して、過去の時点を作る。
- **`current_timestamp`**: 実行した時点の日時。
- **`is null`**: 値が無いかどうかを調べる条件。
- **`group by`**: 行をグループにまとめる指定。

## 何をしているか

### 1. 最新の日時を求める

`recency` という CTE は、対象の列の最大値を求めます。`ignore_time_component` が真なら、時刻を捨てて日付だけにします。

```sql:line-numbers=17
with recency as (

    select 

      {{ select_gb_cols }}
      {% if ignore_time_component %}
        cast(max({{ field }}) as date) as most_recent
      {%- else %}
        max({{ field }}) as most_recent
      {%- endif %}

    from {{ model }}

    {{ groupby_gb_cols }}

)
```

グループ化の列があれば、グループごとに最新の値を求めます。

### 2. しきい値より古いものを失敗にする

最後の `select` は、最新の日時と、しきい値（今からの期間を引いた時点）を並べ、しきい値より古いものを残します。

```sql:line-numbers=34
select

    {{ select_gb_cols }}
    most_recent,
    {{ threshold }} as threshold

from recency
where most_recent < {{ threshold }}
{%- if not empty_invocation %}
   or most_recent is null
{%- endif %}
```

`or most_recent is null` は、一度もデータが無いテーブルを失敗として扱うための条件です。ただし、`flags.EMPTY` という空の実行の印が付いているときは、この条件を外します。

## ここがすごい

- **テストの形をそろえている**: 「失敗の行を返す」という dbt の約束に、最新の日時の比較をそのまま当てはめています。
- **空のデータを区別する**: データが無いことを失敗にするかどうかを、実行の印で切り替えています。
- **しきい値の計算をデータベースに任せる**: 現在時刻や日付の足し算を、dbt のマクロに任せることで、データベースごとの書き方の違いを隠しています。
- **トレードオフ**: 比較する時刻はテストを実行した時点です。タイムゾーンや実行の時刻によって、結果が変わることがあります。

## まとめ

- 「最新のデータが新しいか」は、`max()` としきい値の比較で書ける。
- 空のデータを失敗にするかどうかは、実行の状況に合わせて決められる。
- 日時の比較では、時刻を含めるかどうかを明示すると結果が読みやすい。
