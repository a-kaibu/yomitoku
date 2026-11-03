---
title: "列の組み合わせが重複していないかを GROUP BY で確かめる"
description: "dbt-utils の unique_combination_of_columns テスト。指定した列の組で GROUP BY し、HAVING count(*) > 1 で 2 行以上あるものを重複として返す。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/unique_combination_of_columns.sql
lines: [23, 34]
function: "default__test_unique_combination_of_columns"
difficulty: 2
tags: [データ構造, 防御的プログラミング]
format: 2
---

## ひとことで

`unique_combination_of_columns` は、複数の列を組み合わせたものが、行ごとに一意かどうかを確かめるテストです。1 つの列では一意でなくても、組み合わせでは一意になる、という主キーの設計を検査できます。

## コード

```sql:line-numbers=23
with validation_errors as (

    select
        {{ columns_csv }}
    from {{ model }}
    group by {{ columns_csv }}
    having count(*) > 1

)

select *
from validation_errors
```

## 前提知識

- **主キーの組み合わせ（複合主キー）**: 複数の列を合わせて、行を一意に決める。
- **`GROUP BY`**: 同じ値の行をまとめる指定。
- **`HAVING`**: グループに対する条件を書く句。`WHERE` は行に、`HAVING` はグループにかかる。
- **`count(*)`**: グループに含まれる行数。
- **Jinja の分岐**: `{% if %}` で、列名を引用符で囲むかどうかを切り替える。

## 何をしているか

### 1. 列名の一覧を用意する

引用符を付けるかどうかは、`quote_columns` で決まります。付けるときは、`adapter.quote()` で各列名をデータベースの形式に合わせて囲みます。

```sql:line-numbers=7
{% if not quote_columns %}
    {%- set column_list=combination_of_columns %}
{% elif quote_columns %}
    {%- set column_list=[] %}
        {% for column in combination_of_columns -%}
            {% do column_list.append( adapter.quote(column) ) %}
        {%- endfor %}
```

最後に、列名をカンマでつないで、SQL に埋め込める形にします。

### 2. 組み合わせでグループ化する

`group by` に、すべての列を並べます。同じ組み合わせの行が 1 つのグループになります。

```sql:line-numbers=25
    select
        {{ columns_csv }}
    from {{ model }}
    group by {{ columns_csv }}
```

`select` の列は、そのまま組み合わせの列です。グループごとに、どの組み合わせが問題なのかが見えます。

### 3. 2 行以上あるグループだけを返す

`having count(*) > 1` で、行が 2 つ以上あるグループだけを残します。それが、重複している組み合わせです。

```sql:line-numbers=29
    having count(*) > 1

)

select *
from validation_errors
```

## ここがすごい

- **集計の仕組みで重複を見つける**: 全行を比べる代わりに、`group by` と `count` で、重複の有無を 1 回の集計で判定しています。
- **引用符の付け方を切り替える**: 大文字と小文字や、予約語になる列名に対応するため、引用符の有無を選べます。
- **失敗の結果がそのまま原因になる**: 返される行は、重複している組み合わせの値なので、どこが問題かが分かります。
- **トレードオフ**: `group by` は表全体を集計するので、大きな表では時間がかかります。主キーの検査は、通常は 1 回の実行で済ませるとよいです。

## まとめ

- 重複の検査は、`group by` と `having count(*) > 1` の組み合わせで書ける。
- 複合の一意性は、グループの列を組み合わせ全体にすると確かめられる。
- 引用符の扱いは、データベースごとの違いに合わせて切り替えられるようにすると良い。
