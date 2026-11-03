---
title: "メモリの割り当てを覗く pg_backend_memory_contexts"
description: "PostgreSQL の pg_backend_memory_contexts ビュー。関数の結果をそのまま見せ、PUBLIC の権限を取り消して pg_read_all_stats にだけ読ませる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [709, 713]
function: "pg_backend_memory_contexts"
difficulty: 2
tags: [メモリ管理, セキュリティ]
format: 2
---

## ひとことで

`pg_backend_memory_contexts` は、サーバーの各プロセスが使っているメモリの区画を見せるビューです。中身は、同じ名前の関数の結果をそのまま見せているだけです。ただし、誰でも読めるわけではないように、権限を絞っています。

## コード

```sql:line-numbers=709
CREATE VIEW pg_backend_memory_contexts AS
    SELECT * FROM pg_get_backend_memory_contexts();

REVOKE ALL ON pg_backend_memory_contexts FROM PUBLIC;
GRANT SELECT ON pg_backend_memory_contexts TO pg_read_all_stats;
```

## 前提知識

- **メモリコンテキスト**: PostgreSQL が内部でメモリを区画に分けて管理する仕組み。区画ごとに使った量を数えられる。
- **`PUBLIC`**: 全員を表す特別な役割。ここに権限を与えると、すべてのロールが使える。
- **`pg_read_all_stats`**: 統計の情報を読むための、定義済みのロール。
- **`REVOKE` と `GRANT`**: 権限を取り消すことと、与えることを表す命令。

## 何をしているか

### 1. 関数の結果を見せる

```sql:line-numbers=709
CREATE VIEW pg_backend_memory_contexts AS
    SELECT * FROM pg_get_backend_memory_contexts();
```

`SELECT * FROM pg_get_backend_memory_contexts()` は、関数が返す行をそのまま出します。ビューは、関数の呼び出しを名前で覆うだけの薄い層です。

### 2. 全員から権限を取り除く

```sql:line-numbers=712
REVOKE ALL ON pg_backend_memory_contexts FROM PUBLIC;
```

`REVOKE ALL ... FROM PUBLIC` で、すべてのロールからの読み取りを取り消します。ビューを作った直後は、誰でも読める状態になってしまうため、この一行で閉じます。

### 3. 統計を読む役割に許す

```sql:line-numbers=713
GRANT SELECT ON pg_backend_memory_contexts TO pg_read_all_stats;
```

`GRANT SELECT ... TO pg_read_all_stats` で、統計の情報を読むことを許された役割だけに読み取りを与えます。

## ここがすごい

- **関数の結果をビューに包む**: 利用者は `SELECT` 文だけで使え、関数を直接呼ぶ必要がありません。
- **作ったあとで権限を絞る**: 作成時の権限をそのまま信用せず、取り消してから必要な役割に与えています。
- **役割で権限を分ける**: 「全員」ではなく「統計を読む役割」に限ることで、運用者の権限を明示できます。

## まとめ

- 関数の結果は、ビューで読みやすく包める。
- 新しいビューは、まず `PUBLIC` からの権限を取り消す。
- 必要な権限は、定義済みの役割に限って与える。
