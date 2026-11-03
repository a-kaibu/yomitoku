---
title: "NOT NULL を CHECK に分類する table_constraints"
description: "information_schema.table_constraints。内部の制約の種類の 1 文字を SQL 標準の名前に変え、NOT NULL を CHECK として分類し、延期可能かどうかを YES と NO で表す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [1836, 1847]
function: "table_constraints"
difficulty: 2
tags: [型システム, 可読性]
format: 2
---

## ひとことで

`table_constraints` は、テーブルに付いている制約（主キー、一意制約、外部キー、チェックなど）を一覧するビューです。内部の 1 文字の記号を、SQL 標準の名前に変換します。PostgreSQL 独自の NOT NULL は、標準の分類に合わせて `CHECK` として見せています。

## コード

```sql:line-numbers=1836
           CAST(
             CASE c.contype WHEN 'c' THEN 'CHECK'
                            WHEN 'n' THEN 'CHECK'
                            WHEN 'f' THEN 'FOREIGN KEY'
                            WHEN 'p' THEN 'PRIMARY KEY'
                            WHEN 'u' THEN 'UNIQUE' END
             AS character_data) AS constraint_type,
           CAST(CASE WHEN c.condeferrable THEN 'YES' ELSE 'NO' END AS yes_or_no)
             AS is_deferrable,
           CAST(CASE WHEN c.condeferred THEN 'YES' ELSE 'NO' END AS yes_or_no)
             AS initially_deferred,
           CAST(CASE WHEN c.conenforced THEN 'YES' ELSE 'NO' END AS yes_or_no) AS enforced,
```

## 前提知識

- **制約（constraint）**: 表の値に課す条件。`PRIMARY KEY`、`UNIQUE`、`FOREIGN KEY`、`CHECK`、`NOT NULL` などがある。
- **`contype`**: 制約の種類を表す 1 文字。`'p'` が主キー、`'u'` が一意制約、`'f'` が外部キー、`'c'` が CHECK、`'n'` が NOT NULL。
- **遅延制約（deferrable）**: 制約のチェックを、トランザクションの終わりまで先送りできる制約。
- **`condeferred`**: 最初からチェックを先送りする設定かどうか。
- **`CAST(... AS yes_or_no)`**: 真偽値を、標準で定義された `YES` と `NO` の文字に変える型。

## 何をしているか

### 1. 制約の種類を標準の名前にする

`CASE` が、内部の 1 文字の記号を、SQL 標準の制約の名前に変えます。

```sql:line-numbers=1837
             CASE c.contype WHEN 'c' THEN 'CHECK'
                            WHEN 'n' THEN 'CHECK'
                            WHEN 'f' THEN 'FOREIGN KEY'
                            WHEN 'p' THEN 'PRIMARY KEY'
                            WHEN 'u' THEN 'UNIQUE' END
```

`'n'`（NOT NULL）が `CHECK` に入っている点が特徴です。標準では、NOT NULL は CHECK の一種として扱われるので、その定義に合わせています。

### 2. 遅延と適用の状態を YES と NO で表す

3 つの列は、どれも真偽値を `YES` と `NO` の文字に変えて見せます。

```sql:line-numbers=1843
           CAST(CASE WHEN c.condeferrable THEN 'YES' ELSE 'NO' END AS yes_or_no)
             AS is_deferrable,
           CAST(CASE WHEN c.condeferred THEN 'YES' ELSE 'NO' END AS yes_or_no)
             AS initially_deferred,
           CAST(CASE WHEN c.conenforced THEN 'YES' ELSE 'NO' END AS yes_or_no) AS enforced,
```

`condeferrable` は遅延できるか、`condeferred` は最初から遅延しているか、`conenforced` は有効かを表します。`enforced` は、PostgreSQL の新しい版で追加された、制約を有効にするかどうかの設定です。

## ここがすごい

- **内部の分類を標準に合わせる**: 独自の分類を、標準の名前に寄せることで、他のデータベースのツールとも話が通じます。
- **真偽値を標準の表現にする**: `true` と `false` ではなく `YES` と `NO` で返すので、古い標準に沿ったツールがそのまま読めます。
- **同じ形の `CASE` を繰り返す**: 3 つの真偽値の変換を同じ形で書いているので、読むときに迷いません。
- **トレードオフ**: NOT NULL と CHECK を同じ列で扱うので、両者の区別が必要な場合は `pg_constraint` を直接読む必要があります。

## まとめ

- 内部の分類を標準の名前に揃えると、他のツールとの互換性が上がる。
- 標準で定めた表現（`YES` と `NO`）に合わせると、古いツールも読める。
- 同じ形の変換を繰り返すと、全体の意図が読みやすくなる。
