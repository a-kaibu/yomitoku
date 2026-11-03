---
title: "リカバリの進み具合を読む pg_stat_recovery"
description: "PostgreSQL の pg_stat_recovery ビュー。リカバリの状態を関数から取り出し、昇格の要求がある行だけを残して、再生した WAL の位置や時刻を見せる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1035, 1047]
function: "pg_stat_recovery"
difficulty: 2
tags: [ログ, 状態機械]
format: 2
---

## ひとことで

`pg_stat_recovery` は、サーバーがリカバリ（WAL の再生）を進めているときの状態を見せるビューです。どこまで再生したか、最後の処理がいつだったかなどを、1 行にまとめて読めます。

## コード

```sql:line-numbers=1035
CREATE VIEW pg_stat_recovery AS
    SELECT
            s.promote_triggered,
            s.last_replayed_read_lsn,
            s.last_replayed_end_lsn,
            s.last_replayed_tli,
            s.replay_end_lsn,
            s.replay_end_tli,
            s.recovery_last_xact_time,
            s.current_chunk_start_time,
            s.pause_state
    FROM pg_stat_get_recovery() s
    WHERE s.promote_triggered IS NOT NULL;
```

## 前提知識

- **WAL**: 変更の記録を先に書き残すログ。リカバリでは、このログを順に再生して状態を戻す。
- **LSN**: WAL の中の位置を表す番号。
- **TLI（タイムラインID）**: 復旧の経路を区別する番号。昇格のたびに変わる。
- **昇格（promote）**: 待機サーバーを、書き込みを受け付ける本番のサーバーに切り替えること。

## 何をしているか

### 1. 状態を関数から取り出す

```sql:line-numbers=1046
    FROM pg_stat_get_recovery() s
```

`FROM pg_stat_get_recovery() s` で、リカバリの状態を 1 行として受け取ります。

### 2. 昇格が要求された行だけを残す

```sql:line-numbers=1047
    WHERE s.promote_triggered IS NOT NULL;
```

`WHERE s.promote_triggered IS NOT NULL` は、昇格の要求に関する情報が入っている行だけを残す条件です。条件に当たらない状態では、このビューは行を返しません。

### 3. 位置と時刻を並べる

```sql:line-numbers=1038
            s.last_replayed_read_lsn,
            s.last_replayed_end_lsn,
```

`last_replayed_read_lsn` と `last_replayed_end_lsn` は、最後に読んだ位置と再生を終えた位置を表します。`recovery_last_xact_time` は、最後に再生したトランザクションの時刻です。

## ここがすごい

- **条件で意味のある行だけを残す**: 状態が不要なときは行を出さず、読み手に余計な情報を見せません。
- **位置と時刻を組で見せる**: LSN と時刻を並べると、どの地点まで進んだかを、2 つの見方で確かめられます。
- **状態を 1 つの関数に任せる**: ビューは列の名前と条件を決めるだけで、複雑な計算は関数の側にあります。

## まとめ

- 関数の返す状態を、条件で必要な行だけに絞る。
- 位置（LSN）と時刻を一緒に見ると、進み具合を正しく判断できる。
- ビューは、関数の結果を読みやすくする層として書かれている。
