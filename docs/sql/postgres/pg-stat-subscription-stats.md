---
title: "レプリケーションの競合件数を数える pg_stat_subscription_stats"
description: "PostgreSQL の pg_stat_subscription_stats ビュー。購読ごとに、適用エラーや競合の件数を集計関数から取り出して 1 行にまとめる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1552, 1569]
function: "pg_stat_subscription_stats"
difficulty: 3
tags: [並行処理, エラー処理]
format: 2
---

## ひとことで

`pg_stat_subscription_stats` は、論理レプリケーションの購読ごとに、エラーや競合がいくつ起きたかを見せるビューです。購読の一覧から名前を引き、その購読の統計を関数で取り出して、1 行にまとめます。

## コード

```sql:line-numbers=1552
CREATE VIEW pg_stat_subscription_stats AS
    SELECT
        ss.subid,
        s.subname,
        ss.apply_error_count,
        ss.sync_seq_error_count,
        ss.sync_table_error_count,
        ss.confl_insert_exists,
        ss.confl_update_origin_differs,
        ss.confl_update_exists,
        ss.confl_update_deleted,
        ss.confl_update_missing,
        ss.confl_delete_origin_differs,
        ss.confl_delete_missing,
        ss.confl_multiple_unique_conflicts,
        ss.stats_reset
    FROM pg_subscription as s,
         pg_stat_get_subscription_stats(s.oid) as ss;
```

## 前提知識

- **論理レプリケーション**: 変更内容を行単位で別のサーバーへ送り、そこで適用する仕組み。
- **購読（subscription）**: 受け取り側で、どの配信元からどのデータを受け取るかを決めた設定。
- **競合（conflict）**: 受け取った変更を適用するとき、ローカルの行と食い違うこと。
- **集合を返す関数**: 行の集まりを返す関数で、`FROM` 句に書いて使う。

## 何をしているか

### 1. 購読の一覧を取る

```sql:line-numbers=1568
    FROM pg_subscription as s,
```

`FROM pg_subscription as s` で、購読の一覧を取り出します。購読の名前は `s.subname` から読みます。

### 2. 購読ごとの統計を引く

```sql:line-numbers=1569
         pg_stat_get_subscription_stats(s.oid) as ss;
```

`pg_stat_get_subscription_stats(s.oid)` は、その購読の統計を 1 行で返す関数です。引数に `s.oid` を渡しているので、購読ごとに別の結果が得られます。

### 3. エラーと競合の件数を並べる

```sql:line-numbers=1556
        ss.apply_error_count,
        ss.sync_seq_error_count,
        ss.sync_table_error_count,
        ss.confl_insert_exists,
        ss.confl_update_origin_differs,
        ss.confl_update_exists,
        ss.confl_update_deleted,
        ss.confl_update_missing,
        ss.confl_delete_origin_differs,
        ss.confl_delete_missing,
        ss.confl_multiple_unique_conflicts,
```

`apply_error_count` は適用時のエラー数です。`confl_` で始まる列は、挿入、更新、削除の種類ごとに、どの競合が何件起きたかを表します。

## ここがすごい

- **関数の引数で結合を表す**: 購読の OID を関数に渡すだけで、結合の条件を明示せずに済みます。
- **競合の種類を細かく分ける**: 一つの数字にまとめず、どの種類の競合が多いかを見分けられます。
- **統計の終わった時点を残す**: `stats_reset` で、件数を数え始めた時刻が分かります。

## まとめ

- 関数を `FROM` 句で使うと、親の行ごとに結果を結び付けられる。
- 競合は種類ごとに数えると、原因の見当が付けやすい。
- 件数だけでなく、いつから数えたかも一緒に読む。
