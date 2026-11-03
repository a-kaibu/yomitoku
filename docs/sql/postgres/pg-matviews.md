---
title: "マテリアライズドビューの状態を一覧する"
description: "pg_matviews は、マテリアライズドビューの一覧。結果を保存しておく表としての情報（インデックスの有無、作成済みかどうか）を、関数の結果を使わずに、テーブルの属性から読んでいる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [146, 157]
function: "pg_matviews"
difficulty: 1
tags: [データ構造, キャッシュ]
format: 2
---

## ひとことで

`pg_matviews` は、マテリアライズドビューを一覧するビューです。マテリアライズドビューは、ビューの結果を実際のデータとして保存しておく仕組みです。このビューは、保存先の表の属性（インデックスがあるか、中身が作られているか）を、そのまま読んで見せています。

## コード

```sql:line-numbers=146
CREATE VIEW pg_matviews AS
    SELECT
        N.nspname AS schemaname,
        C.relname AS matviewname,
        pg_get_userbyid(C.relowner) AS matviewowner,
        T.spcname AS tablespace,
        C.relhasindex AS hasindexes,
        C.relispopulated AS ispopulated,
        pg_get_viewdef(C.oid) AS definition
    FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
         LEFT JOIN pg_tablespace T ON (T.oid = C.reltablespace)
    WHERE C.relkind = 'm';
```

## 前提知識

- **ビュー（VIEW）**: 保存された問い合わせの名前。読むたびに元の表から計算される。
- **マテリアライズドビュー（materialized view）**: 問い合わせの結果を、実際のデータとして保存しておく表。`REFRESH MATERIALIZED VIEW` で中身を更新する。
- **`relkind`**: 対象の種類を表す 1 文字。`'v'` はビュー、`'m'` はマテリアライズドビュー。
- **`relispopulated`**: 中身が作られているかどうか。`WITH NO DATA` で作ると、最初は `false` になる。
- **表領域（tablespace）**: テーブルやインデックスを置く場所の名前。

## 何をしているか

### 1. 名前と持ち主、表領域を取り出す

`pg_class` を、スキーマと表領域に結んで、名前と場所を取り出します。

```sql:line-numbers=147
    SELECT
        N.nspname AS schemaname,
        C.relname AS matviewname,
        pg_get_userbyid(C.relowner) AS matviewowner,
        T.spcname AS tablespace,
```

`pg_get_userbyid()` は、所有者の番号を名前に変える関数です。

### 2. 表の属性を、利用者の言葉にする

インデックスがあるか、中身が作られているか、といった状態を、そのまま列にします。

```sql:line-numbers=152
        C.relhasindex AS hasindexes,
        C.relispopulated AS ispopulated,
        pg_get_viewdef(C.oid) AS definition
```

`hasindexes` は、マテリアライズドビューにインデックスが付いているかを表します。`ispopulated` が偽なら、まだ `REFRESH` されておらず、問い合わせると「データがまだ無い」というエラーになります。

### 3. マテリアライズドビューだけを選ぶ

最後の条件で、`relkind` が `'m'` の対象だけに絞ります。

```sql:line-numbers=157
    WHERE C.relkind = 'm';
```

## ここがすごい

- **ビューと同じ仕組みで、保存の状態を見せる**: 別の内部の表を作らず、既存の `pg_class` の属性を読むだけで、状態が分かります。
- **`relkind` の 1 文字で対象を分ける**: 通常のビューと同じテーブルを使いながら、条件で仕分けています。
- **利用者が気づく状態を列にする**: `ispopulated` のように、古い中身を読んでしまう事故を防ぐための情報が含まれています。
- **トレードオフ**: 中身が古くなっているかどうかは、このビューからは分かりません。更新の時刻を別に管理する必要があります。

## まとめ

- 保存された結果の状態は、テーブルの属性として読める。
- 内部の種類の記号は、条件で絞り込むと対象がはっきりする。
- 「中身が作られていない」という状態も、利用者に見せると事故を防げる。
