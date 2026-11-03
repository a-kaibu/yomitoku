---
title: "ビューを作り直して列を増やす pg_buffercache"
description: "pg_buffercache の 1.6 から 1.7 への更新スクリプト。NUMA の列を加えるために、ビューを一度 DROP してから作り直し、権限を取り消して監視ロールだけに与える。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: contrib/pg_buffercache/pg_buffercache--1.6--1.7.sql
lines: [17, 19]
function: "pg_buffercache_os_pages"
difficulty: 3
tags: [設計パターン, 防御的プログラミング]
format: 2
---

## ひとことで

`pg_buffercache` は、共有バッファ（メモリ上のデータのキャッシュ）の中身を覗く拡張機能です。この更新スクリプトは、OS のページの情報を見せるビューを追加し、あとで NUMA（複数のメモリの領域）の列を加えるために、ビューを作り直しています。

## コード

```sql:line-numbers=17
CREATE VIEW pg_buffercache_os_pages AS
    SELECT bufferid, os_page_num
    FROM pg_buffercache_os_pages(false);
```

## 前提知識

- **拡張機能（extension）**: `CREATE EXTENSION` で導入する追加機能。`ALTER EXTENSION ... UPDATE` で、新しい版へ更新できる。
- **共有バッファ**: PostgreSQL がデータのブロックをメモリに置いておく場所。
- **NUMA**: 複数の CPU ごとにメモリが分かれている構成。どの領域にデータがあるかが性能に影響する。
- **`DROP VIEW` / `CREATE VIEW`**: ビューを削除してから作り直す。列の並びを変えたいときに必要になることがある。
- **`pg_monitor`**: 監視用の標準のロール。統計や内部状態を読む権限を持つ。

## 何をしているか

### 1. ビューを OS のページの情報として作る

関数 `pg_buffercache_os_pages(false)` の結果から、バッファの番号とページの番号を選ぶビューを作ります。

```sql:line-numbers=17
CREATE VIEW pg_buffercache_os_pages AS
    SELECT bufferid, os_page_num
    FROM pg_buffercache_os_pages(false);
```

引数の `false` は、NUMA の情報を含めないことを意味します。

### 2. NUMA を加えるために、ビューを作り直す

NUMA の列を加えるには、既存のビューの定義を変える必要があります。そこで、一度削除してから、引数に `true` を渡す形で作り直します。

```sql:line-numbers=22
DROP VIEW pg_buffercache_numa;
CREATE VIEW pg_buffercache_numa AS
    SELECT bufferid, os_page_num, numa_node
    FROM pg_buffercache_os_pages(true);
```

`CREATE OR REPLACE VIEW` は、列を途中に入れる変更を受け付けないため、`DROP` と `CREATE` の組み合わせを使っています。

### 3. 権限を絞る

作ったビューは、既定では全員に読めるので、まず全員向けの権限を取り消します。その後、`pg_monitor` のロールだけに読む権限を与えます。

このスクリプトの後半の `REVOKE` と `GRANT` が、その役割を担います。この部分は、バッファの中身の情報が、一般の利用者に見えないようにするためのものです。

## ここがすごい

- **拡張機能の更新をスクリプトで段階的に行う**: 旧版から新版へ、差分だけを書いた更新スクリプトで、既存の利用者の環境を壊さずに変えられます。
- **列を増やすための作り直し**: `DROP` と `CREATE` の順番を明示することで、変更の意図がはっきり残ります。
- **監視の権限を、専用のロールに限る**: 全員ではなく、監視の役割を持つロールだけに読ませる、という分け方です。
- **トレードオフ**: ビューを削除すると、それに依存する別のビューも影響を受けます。作り直すときは、依存の順番に注意が必要です。

## まとめ

- 列の構成を変えるビューは、`DROP` して作り直すことが必要になる場合がある。
- 拡張機能の更新は、差分のスクリプトで段階的に行うと安全。
- 内部の状態を見せるビューは、既定で権限を取り消し、必要なロールだけに与える。
