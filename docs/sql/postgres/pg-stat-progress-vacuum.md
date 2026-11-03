---
title: "VACUUM の進み具合を段階の名前で見せる"
description: "pg_stat_progress_vacuum は、実行中の VACUUM の進捗を一覧するビュー。内部の番号を CASE で「scanning heap」などの段階名にし、遅延時間の単位も変換する。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1336, 1343]
function: "pg_stat_progress_vacuum"
difficulty: 2
tags: [状態機械, API設計]
format: 2
---

## ひとことで

`pg_stat_progress_vacuum` は、いま実行中の `VACUUM`（不要な行の掃除）が、どの段階にいるかを見せるビューです。サーバーの内部では、段階を番号で持っているので、それを `scanning heap`（表を読んでいる）などの言葉に変えています。

## コード

```sql:line-numbers=1336
        CASE S.param1 WHEN 0 THEN 'initializing'
                      WHEN 1 THEN 'scanning heap'
                      WHEN 2 THEN 'vacuuming indexes'
                      WHEN 3 THEN 'vacuuming heap'
                      WHEN 4 THEN 'cleaning up indexes'
                      WHEN 5 THEN 'truncating heap'
                      WHEN 6 THEN 'performing final cleanup'
                      END AS phase,
```

## 前提知識

- **VACUUM**: 更新や削除で不要になった行の領域を回収する作業。自動でも実行される。
- **進捗（progress）**: 長い処理が、全体のどこまで進んだかを表す情報。
- **`CASE 値 WHEN ... THEN ... END`**: 1 つの値を見て、対応する言葉を返す書き方。
- **`S.param1` などの列**: 進捗の情報を、番号で並べて保存しておいた汎用の欄。処理の種類ごとに、意味が決まっている。
- **`::double precision`**: 値を倍精度の小数に変換する書き方。

## 何をしているか

### 1. 段階の番号を言葉にする

`param1` には、VACUUM がいま何をしているかの番号が入っています。`CASE` で、0 から 6 までを、段階の名前に変えています。

```sql:line-numbers=1336
        CASE S.param1 WHEN 0 THEN 'initializing'
                      WHEN 1 THEN 'scanning heap'
                      WHEN 2 THEN 'vacuuming indexes'
                      WHEN 3 THEN 'vacuuming heap'
                      WHEN 4 THEN 'cleaning up indexes'
                      WHEN 5 THEN 'truncating heap'
                      WHEN 6 THEN 'performing final cleanup'
                      END AS phase,
```

`ELSE` が無いので、知らない番号の場合は `NULL` になります。

### 2. 数値の欄に名前を付ける

作業量の欄は、`heap_blks_total` のように、中身の意味が分かる名前で見せます。

```sql:line-numbers=1344
        S.param2 AS heap_blks_total, S.param3 AS heap_blks_scanned,
        S.param4 AS heap_blks_vacuumed, S.param5 AS index_vacuum_count,
        S.param6 AS max_dead_tuple_bytes, S.param7 AS dead_tuple_bytes,
        S.param8 AS num_dead_item_ids, S.param9 AS indexes_total,
        S.param10 AS indexes_processed,
```

### 3. 単位を変換する

遅延の時間は、内部ではマイクロ秒の単位で保存されています。それを秒に変えるために、1000000 で割っています。

```sql:line-numbers=1349
        S.param11 / 1000000::double precision AS delay_time,
```

`S.param11 / 1000000::double precision` の `::` は、割り算より先に型を変換します。そのため、整数どうしの割り算にならず、小数の結果が得られます。

### 4. 開始の理由を言葉にする

同じように、`mode` と `started_by` も番号を言葉に変えています。

```sql:line-numbers=1350
        CASE S.param12 WHEN 1 THEN 'normal'
                       WHEN 2 THEN 'aggressive'
                       WHEN 3 THEN 'failsafe'
                       ELSE NULL END AS mode,
        CASE S.param13 WHEN 1 THEN 'manual'
                       WHEN 2 THEN 'autovacuum'
                       WHEN 3 THEN 'autovacuum_wraparound'
                       ELSE NULL END AS started_by,
```

`mode` が `aggressive` なら、凍結（古い行の印）の掃除を強めに行っている状態です。`started_by` は、手動か自動かを表します。

### 5. データベース名を付ける

最後に、データベースの番号から名前を引きます。

```sql:line-numbers=1361
    FROM pg_stat_get_progress_info('VACUUM') AS S
        LEFT JOIN pg_database D ON S.datid = D.oid;
```

## ここがすごい

- **番号で保存し、ビューで言葉にする**: 進捗の処理は軽く、表示だけをビューで整えています。内部の処理に余計な負担をかけません。
- **`ELSE NULL` と `NULL` の使い分け**: 想定外の番号は `NULL` にして、誤った段階を表示しないようにしています。
- **単位の変換を 1 か所に寄せる**: 利用者は秒の値を直接読めて、マイクロ秒を覚えなくてよくなります。
- **トレードオフ**: 段階の番号と言葉の対応は、サーバーの実装と一緒に更新する必要があります。番号の意味が変わると、ビューの読み方も変わります。

## まとめ

- 内部の番号は、`CASE` で段階の名前に変えると、進み具合が分かりやすくなる。
- 単位の変換は、型の書き方の優先順位に注意して書く。
- 想定外の値を `NULL` で表すと、誤った表示を避けられる。
