---
title: "外部キーの参照先が無い行を左結合で探す"
description: "dbt-utils の relationships_where テスト。LEFT JOIN で参照元の値を参照先と結び、対応する行が無いもの（right_id が NULL）を集める。条件を付けて対象を絞れる。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/relationships_where.sql
lines: [36, 47]
function: "default__test_relationships_where"
difficulty: 2
tags: [データ構造, 防御的プログラミング]
format: 2
---

## ひとことで

`relationships_where` は、ある表の列が、別の表の列に必ず存在するかを確かめるテストです。外部キーの整合性を調べるのに使います。`LEFT JOIN` で結んで、相手が見つからない行だけを残します。条件を付けて、対象の行を絞ることもできます。

## コード

```sql:line-numbers=36
  select
    left_table.id,
    right_table.id as right_id

  from left_table

  left join right_table
         on left_table.id = right_table.id

  where right_table.id is null

)
```

## 前提知識

- **参照整合性**: 外部キーの値が、参照先の表に必ず存在すること。
- **`LEFT JOIN`**: 左の行を残し、対応が無ければ右の列を `NULL` にする結合。
- **`is null`**: 値が無いかどうかを調べる条件。
- **CTE（`with` 句）**: 途中の結果に名前を付ける書き方。ここでは `left_table` と `right_table` を作っている。
- **Jinja の変数**: `{{ column_name }}` などの値を、SQL の文字列として埋め込む。

## 何をしているか

### 1. 参照元と参照先の値を準備する

参照元（`left_table`）は、`NULL` でない値に、条件（`from_condition`）を付けたものです。参照先（`right_table`）も同じように、条件（`to_condition`）を付けて準備します。

```sql:line-numbers=10
with left_table as (

  select
    {{column_name}} as id

  from {{model}}

  where {{column_name}} is not null
    and {{from_condition}}

),
```

`where ... is not null` によって、空の値は比べる対象から外れます。

### 2. 参照先に無い値を探す

`left_table` を `right_table` に `LEFT JOIN` して、一致する行を探します。

```sql:line-numbers=36
  select
    left_table.id,
    right_table.id as right_id

  from left_table

  left join right_table
         on left_table.id = right_table.id

  where right_table.id is null
```

一致が無い行は、`right_table` の列が `NULL` になるので、`where right_table.id is null` の条件で拾えます。

### 3. 失敗した行を返す

残った行は、参照元の値と、参照先の値が `NULL` になった行です。これが、テストの結果として返されます。

```sql:line-numbers=49
select * from exceptions
```

## ここがすごい

- **`LEFT JOIN` と `is null` の組み合わせ**: 「対応する行が無い」を、結合の結果の `NULL` で判定しています。この形は、片方向の存在の検査でよく使われます。
- **条件を付けて絞り込める**: `from_condition` と `to_condition` で、検査する範囲を限定できます。大きな表の一部だけを確かめたいときに役立ちます。
- **`NULL` の値を先に除く**: 外部キーが空の行は、そもそも参照すべき相手がないので、比べる前に外しています。
- **トレードオフ**: 参照先の表の全行を読むので、大きな表同士では時間がかかります。条件を絞るのは、その対策にもなります。

## まとめ

- 「相手が無い行」は、`LEFT JOIN` の後に `is null` を付けると見つかる。
- 空の値は、比べる前に条件で外すと結果が正確になる。
- 検査の対象を条件で絞れるようにすると、大きなデータでも使いやすい。
