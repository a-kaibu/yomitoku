---
title: "組み込みでない関数だけを数える統計ビュー"
description: "pg_stat_user_functions。プロシージャの番号 prolang で組み込み関数を素早く除外し、呼び出し回数が記録されたものだけを一覧する。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1204, 1215]
function: "pg_stat_user_functions"
difficulty: 2
tags: [最適化, 防御的プログラミング]
format: 2
---

## ひとことで

`pg_stat_user_functions` は、利用者が作った関数の呼び出し回数と実行時間を一覧するビューです。何千もある組み込み関数を、最初の条件で素早く除外してから、呼び出しの記録があるものだけを残しています。

## コード

```sql:line-numbers=1204
CREATE VIEW pg_stat_user_functions AS
    SELECT
            P.oid AS funcid,
            N.nspname AS schemaname,
            P.proname AS funcname,
            pg_stat_get_function_calls(P.oid) AS calls,
            pg_stat_get_function_total_time(P.oid) AS total_time,
            pg_stat_get_function_self_time(P.oid) AS self_time,
            pg_stat_get_function_stat_reset_time(P.oid) AS stats_reset
    FROM pg_proc P LEFT JOIN pg_namespace N ON (N.oid = P.pronamespace)
    WHERE P.prolang != 12  -- fast check to eliminate built-in functions
          AND pg_stat_get_function_calls(P.oid) IS NOT NULL;
```

## 前提知識

- **関数（function）**: 引数を受け取り、値を返す処理の単位。PostgreSQL の組み込み関数と、利用者が `CREATE FUNCTION` で作る関数がある。
- **`pg_proc`**: 関数の情報を持つ内部テーブル。`prolang` は、関数の書かれた言語の番号。
- **統計の累計**: 呼び出し回数や時間を、サーバーが数え続けたもの。
- **`IS NOT NULL`**: 値が無いものを除く条件。統計が記録されていない関数は `NULL` になる。

## 何をしているか

### 1. 関数の情報と名前を取り出す

`pg_proc` と `pg_namespace` を結んで、関数の番号、スキーマ名、関数名を並べます。

```sql:line-numbers=1205
    SELECT
            P.oid AS funcid,
            N.nspname AS schemaname,
            P.proname AS funcname,
            pg_stat_get_function_calls(P.oid) AS calls,
            pg_stat_get_function_total_time(P.oid) AS total_time,
            pg_stat_get_function_self_time(P.oid) AS self_time,
            pg_stat_get_function_stat_reset_time(P.oid) AS stats_reset
    FROM pg_proc P LEFT JOIN pg_namespace N ON (N.oid = P.pronamespace)
```

ここまでは、どの関数も一覧に入る状態です。以下の条件で絞り込みます。

### 2. 組み込み関数を素早く除外する

`prolang` の値が `12` の関数は、組み込み（内部実装）の関数です。その行を先に除きます。

```sql:line-numbers=1214
    WHERE P.prolang != 12  -- fast check to eliminate built-in functions
```

コメントにあるように、これは「速い確認」のための条件です。数字 1 つの比較なので、関数の数が多くても、後の条件より前に大きく絞れます。

### 3. 呼び出し記録のあるものだけを残す

最後に、統計が記録されている関数だけを残します。

```sql:line-numbers=1215
          AND pg_stat_get_function_calls(P.oid) IS NOT NULL;
```

呼び出された記録が無いと、`pg_stat_get_function_calls()` は `NULL` になります。その行を除くことで、一度も使われていない関数は一覧に出ません。

## ここがすごい

- **安い条件から順に絞る**: 数字の比較は軽いので、先に置いて対象を減らしています。重い統計関数を呼ぶ回数も減ります。
- **組み込みを番号で判定する**: 名前を調べるより、言語の番号で判定するほうが確実で速く書けます。
- **`NULL` を使って「記録が無い」を表す**: 別のフラグを持たずに、統計の有無を判定できます。
- **トレードオフ**: `12` という数字は、内部の番号を知らないと意味が分かりません。コメントで理由を残していることが、読み手の助けになっています。

## まとめ

- 絞り込みの条件は、軽い比較から順に並べると効率がよい。
- 内部の番号は、コメントで意味を残しておくと保守しやすい。
- 統計が無いことを `NULL` で表すと、別の印を持たずに済む。
