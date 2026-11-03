---
title: "統計の種類ごとの情報を一覧にする pg_stat_kind_info"
description: "PostgreSQL の pg_stat_kind_info ビュー。統計の種類ごとに、名前、組み込みかどうか、固定の大きさかなどの性質と、保存されている項目の数を pg_stat_get_kind_info() から見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1285, 1295]
function: "pg_stat_kind_info"
difficulty: 1
tags: [API設計, データ構造]
format: 2
---

## ひとことで

`pg_stat_kind_info` は、PostgreSQL が集めている統計の種類を、一覧で見せるビューです。種類ごとに、名前、組み込みかどうか、大きさが固定かどうかといった性質が分かります。

## コード

```sql:line-numbers=1285
CREATE VIEW pg_stat_kind_info AS
    SELECT
        k.id,
        k.name,
        k.builtin,
        k.fixed_amount,
        k.accessed_across_databases,
        k.write_to_file,
        k.own_hash,
        k.entry_count
    FROM pg_stat_get_kind_info() k;
```

## 前提知識

- **統計の種類（kind）**: テーブルごとの統計、関数ごとの統計など、用途で分けた統計の単位。
- **固定の大きさ（fixed_amount）**: 統計の項目の数が、最初から決まっているかどうか。
- **`own_hash`**: 種類ごとに、独自の検索の仕組みを持つかどうか。
- **`pg_stat_get_kind_info()`**: 統計の種類の情報を、行の集まりで返す関数。

## 何をしているか

### 1. 種類の名前と識別子を見せる

```sql:line-numbers=1287
        k.id,
        k.name,
        k.builtin,
```

`id` は種類の番号、`name` は種類の名前、`builtin` は PostgreSQL に最初から組み込まれているかを表します。

### 2. 種類の性質を見せる

```sql:line-numbers=1290
        k.fixed_amount,
        k.accessed_across_databases,
        k.write_to_file,
        k.own_hash,
        k.entry_count
```

`fixed_amount`、`accessed_across_databases`、`write_to_file`、`own_hash` は、その統計がどう扱われるかの性質です。`entry_count` は、今いくつの項目が保存されているかを表します。

## ここがすごい

- **仕組みを表で見られる**: 内部でどの統計がどう扱われるかを、一覧で確かめられます。
- **性質を列にする**: 種類ごとの違いを、真偽の列として並べているので、比べやすくなっています。
- **関数の結果を変えずに見せる**: ビューは列の名前を付けるだけで、中身の仕組みは関数に任せています。

## まとめ

- 内部の種類は、一覧にすると仕組みを把握しやすい。
- 性質は、真偽の列として並べると比べやすい。
- 項目の数のような動く値も、同じ表に入れると全体が見える。
