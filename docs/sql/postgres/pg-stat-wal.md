---
title: "WAL の書き込みの統計を見る pg_stat_wal"
description: "PostgreSQL の pg_stat_wal ビュー。WAL のレコード数、全ページ書き込みの数、バイト数、バッファが一杯になった回数を、pg_stat_get_wal() から一行にまとめる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1297, 1305]
function: "pg_stat_wal"
difficulty: 1
tags: [ログ, 入出力]
format: 2
---

## ひとことで

`pg_stat_wal` は、WAL（先に書き残すログ）が、どれだけ書かれたかを見せるビューです。レコードの数、バイト数、ページ全体を書いた回数などを、一行にまとめています。

## コード

```sql:line-numbers=1297
CREATE VIEW pg_stat_wal AS
    SELECT
        w.wal_records,
        w.wal_fpi,
        w.wal_bytes,
        w.wal_fpi_bytes,
        w.wal_buffers_full,
        w.stats_reset
    FROM pg_stat_get_wal() w;
```

## 前提知識

- **WAL のレコード**: 変更の内容を一件ずつ書いたログの単位。
- **全ページ書き込み（FPI）**: ページ全体をログに書き込むこと。チェックポイント後の最初の変更などで起きる。
- **WAL バッファ**: WAL を一時的に溜めておく、メモリ上の領域。
- **`stats_reset`**: 統計を最後にリセットした時刻。

## 何をしているか

### 1. レコードとページ全体の数を見る

```sql:line-numbers=1299
        w.wal_records,
        w.wal_fpi,
        w.wal_bytes,
        w.wal_fpi_bytes,
```

`wal_records` はレコードの数、`wal_fpi` はページ全体を書いた回数です。`wal_bytes` と `wal_fpi_bytes` は、その分のバイト数です。

### 2. バッファの溢れと、リセットの時刻を見る

```sql:line-numbers=1303
        w.wal_buffers_full,
        w.stats_reset
```

`wal_buffers_full` は、WAL のバッファが一杯になって、すぐ書き出した回数です。`stats_reset` を見ると、いつからの数かが分かります。

## ここがすごい

- **量と回数を組で見る**: レコードの数とバイト数を並べると、一件あたりの大きさが分かります。
- **全ページ書き込みを分けて数える**: 通常のレコードと分けて見られるので、書き込み量が増えた理由を追えます。
- **期間の基準を明示する**: リセットの時刻を一緒に出して、数字の範囲を読み手に伝えています。

## まとめ

- 量は、件数とバイト数を並べると一件の大きさが分かる。
- 特別な書き込みは、別の数として分けると原因を追いやすい。
- 統計の数字は、いつからの数かを一緒に見ると誤読を防げる。
