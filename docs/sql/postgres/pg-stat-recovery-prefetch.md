---
title: "リカバリ中の先読みの効き具合を見る pg_stat_recovery_prefetch"
description: "PostgreSQL の pg_stat_recovery_prefetch ビュー。リカバリ中の先読みの回数、命中、スキップの理由ごとの回数、WAL とブロックの距離を pg_stat_get_recovery_prefetch() から並べる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1049, 1061]
function: "pg_stat_recovery_prefetch"
difficulty: 2
tags: [ログ, 入出力]
format: 2
---

## ひとことで

`pg_stat_recovery_prefetch` は、リカバリ（WAL の再生）の途中で、データのブロックを先に読み込んでおく「先読み」の働きを見せるビューです。先読みが当たったか、どんな理由で飛ばしたかを、数で確かめられます。

## コード

```sql:line-numbers=1049
CREATE VIEW pg_stat_recovery_prefetch AS
    SELECT
            s.stats_reset,
            s.prefetch,
            s.hit,
            s.skip_init,
            s.skip_new,
            s.skip_fpw,
            s.skip_rep,
            s.wal_distance,
            s.block_distance,
            s.io_depth
     FROM pg_stat_get_recovery_prefetch() s;
```

## 前提知識

- **リカバリ**: WAL を再生して、データベースの状態を元に戻す処理。
- **先読み（prefetch）**: まだ必要になっていないブロックを、前もって読み込んでおく仕組み。
- **WAL の距離**: 先読みがどれだけ先の WAL まで届いているかを表す距離。
- **`io_depth`**: 同時に進めている読み込みの深さ。

## 何をしているか

### 1. 先読みの回数を見る

```sql:line-numbers=1052
            s.prefetch,
            s.hit,
```

`prefetch` は先読みをした回数、`hit` は先読みが実際に役立った回数です。両方を比べると、先読みの効き具合が分かります。

### 2. 飛ばした理由を見る

```sql:line-numbers=1054
            s.skip_init,
            s.skip_new,
            s.skip_fpw,
            s.skip_rep,
```

`skip_init`、`skip_new`、`skip_fpw`、`skip_rep` は、先読みを飛ばした理由ごとの回数です。理由が分かれているので、なぜ効かないのかを絞り込めます。

### 3. 先読みの距離を見る

```sql:line-numbers=1058
            s.wal_distance,
            s.block_distance,
            s.io_depth
```

`wal_distance` と `block_distance` は、先読みがどこまで先を見ているかを表します。`io_depth` は、同時に進んでいる読み込みの深さです。

## ここがすごい

- **理由を分けて数える**: 効かなかった理由を一つの数にまとめず、種類ごとに残しています。
- **効果と距離を一緒に見る**: 先読みの回数だけでなく、どこまで先を読んでいるかも分かります。
- **関数の結果をそのまま見せる**: 状態は関数が作り、ビューは列の名前を付けて見せるだけです。

## まとめ

- 先読みの効きは、当たった数と、飛ばした理由を並べて判断する。
- 数の意味は、距離と深さを合わせて読むと分かりやすい。
- 統計の列は、関数の結果を名前付きで見せると扱いやすい。
