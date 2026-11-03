---
title: "共有メモリの割り当てを一覧にする pg_shmem_allocations"
description: "PostgreSQL の pg_shmem_allocations ビュー。サーバーの共有メモリの割り当てを関数から取り出し、PUBLIC から権限を取り消して pg_read_all_stats に読ませる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [691, 695]
function: "pg_shmem_allocations"
difficulty: 2
tags: [メモリ管理, 低レイヤ]
format: 2
---

## ひとことで

`pg_shmem_allocations` は、サーバー全体で共有しているメモリが、どの部品にどれだけ割り当てられているかを見せるビューです。共有メモリは、すべてのプロセスが同じ場所を使うための領域です。

## コード

```sql:line-numbers=691
CREATE VIEW pg_shmem_allocations AS
    SELECT * FROM pg_get_shmem_allocations();

REVOKE ALL ON pg_shmem_allocations FROM PUBLIC;
GRANT SELECT ON pg_shmem_allocations TO pg_read_all_stats;
```

## 前提知識

- **共有メモリ**: サーバーのプロセスが、同じ内容を読み書きするためのメモリ領域。
- **`PUBLIC`**: 全員を表す特別な役割。
- **`pg_read_all_stats`**: 統計情報を読むための定義済みの役割。
- **関数を包むビュー**: `SELECT * FROM 関数()` の結果を、表のように名前で読めるようにした形。

## 何をしているか

### 1. 関数の結果を読む

```sql:line-numbers=691
CREATE VIEW pg_shmem_allocations AS
    SELECT * FROM pg_get_shmem_allocations();
```

`SELECT * FROM pg_get_shmem_allocations()` は、部品ごとの名前と割り当てのサイズを行として返します。

### 2. 権限を閉じてから開く

```sql:line-numbers=694
REVOKE ALL ON pg_shmem_allocations FROM PUBLIC;
GRANT SELECT ON pg_shmem_allocations TO pg_read_all_stats;
```

`REVOKE ALL ... FROM PUBLIC` で、まず全員の権限を取り消します。そのあと `GRANT SELECT ... TO pg_read_all_stats` で、統計を読む役割にだけ読み取りを与えます。

### 3. 同じ形の兄弟を作る

直後の `pg_shmem_allocations_numa` も、同じ手順で作られています。NUMA の構成ごとに分けた結果を、別のビューとして見せています。

## ここがすごい

- **同じ型の部品を繰り返す**: ビューを作る、権限を閉じる、必要な役割に開く、という手順が揃っています。読み手は一つ覚えれば他も読めます。
- **既定の状態を信用しない**: 権限を明示的に取り消してから与えるので、設定の見落としが起きにくい構えです。
- **低レイヤの情報を安全に見せる**: 内部の数字を、運用者だけが読める形にしています。

## まとめ

- 関数の結果は、ビューで表のように読める。
- 権限は `REVOKE` で閉じてから、`GRANT` で必要な役割に開く。
- 同じ型のビューは、同じ書き方で揃えると読みやすい。
