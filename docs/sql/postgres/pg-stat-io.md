---
title: "読み書きの回数と時間を種類ごとに数える pg_stat_io"
description: "PostgreSQL の pg_stat_io ビュー。バックエンドの種類、対象、文脈ごとに、読み書き、延長、fsync の回数と時間を pg_stat_get_io() から並べて見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1261, 1283]
function: "pg_stat_io"
difficulty: 2
tags: [入出力, 数値計算]
format: 2
---

## ひとことで

`pg_stat_io` は、サーバーがディスクとのあいだで、どれだけ読み書きしたかを見せるビューです。どの種類のプロセスが、どの対象（表や WAL など）を、どんな文脈で扱ったかを、3 つの列で分けて数えています。

## コード

```sql:line-numbers=1261
CREATE VIEW pg_stat_io AS
SELECT
       b.backend_type,
       b.object,
       b.context,
       b.reads,
       b.read_bytes,
       b.read_time,
       b.writes,
       b.write_bytes,
       b.write_time,
       b.writebacks,
       b.writeback_time,
       b.extends,
       b.extend_bytes,
       b.extend_time,
       b.hits,
       b.evictions,
       b.reuses,
       b.fsyncs,
       b.fsync_time,
       b.stats_reset
FROM pg_stat_get_io() b;
```

## 前提知識

- **バックエンド**: クライアントの接続ごとに動くサーバーのプロセス。種類（`backend_type`）で役割が分かれる。
- **ディスク I/O**: ディスクの読み書き。メモリにある分は含まれない。
- **文脈（context）**: 読み書きが、通常の処理、大量読み込み、VACUUM などのどれに当たるかを表す区分。
- **`pg_stat_get_io()`**: 読み書きの統計を、行の集まりで返す関数。

## 何をしているか

### 1. 誰が、何に、どの文脈で行ったかを並べる

```sql:line-numbers=1263
       b.backend_type,
       b.object,
       b.context,
```

`backend_type`、`object`、`context` の 3 つで、統計の行を区別します。同じ読み書きでも、どの種類の処理かで分けて見られます。

### 2. 読み書きの回数と時間を見る

```sql:line-numbers=1266
       b.reads,
       b.read_bytes,
       b.read_time,
       b.writes,
       b.write_bytes,
       b.write_time,
       b.writebacks,
       b.writeback_time,
```

読み取り、書き込み、書き戻しのそれぞれについて、回数、バイト数、時間を並べています。時間の列があるので、どこで待ちが多いかを調べられます。

### 3. 延長と同期、メモリ内の命中を見る

```sql:line-numbers=1274
       b.extends,
       b.extend_bytes,
       b.extend_time,
       b.hits,
       b.evictions,
       b.reuses,
       b.fsyncs,
       b.fsync_time,
```

`hits` は、ディスクに行かずにメモリで済んだ数です。`evictions` と `reuses` は、ほかのデータを追い出したり、再利用したりした数です。`fsyncs` は同期の回数です。

## ここがすごい

- **三つの軸で切り分ける**: 誰が、何を、どの文脈でという組み合わせで、負荷の原因を絞り込めます。
- **回数と時間を並べる**: 回数だけでは見えない遅さを、時間の列で補っています。
- **メモリの命中も同じ表で見る**: ディスクに行った分と、メモリで済んだ分を比べられます。

## まとめ

- 統計は、主体、対象、文脈の 3 つで切り分けると原因を追いやすい。
- 回数と時間を並べると、多さと遅さを別々に判断できる。
- メモリで済んだ数も見ると、キャッシュの効き具合が分かる。
