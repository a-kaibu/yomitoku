---
title: "受信プロセスの状態を、動いているときだけ見せる"
description: "pg_stat_wal_receiver は、待機用サーバーが親から WAL を受け取っている状態の一覧。関数が返す空の行を WHERE pid IS NOT NULL で除く。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1015, 1033]
function: "pg_stat_wal_receiver"
difficulty: 2
tags: [並行処理, API設計]
format: 2
---

## ひとことで

`pg_stat_wal_receiver` は、待機用のサーバーが、親のサーバーから WAL を受け取っている状態を見せるビューです。受け取りのプロセスが動いていないときは行を出さない、という形になっています。

## コード

```sql:line-numbers=1015
CREATE VIEW pg_stat_wal_receiver AS
    SELECT
            s.pid,
            s.status,
            s.receive_start_lsn,
            s.receive_start_tli,
            s.written_lsn,
            s.flushed_lsn,
            s.received_tli,
            s.last_msg_send_time,
            s.last_msg_receipt_time,
            s.latest_end_lsn,
            s.latest_end_time,
            s.slot_name,
            s.sender_host,
            s.sender_port,
            s.conninfo
    FROM pg_stat_get_wal_receiver() s
    WHERE s.pid IS NOT NULL;
```

## 前提知識

- **スタンバイ（待機用サーバー）**: 親のサーバーの変更を受け取り、同じ内容を保つサーバー。
- **WAL receiver**: スタンバイ側で、親から WAL を受け取るプロセス。
- **`pid IS NOT NULL`**: プロセスの番号があるかどうかを調べる条件。動いているプロセスには番号がある。
- **LSN**: WAL の中の位置を表す番号。受け取った位置などを比べられる。
- **`pg_stat_get_wal_receiver()`**: 受け取りの状態を返す関数。

## 何をしているか

### 1. 関数の結果を、そのまま列として並べる

受け取りの状態は、関数が 1 つの行として返します。このビューは、その列をほぼそのまま見せます。

```sql:line-numbers=1016
    SELECT
            s.pid,
            s.status,
            s.receive_start_lsn,
            s.receive_start_tli,
            s.written_lsn,
            s.flushed_lsn,
            s.received_tli,
            s.last_msg_send_time,
            s.last_msg_receipt_time,
            s.latest_end_lsn,
            s.latest_end_time,
            s.slot_name,
            s.sender_host,
            s.sender_port,
            s.conninfo
```

`receive_start_lsn` は受け取りを始めた位置、`written_lsn` は書き込んだ位置、`flushed_lsn` はディスクに確実に書いた位置です。`latest_end_lsn` は親の側の最新の位置を表します。

### 2. プロセスが動いている行だけを残す

最後の `WHERE` で、番号（`pid`）が無い行を除きます。

```sql:line-numbers=1032
    FROM pg_stat_get_wal_receiver() s
    WHERE s.pid IS NOT NULL;
```

受け取りのプロセスが止まっているとき、関数は空の状態の行を返すことがあります。その行は `pid` が `NULL` なので、この条件で消えます。

## ここがすごい

- **空の状態を、一覧から外せる**: 「動いていない」ことを、番号が無いという 1 つの条件で判定しています。
- **位置を段階ごとに見せる**: 受け取り、書き込み、反映の位置を分けて持つので、どこで遅れているかを追えます。
- **接続先の情報も含める**: `sender_host` や `conninfo` を見せて、どの親とつながっているかを確かめられます。
- **トレードオフ**: `conninfo` には接続の設定が含まれます。パスワードを含まない形で保存されているか、公開範囲を確かめる必要があります。

## まとめ

- 動いているものだけを見せたいときは、プロセスの番号の有無で絞れる。
- 位置は段階ごとに分けて見ると、遅れの場所が分かる。
- 接続の情報は、公開してよい範囲かを意識して扱う。
