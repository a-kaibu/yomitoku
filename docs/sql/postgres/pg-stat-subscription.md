---
title: "購読者の状態を LEFT JOIN で全部並べる"
description: "pg_stat_subscription は、論理レプリケーションの購読（subscription）の状態を一覧するビュー。購読の一覧を起点にし、動いているワーカーの情報を LEFT JOIN で付ける。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1063, 1078]
function: "pg_stat_subscription"
difficulty: 2
tags: [並行処理, API設計]
format: 2
---

## ひとことで

`pg_stat_subscription` は、論理レプリケーションの購読側の状態を一覧するビューです。購読の設定の一覧を起点にして、実際に動いているワーカーの情報を後から付けます。そのため、ワーカーが止まっている購読も一覧から消えません。

## コード

```sql:line-numbers=1063
CREATE VIEW pg_stat_subscription AS
    SELECT
            su.oid AS subid,
            su.subname,
            st.worker_type,
            st.pid,
            st.leader_pid,
            st.relid,
            st.received_lsn,
            st.last_msg_send_time,
            st.last_msg_receipt_time,
            st.latest_end_lsn,
            st.latest_end_time
    FROM pg_subscription su
            LEFT JOIN pg_stat_get_subscription(NULL) st
                      ON (st.subid = su.oid);
```

## 前提知識

- **購読（subscription）**: 別のサーバーの公開（publication）を受け取る設定。
- **ワーカー（worker）**: 購読のデータを受け取り、適用するプロセス。テーブルごとに分かれることがある。
- **`LEFT JOIN`**: 左の行を必ず残し、一致する行がなければ右の列を `NULL` にする結合。
- **`pg_subscription`**: 購読の設定を持つ内部テーブル。
- **`leader_pid`**: 並列に動くワーカーが、どのプロセスから生まれたかを表す番号。

## 何をしているか

### 1. 購読の一覧を起点にする

`pg_subscription` の行を、そのまま出発点にします。購読の名前と番号を、外側の列として並べます。

```sql:line-numbers=1065
            su.oid AS subid,
            su.subname,
```

### 2. 動いているワーカーの情報を結ぶ

動いているワーカーの情報は、関数 `pg_stat_get_subscription(NULL)` から取ります。その結果を、購読の番号で結びます。

```sql:line-numbers=1067
            st.worker_type,
            st.pid,
            st.leader_pid,
            st.relid,
```

`LEFT JOIN` にしているので、ワーカーが動いていない購読も、行として残ります。その場合、`pid` や `received_lsn` は `NULL` になります。

### 3. 受け取りの位置と時刻を並べる

最後に、受け取った位置、送信や受信の時刻などを並べます。

```sql:line-numbers=1071
            st.received_lsn,
            st.last_msg_send_time,
            st.last_msg_receipt_time,
            st.latest_end_lsn,
            st.latest_end_time
```

## ここがすごい

- **設定の一覧を起点にする**: 「設定はあるのに動いていない」という状態を、そのまま見つけられます。
- **`NULL` を状態として使う**: ワーカーが無いことを、別の印ではなく `NULL` で表しています。
- **複数のワーカーを 1 行に扱える**: テーブルごとのワーカーがあっても、`leader_pid` などで親子の関係を見られます。
- **トレードオフ**: 購読の数が多く、ワーカーが動いていないものが大半のときは、一覧が「空の行」だらけになります。目的に応じて絞り込む必要があります。

## まとめ

- 設定の一覧と動いている状態を見たいときは、設定側を起点に `LEFT JOIN` する。
- 動いていないことは `NULL` で表すと、判定が簡単になる。
- 親子のプロセスは番号で結ぶと、全体の関係をたどれる。
