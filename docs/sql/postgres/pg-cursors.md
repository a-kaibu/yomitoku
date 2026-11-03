---
title: "開いているカーソルを一覧にする pg_cursors"
description: "PostgreSQL の pg_cursors ビュー。現在のセッションで開いているカーソルを pg_cursor() から取り出し、表と同じように読めるようにする。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [442, 443]
function: "pg_cursors"
difficulty: 1
tags: [API設計, データ構造]
format: 2
---

## ひとことで

`pg_cursors` は、今のセッションで開いているカーソルの一覧を見せるビューです。カーソルは、問い合わせの結果を少しずつ取り出すための仕組みです。開いたまま閉じ忘れると、資源を使い続けるので、一覧で確かめられると便利です。

## コード

```sql:line-numbers=442
CREATE VIEW pg_cursors AS
    SELECT * FROM pg_cursor() AS C;
```

## 前提知識

- **カーソル（cursor）**: 問い合わせの結果を、先頭から 1 行ずつ読み進めるための仕組み。
- **`pg_cursor()`**: 開いているカーソルの情報を、行の集まりで返す関数。
- **`AS C`**: `SELECT` の結果に付ける短い別名。

## 何をしているか

### 1. 関数の結果を表として見せる

```sql:line-numbers=442
CREATE VIEW pg_cursors AS
    SELECT * FROM pg_cursor() AS C;
```

`SELECT * FROM pg_cursor()` は、開いているカーソルの情報をそのまま出します。`pg_locks` と同じく、ビューの中身はこの 1 行だけです。

## ここがすごい

- **関数の結果を表にする**: 関数を `FROM` 句に書けば、列の名前で絞り込みや並べ替えができます。
- **同じ書き方で揃える**: 似た情報を見せるビューは、同じ形で書かれているので読み手が迷いません。
- **資源の使い残しを見つけやすくする**: 開いたまま残っているカーソルを、一覧から探せます。

## まとめ

- 関数の結果は、`SELECT *` で包めば表と同じように使える。
- カーソルは閉じ忘れると資源を使い続けるので、一覧で確認する価値がある。
- 同じ形のビューは、同じ書き方で揃えると読みやすい。
