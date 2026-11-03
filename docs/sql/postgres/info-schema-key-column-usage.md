---
title: "制約の列を順番どおりに並べる key_column_usage"
description: "information_schema.key_column_usage。主キーや外部キーの列を配列から 1 行ずつ展開し、順番の番号と、参照先の位置を付けて返す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [1076, 1100]
function: "key_column_usage"
difficulty: 3
tags: [データ構造, 型システム]
format: 2
---

## ひとことで

`key_column_usage` は、主キー・一意制約・外部キーに含まれる列を一覧するビューです。複数の列からなる制約では、列の順番も分かるように 1 行ずつ並べます。外部キーでは、参照先の制約の中で何番目の列かも付けます。

## コード

```sql:line-numbers=1076
CREATE VIEW key_column_usage AS
    SELECT CAST(current_database() AS sql_identifier) AS constraint_catalog,
           CAST(nc_nspname AS sql_identifier) AS constraint_schema,
           CAST(conname AS sql_identifier) AS constraint_name,
           CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nr_nspname AS sql_identifier) AS table_schema,
           CAST(relname AS sql_identifier) AS table_name,
           CAST(a.attname AS sql_identifier) AS column_name,
           CAST((ss.x).n AS cardinal_number) AS ordinal_position,
           CAST(CASE WHEN contype = 'f' THEN
                       _pg_index_position(ss.conindid, ss.confkey[(ss.x).n])
                     ELSE NULL
                END AS cardinal_number)
             AS position_in_unique_constraint
    FROM pg_attribute a,
         (SELECT r.oid AS roid, r.relname, r.relowner,
                 nc.nspname AS nc_nspname, nr.nspname AS nr_nspname,
                 c.oid AS coid, c.conname, c.contype, c.conindid,
                 c.confkey, c.confrelid,
                 _pg_expandarray(c.conkey) AS x
          FROM pg_namespace nr, pg_class r, pg_namespace nc,
               pg_constraint c
          WHERE nr.oid = r.relnamespace
                AND r.oid = c.conrelid
                AND nc.oid = c.connamespace
```

## 前提知識

- **主キー（primary key）**: 行を一意に決める列。一意制約や外部キーと並んで「キー」と呼ばれる制約の一種。
- **外部キー（foreign key）**: 別のテーブルの行を参照する制約。
- **`conkey`**: 制約に含まれる列番号の配列。複数の列があれば、その順に並ぶ。
- **`CAST(... AS sql_identifier)`**: 値を、情報スキーマで定めた名前の型に変換する書き方。
- **関数を `FROM` で呼ぶ**: 関数の結果を表のように `FROM` の中で使い、列として取り出せる。

## 何をしているか

### 1. 制約ごとに列番号を 1 行ずつに展開する

内側のサブクエリは、制約と、そのテーブルの情報を結び、`conkey` を `_pg_expandarray` で行に広げます。

```sql:line-numbers=1091
         (SELECT r.oid AS roid, r.relname, r.relowner,
                 nc.nspname AS nc_nspname, nr.nspname AS nr_nspname,
                 c.oid AS coid, c.conname, c.contype, c.conindid,
                 c.confkey, c.confrelid,
                 _pg_expandarray(c.conkey) AS x
```

この時点で、制約 1 件につき列の数だけの行ができます。`x.x` が列番号、`x.n` が列の並び順です。

### 2. 列名と順番を付ける

外側の `SELECT` で、`pg_attribute` から列名を引き、`n` を `ordinal_position` として返します。

```sql:line-numbers=1077
    SELECT CAST(current_database() AS sql_identifier) AS constraint_catalog,
           CAST(nc_nspname AS sql_identifier) AS constraint_schema,
           CAST(conname AS sql_identifier) AS constraint_name,
           CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nr_nspname AS sql_identifier) AS table_schema,
           CAST(relname AS sql_identifier) AS table_name,
           CAST(a.attname AS sql_identifier) AS column_name,
           CAST((ss.x).n AS cardinal_number) AS ordinal_position,
```

`(ss.x).n` のように括弧を付けるのは、複合型の中の列を取り出すためです。

### 3. 外部キーの参照先の位置を求める

外部キーのときだけ、参照先の一意制約の中で何番目の列かを `_pg_index_position` で求めます。

```sql:line-numbers=1085
           CAST(CASE WHEN contype = 'f' THEN
                       _pg_index_position(ss.conindid, ss.confkey[(ss.x).n])
                     ELSE NULL
                END AS cardinal_number)
             AS position_in_unique_constraint
```

`ss.confkey[(ss.x).n]` は、外部キーの参照先の列番号を、同じ順番で取り出しています。

## ここがすごい

- **配列の順番をそのまま行の順番にしている**: 複数列の制約で、どの列がどの位置に対応するかを、番号で正確に伝えられます。
- **補助の関数を組み合わせている**: `_pg_expandarray` と `_pg_index_position` を使うことで、複雑な結合を書かずに済んでいます。
- **トレードオフ**: 1 つのビューの中で多くの結合と関数を重ねるため、読むには前提の知識が必要です。部品ごとに分けて読むと理解しやすくなります。

## まとめ

- 配列の要素を 1 行ずつにすると、列の順番を表に残せる。
- 外部キーの「参照先での位置」は、別の関数で求めると全体が読みやすくなる。
- 情報を見せるビューは、制約の仕組みを理解してから読むと理解が深まる。
