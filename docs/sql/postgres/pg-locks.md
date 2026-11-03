---
title: "取得中と待機中のロックを一覧にする pg_locks"
description: "PostgreSQL の pg_locks ビュー。pg_lock_status() の結果をそのまま見せ、どの処理がどのロックを持ち、どれを待っているかを一覧にする。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [439, 440]
function: "pg_locks"
difficulty: 2
tags: [並行処理, 状態機械]
format: 2
---

## ひとことで

`pg_locks` は、サーバーの中で今かかっているロックの一覧を見せるビューです。ロックとは、同じ表や行を複数の処理が同時に触るときに、順番を決めるための仕組みです。このビューを見ると、誰が何を待っているかを調べられます。

## コード

```sql:line-numbers=439
CREATE VIEW pg_locks AS
    SELECT * FROM pg_lock_status() AS L;
```

## 前提知識

- **ロック**: 複数の処理が同じものを同時に書き換えないように、順番を決める仕組み。
- **取得中と待機中**: ロックを持っている状態と、取れずに待っている状態のこと。
- **`pg_lock_status()`**: 今のロックの状態を、行の集まりで返す関数。
- **`AS L`**: `SELECT` の結果に付ける短い別名。

## 何をしているか

### 1. 関数の結果をそのまま見せる

```sql:line-numbers=439
CREATE VIEW pg_locks AS
    SELECT * FROM pg_lock_status() AS L;
```

`SELECT * FROM pg_lock_status()` は、関数が返す行をすべて出します。ビューの本体は、この 1 行だけです。

## ここがすごい

- **複雑な計算を関数に任せる**: ロックの状態を集める処理は関数の中にあり、ビューは名前を付けて見せるだけです。
- **表と同じように使える**: `WHERE` や `JOIN` で、ほかの統計と組み合わせて調べられます。
- **短いことが分かりやすさにつながる**: ビューの本体が 1 行なので、何を見せているかが一目で分かります。

## まとめ

- 関数の結果を `SELECT *` で包むと、表と同じように扱える。
- ロックの一覧は、待ちの原因を調べるための最初の手がかりになる。
- 本体が短いビューは、中身を関数に任せていると読める。
