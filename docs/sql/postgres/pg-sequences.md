---
title: "シーケンスの設定と現在値をまとめて見せる"
description: "pg_sequences は、シーケンスの開始値や増分、最後の値を一覧するビュー。内部の型の番号を regtype で型名にし、他のセッションの一時シーケンスは隠す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [172, 188]
function: "pg_sequences"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`pg_sequences` は、連番を作るシーケンスの一覧ビューです。開始値、増分、上限、下限、キャッシュの数、そして最後に使われた値を見せます。型の番号を型名に直したり、他人の一時シーケンスを隠したりする工夫があります。

## コード

```sql:line-numbers=172
CREATE VIEW pg_sequences AS
    SELECT
        N.nspname AS schemaname,
        C.relname AS sequencename,
        pg_get_userbyid(C.relowner) AS sequenceowner,
        S.seqtypid::regtype AS data_type,
        S.seqstart AS start_value,
        S.seqmin AS min_value,
        S.seqmax AS max_value,
        S.seqincrement AS increment_by,
        S.seqcycle AS cycle,
        S.seqcache AS cache_size,
        pg_sequence_last_value(C.oid) AS last_value
    FROM pg_sequence S JOIN pg_class C ON (C.oid = S.seqrelid)
         LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE NOT pg_is_other_temp_schema(N.oid)
          AND relkind = 'S';
```

## 前提知識

- **シーケンス（sequence）**: 1, 2, 3 のように、呼ぶたびに増える連番を作る仕組み。`nextval()` で次の値を取る。
- **`pg_sequence`**: シーケンスの設定を持つ内部テーブル。
- **`regtype`**: 型の番号（`oid`）を、人が読める型の名前として扱うための型。
- **一時スキーマ**: セッションごとに作られる、一時テーブルなどを入れるスキーマ。他のセッションのものは見えないことが望ましい。
- **`NOT`**: 条件を反対にする演算子。

## 何をしているか

### 1. シーケンスの設定を取り出す

`pg_sequence` と `pg_class` を結び、名前と設定を取り出します。

```sql:line-numbers=173
    SELECT
        N.nspname AS schemaname,
        C.relname AS sequencename,
        pg_get_userbyid(C.relowner) AS sequenceowner,
        S.seqtypid::regtype AS data_type,
```

`S.seqtypid::regtype` は、型の番号を型名（`bigint` など）の文字列として見せます。`::regtype` を付けるだけで、内部の番号が読みやすい名前に変わります。

### 2. 設定値と最後の値を並べる

開始値、最小値、最大値、増分、循環の有無、キャッシュの数を、そのまま列として並べます。

```sql:line-numbers=178
        S.seqstart AS start_value,
        S.seqmin AS min_value,
        S.seqmax AS max_value,
        S.seqincrement AS increment_by,
        S.seqcycle AS cycle,
        S.seqcache AS cache_size,
```

最後の列の `pg_sequence_last_value(C.oid)` は、シーケンスが最後に返した値です。まだ一度も使われていなければ、`NULL` が返ります。

### 3. 他人の一時シーケンスを隠す

最後の条件が、一覧の絞り込みです。

```sql:line-numbers=187
    WHERE NOT pg_is_other_temp_schema(N.oid)
          AND relkind = 'S';
```

`pg_is_other_temp_schema()` は、そのシーケンスが他のセッションの一時スキーマにあるかを返します。`NOT` と組み合わせて、そうしたものを除外します。`relkind = 'S'` は、対象がシーケンスであることを表します。

## ここがすごい

- **内部の番号を型名に変える**: `regtype` の 1 つの書き方で、読みやすさが大きく変わります。
- **他人の一時的なものを隠す**: 一覧に、ほかのセッションの作業用のシーケンスが混ざりません。
- **設定と状態を 1 行にまとめる**: 利用者は、シーケンスの定義と現在の位置を 1 か所で確かめられます。
- **トレードオフ**: `pg_sequence_last_value()` は、シーケンスの現在の値を読むので、一覧の作成時点の値になります。読んだ直後に値が変わることもあります。

## まとめ

- 内部の型の番号は、`::regtype` で型名に変えると読みやすい。
- 一時的なものは、所有するセッションの外から見えないよう隠すとよい。
- 設定と状態を同じ行に並べると、確認の手間が減る。
