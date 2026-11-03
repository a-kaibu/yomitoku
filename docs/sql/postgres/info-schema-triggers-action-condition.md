---
title: "正規表現で WHEN 条件だけを取り出す"
description: "information_schema.triggers の action_condition。トリガーの定義文を pg_get_triggerdef で文字列に戻し、正規表現で WHEN の中の条件式だけを切り出している。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [2135, 2139]
function: "triggers.action_condition"
difficulty: 3
tags: [正規表現, 文字列処理]
format: 2
---

## ひとことで

トリガーには、`WHEN (条件式)` で発動の条件を付けられます。その条件は、内部では別の形で保存されているため、`information_schema.triggers` は、定義文を文字列にしてから正規表現で `WHEN` の中身だけを切り出しています。文字列を読むという、少し変わった方法です。

## コード

```sql:line-numbers=2135
           CAST(
             CASE WHEN pg_has_role(c.relowner, 'USAGE')
               THEN (regexp_match(pg_get_triggerdef(t.oid), E'.{35,} WHEN \\((.+)\\) EXECUTE FUNCTION'))[1]
               ELSE null END
             AS character_data) AS action_condition,
```

## 前提知識

- **トリガーの条件（WHEN）**: `CREATE TRIGGER ... WHEN (条件) EXECUTE FUNCTION ...` の `WHEN` で、発動する行を絞る式。
- **`pg_get_triggerdef()`**: トリガーの定義を、`CREATE TRIGGER` の文字列として返す関数。
- **正規表現**: 文字の並びのパターンを表す書き方。`.`（任意の 1 文字）、`{35,}`（35 文字以上）、`(...)`（取り出す部分）などを使う。
- **`regexp_match()`**: 正規表現に当たった部分を配列で返す関数。`[1]` で 1 番目の括弧の中身を取り出す。
- **`E'...'`**: バックスラッシュを特別な文字として扱う文字列リテラル。

## 何をしているか

### 1. 定義文が、権限のある人にだけ見えるようにする

まず、トリガーの所有者に権限がある場合だけ、定義文を読みます。そうでなければ `NULL` を返します。

```sql:line-numbers=2136
             CASE WHEN pg_has_role(c.relowner, 'USAGE')
               THEN (regexp_match(pg_get_triggerdef(t.oid), E'.{35,} WHEN \\((.+)\\) EXECUTE FUNCTION'))[1]
               ELSE null END
```

定義文には、条件式そのものが含まれるため、見てよい人だけに限られます。

### 2. 正規表現で `WHEN (…)` の中身を切り出す

`regexp_match()` の中のパターンが、この処理の本体です。

```sql:line-numbers=2137
               THEN (regexp_match(pg_get_triggerdef(t.oid), E'.{35,} WHEN \\((.+)\\) EXECUTE FUNCTION'))[1]
```

`.{35,} WHEN \\((.+)\\) EXECUTE FUNCTION` は、「35 文字以上の任意の文字列」の後に `WHEN (` が続き、`) EXECUTE FUNCTION` までの間を括弧で取り出す、という意味です。`35 文字以上` は、トリガーの名前やテーブル名などの前置きを飛ばすための目安です。最後の `[1]` が、括弧の中身、つまり条件式です。

## ここがすごい

- **内部の保存形式を読まずに、利用者の形式を再利用している**: 条件式を内部から組み立て直すより、すでに人が読める定義文を使うほうが、確実です。
- **正規表現で必要な部分だけを取る**: 前置きを飛ばして、条件式だけを切り出すので、定義文の形が少し変わっても対応しやすくなっています。
- **権限の判定を先に書いている**: 文字列を作る前に、見てよいかを確かめているので、無駄な処理や情報の漏えいを避けています。
- **トレードオフ**: 正規表現は、定義文の書き方の細かな違いに弱いです。文字数の目安（35）が前提なので、これを仮定にした読み方が必要です。

## まとめ

- 内部の表現を直接扱うより、定義文を文字列として使うと、確実に中身を取り出せることがある。
- 正規表現は、取り出す部分を括弧で囲んで `[1]` で読むと、目的がはっきりする。
- 正規表現には仮定が含まれるので、その前提を読み取る習慣が大切。
