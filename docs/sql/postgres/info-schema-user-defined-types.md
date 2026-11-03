---
title: "利用者が作った複合型を一覧にする user_defined_types"
description: "PostgreSQL の user_defined_types ビュー。relkind が c の複合型を pg_class と pg_type から集め、利用者が使える権限を持つものだけを、標準の形の列で見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [2437, 2474]
function: "user_defined_types"
difficulty: 3
tags: [型システム, セキュリティ]
format: 2
---

## ひとことで

`user_defined_types` は、利用者が作った複合型の一覧を、標準の情報スキーマの形で見せるビューです。多くの列は、標準の決まりに合わせて `NULL` の固定値になっています。見える型は、所有者か、型の USAGE 権限を持つ人に限られます。

## コード

```sql:line-numbers=2437
CREATE VIEW user_defined_types AS
    SELECT CAST(current_database() AS sql_identifier) AS user_defined_type_catalog,
           CAST(n.nspname AS sql_identifier) AS user_defined_type_schema,
           CAST(c.relname AS sql_identifier) AS user_defined_type_name,
           CAST('STRUCTURED' AS character_data) AS user_defined_type_category,
           CAST('YES' AS yes_or_no) AS is_instantiable,
           CAST(null AS yes_or_no) AS is_final,
           CAST(null AS character_data) AS ordering_form,
           CAST(null AS character_data) AS ordering_category,
           CAST(null AS sql_identifier) AS ordering_routine_catalog,
           CAST(null AS sql_identifier) AS ordering_routine_schema,
           CAST(null AS sql_identifier) AS ordering_routine_name,
           CAST(null AS character_data) AS reference_type,
           CAST(null AS character_data) AS data_type,
           CAST(null AS cardinal_number) AS character_maximum_length,
           CAST(null AS cardinal_number) AS character_octet_length,
           CAST(null AS sql_identifier) AS character_set_catalog,
           CAST(null AS sql_identifier) AS character_set_schema,
           CAST(null AS sql_identifier) AS character_set_name,
           CAST(null AS sql_identifier) AS collation_catalog,
           CAST(null AS sql_identifier) AS collation_schema,
           CAST(null AS sql_identifier) AS collation_name,
           CAST(null AS cardinal_number) AS numeric_precision,
           CAST(null AS cardinal_number) AS numeric_precision_radix,
           CAST(null AS cardinal_number) AS numeric_scale,
           CAST(null AS cardinal_number) AS datetime_precision,
           CAST(null AS character_data) AS interval_type,
           CAST(null AS cardinal_number) AS interval_precision,
           CAST(null AS sql_identifier) AS source_dtd_identifier,
           CAST(null AS sql_identifier) AS ref_dtd_identifier

    FROM pg_namespace n, pg_class c, pg_type t

    WHERE n.oid = c.relnamespace
          AND t.typrelid = c.oid
          AND c.relkind = 'c'
          AND (pg_has_role(t.typowner, 'USAGE')
               OR has_type_privilege(t.oid, 'USAGE'));
```

## 前提知識

- **複合型**: 複数の列をまとめた、利用者が定義する型。表と同じ `pg_class` の行にも対応する。
- **`relkind = 'c'`**: `pg_class` の中で、複合型を表す種類の記号。
- **`has_type_privilege`**: 型に対する権限を調べる関数。
- **`CAST(null AS ...)`**: 標準の列の形を保つために、値を `NULL` にして型だけを合わせる書き方。

## 何をしているか

### 1. 名前を、標準の列の形で見せる

```sql:line-numbers=2438
    SELECT CAST(current_database() AS sql_identifier) AS user_defined_type_catalog,
           CAST(n.nspname AS sql_identifier) AS user_defined_type_schema,
           CAST(c.relname AS sql_identifier) AS user_defined_type_name,
           CAST('STRUCTURED' AS character_data) AS user_defined_type_category,
```

現在のデータベース名、スキーマ名、型の名前を、標準の型に合わせて出します。種類は `STRUCTURED` と固定です。

### 2. 使えない値は NULL にする

```sql:line-numbers=2442
           CAST('YES' AS yes_or_no) AS is_instantiable,
           CAST(null AS yes_or_no) AS is_final,
           CAST(null AS character_data) AS ordering_form,
           CAST(null AS character_data) AS ordering_category,
           CAST(null AS sql_identifier) AS ordering_routine_catalog,
           CAST(null AS sql_identifier) AS ordering_routine_schema,
           CAST(null AS sql_identifier) AS ordering_routine_name,
           CAST(null AS character_data) AS reference_type,
           CAST(null AS character_data) AS data_type,
           CAST(null AS cardinal_number) AS character_maximum_length,
           CAST(null AS cardinal_number) AS character_octet_length,
           CAST(null AS sql_identifier) AS character_set_catalog,
           CAST(null AS sql_identifier) AS character_set_schema,
           CAST(null AS sql_identifier) AS character_set_name,
           CAST(null AS sql_identifier) AS collation_catalog,
           CAST(null AS sql_identifier) AS collation_schema,
           CAST(null AS sql_identifier) AS collation_name,
           CAST(null AS cardinal_number) AS numeric_precision,
           CAST(null AS cardinal_number) AS numeric_precision_radix,
           CAST(null AS cardinal_number) AS numeric_scale,
           CAST(null AS cardinal_number) AS datetime_precision,
           CAST(null AS character_data) AS interval_type,
           CAST(null AS cardinal_number) AS interval_precision,
           CAST(null AS sql_identifier) AS source_dtd_identifier,
           CAST(null AS sql_identifier) AS ref_dtd_identifier
```

PostgreSQL では扱わない項目（順序の決め方や照合順序など）は、標準の列の形を保つため `NULL` にしています。列があっても中身が無いことで、他のツールとのつながりを保っています。

### 3. 見てよい型だけを残す

```sql:line-numbers=2470
    WHERE n.oid = c.relnamespace
          AND t.typrelid = c.oid
          AND c.relkind = 'c'
          AND (pg_has_role(t.typowner, 'USAGE')
               OR has_type_privilege(t.oid, 'USAGE'));
```

型の所有者に USAGE 権限があるか、または `has_type_privilege` で権限があるものだけを残します。

## ここがすごい

- **標準の形を崩さない**: 対応しない列も `NULL` で残すので、標準を前提にしたツールが壊れません。
- **権限の判断を二つの方法で行う**: 所有者か、権限の判定かのどちらかで見られるように、条件を組んでいます。
- **複合型を表の対応で探す**: `pg_class` の `relkind` で型を探すので、表と型の関係が見えてきます。

## まとめ

- 標準の形に合わせるときは、対応しない列を `NULL` で残す。
- 見せてよい対象は、所有者と権限の両方から判断する。
- 同じ実体の別の見方は、系統の表を結ぶと見つけられる。
