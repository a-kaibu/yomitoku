---
title: "制約が使われている表を、キーの種類で絞る"
description: "information_schema.constraint_table_usage。外部キーが参照する表と、主キーや一意制約が付いた表を、pg_constraint の種類 contype の組み合わせで集める。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [871, 886]
function: "constraint_table_usage"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`constraint_table_usage` は、制約が付いている表の一覧です。外部キーが指している先の表と、主キーや一意制約が付いている表を、1 つの一覧にまとめます。どの表がどの制約に関わっているかを調べるときに使います。

## コード

```sql:line-numbers=871
CREATE VIEW constraint_table_usage AS
    SELECT CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nr.nspname AS sql_identifier) AS table_schema,
           CAST(r.relname AS sql_identifier) AS table_name,
           CAST(current_database() AS sql_identifier) AS constraint_catalog,
           CAST(nc.nspname AS sql_identifier) AS constraint_schema,
           CAST(c.conname AS sql_identifier) AS constraint_name

    FROM pg_constraint c, pg_namespace nc,
         pg_class r, pg_namespace nr

    WHERE c.connamespace = nc.oid AND r.relnamespace = nr.oid
          AND ( (c.contype = 'f' AND c.confrelid = r.oid)
             OR (c.contype IN ('p', 'u') AND c.conrelid = r.oid) )
          AND r.relkind IN ('r', 'p')
          AND pg_has_role(r.relowner, 'USAGE');
```

## 前提知識

- **`pg_constraint`**: 制約の情報を持つ内部テーブル。`contype` が種類を表す（`'f'` は外部キー、`'p'` は主キー、`'u'` は一意制約）。
- **`confrelid`**: 外部キーが参照する先の表の番号。
- **`conrelid`**: 制約が付いている表の番号。
- **`OR` と括弧**: 複数の条件のどれかが成り立つ行を集める書き方。括弧で、どの条件をまとめるかを明示する。
- **`IN (...)`**: 値がリストのどれかに一致するかを調べる条件。

## 何をしているか

### 1. 制約と、関係する 2 つの名前空間を結ぶ

制約の情報（`c`）に、制約のスキーマ（`nc`）、表（`r`）、表のスキーマ（`nr`）を結びます。

```sql:line-numbers=872
    SELECT CAST(current_database() AS sql_identifier) AS table_catalog,
           CAST(nr.nspname AS sql_identifier) AS table_schema,
           CAST(r.relname AS sql_identifier) AS table_name,
           CAST(current_database() AS sql_identifier) AS constraint_catalog,
           CAST(nc.nspname AS sql_identifier) AS constraint_schema,
           CAST(c.conname AS sql_identifier) AS constraint_name

    FROM pg_constraint c, pg_namespace nc,
         pg_class r, pg_namespace nr

```

ここでは、制約の所属と、表の所属をそれぞれ確かめています。

### 2. 外部キーの参照先か、キーを持つ表かを判定する

2 つの条件を `OR` でつなぎ、括弧でまとめています。

```sql:line-numbers=883
          AND ( (c.contype = 'f' AND c.confrelid = r.oid)
             OR (c.contype IN ('p', 'u') AND c.conrelid = r.oid) )
```

- 外部キー（`'f'`）の場合は、`confrelid` が表そのものを指すとき、その表を参照先として含めます。
- 主キーか一意制約（`'p'` か `'u'`）の場合は、`conrelid` が表そのものを指すとき、その表を含めます。

### 3. 表の種類と権限で絞る

最後に、通常の表やパーティションの表だけを残し、持ち主の権限がある行だけを見せます。

```sql:line-numbers=885
          AND r.relkind IN ('r', 'p')
          AND pg_has_role(r.relowner, 'USAGE');
```

## ここがすごい

- **種類ごとに参照の向きを変える**: 外部キーは「参照される先」、主キーや一意制約は「キーを持つ表」と、同じ制約でも意味が違うことを、条件の形で表しています。
- **`OR` の中を括弧でまとめる**: 2 つの条件の組と、表の種類、権限の条件を、正しい優先順位で結ぶために括弧が使われています。
- **権限を最後に確かめる**: 見てよい表だけが、一覧に残ります。
- **トレードオフ**: 同じ表が複数の制約に関わると、重複した行が出ることがあります。必要に応じて `DISTINCT` を使うことを検討します。

## まとめ

- 同じ種類の制約でも、外部キーと主キーでは、どの表を指すかが違う。
- `OR` の条件は、括弧で優先順位を明示すると、読み間違いを防げる。
- 権限の判定は、見せる範囲を決める最後の条件として置く。
