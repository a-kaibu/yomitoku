---
title: "入れられる拡張機能の一覧を作る pg_available_extensions"
description: "PostgreSQL の pg_available_extensions ビュー。インストール可能な拡張機能を関数から取り出し、pg_extension と結合して入っているバージョンを並べる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [445, 449]
function: "pg_available_extensions"
difficulty: 2
tags: [API設計, データ構造]
format: 2
---

## ひとことで

`pg_available_extensions` は、このサーバーに入れられる拡張機能の一覧を見せるビューです。拡張機能が今どのバージョンで入っているかも、同じ行で分かります。入れられるものと、入っているものは別の情報なので、ビューの中で 2 つを結び付けています。

## コード

```sql:line-numbers=445
CREATE VIEW pg_available_extensions AS
    SELECT E.name, E.default_version, X.extversion AS installed_version,
           E.location, E.comment
      FROM pg_available_extensions() AS E
           LEFT JOIN pg_extension AS X ON E.name = X.extname;
```

## 前提知識

- **拡張機能（extension）**: 追加の関数や型を、まとめて後から入れられる部品。
- **`pg_extension`**: 今データベースに入っている拡張機能を記録する表。
- **`LEFT JOIN`**: 左側の行を、右側に対応がなくても残す結合。
- **`AS` の別名**: 長い名前を短く呼ぶための書き方。`E` や `X` がそれにあたる。

## 何をしているか

### 1. 入れられる一覧から列を選ぶ

```sql:line-numbers=446
    SELECT E.name, E.default_version, X.extversion AS installed_version,
           E.location, E.comment
```

`pg_available_extensions()` の結果を `E` と呼び、名前、標準のバージョン、置いてある場所、説明を取り出します。

### 2. 入っているものと結ぶ

```sql:line-numbers=448
      FROM pg_available_extensions() AS E
           LEFT JOIN pg_extension AS X ON E.name = X.extname;
```

`pg_extension` を `X` として結び、拡張機能の名前が同じものを探します。まだ入っていない拡張機能は、対応する行が無いので `installed_version` が `NULL` になります。

## ここがすごい

- **入れられるものと入っているものを 1 行で比べる**: 2 つの情報源を結ぶので、未インストールの拡張機能も一覧に残ります。
- **`NULL` で状態を表す**: 入っていないことを、別の列を足さずに `NULL` で示しています。
- **関数を表のように読む**: 結果が表ではなく関数から来ても、`FROM` 句で他の表と同じように結べます。

## まとめ

- 関数の結果も、`FROM` 句で表と同じように結合できる。
- 「ある」と「入っている」を分けて、結合で並べると状態が一目で分かる。
- 対応する行が無いときは `NULL` を使って、未インストールを表す。
