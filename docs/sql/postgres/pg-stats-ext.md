---
title: "拡張統計の中身を一覧にする pg_stats_ext"
description: "PostgreSQL の pg_stats_ext ビュー。複数の列にまたがる拡張統計の列名を配列にまとめ、最頻値リストを LATERAL で展開し、行レベルセキュリティの条件も確かめる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [280, 314]
function: "pg_stats_ext"
difficulty: 3
tags: [データ構造, セキュリティ]
format: 2
---

## ひとことで

`pg_stats_ext` は、複数の列をまとめて集めた拡張統計の中身を見せるビューです。拡張統計は、列どうしの関係を見積もるために使われます。このビューは、対象の列名、式、最頻値などを 1 行ずつにまとめます。

## コード

```sql:line-numbers=280
CREATE VIEW pg_stats_ext WITH (security_barrier) AS
    SELECT cn.nspname AS schemaname,
           c.relname AS tablename,
           s.stxrelid AS tableid,
           sn.nspname AS statistics_schemaname,
           s.stxname AS statistics_name,
           s.oid AS statistics_id,
           pg_get_userbyid(s.stxowner) AS statistics_owner,
           ( SELECT array_agg(a.attname ORDER BY a.attnum)
             FROM unnest(s.stxkeys) k
                  JOIN pg_attribute a
                       ON (a.attrelid = s.stxrelid AND a.attnum = k)
           ) AS attnames,
           pg_get_statisticsobjdef_expressions(s.oid) as exprs,
           s.stxkind AS kinds,
           sd.stxdinherit AS inherited,
           sd.stxdndistinct AS n_distinct,
           sd.stxddependencies AS dependencies,
           m.most_common_vals,
           m.most_common_val_nulls,
           m.most_common_freqs,
           m.most_common_base_freqs
    FROM pg_statistic_ext s JOIN pg_class c ON (c.oid = s.stxrelid)
         JOIN pg_statistic_ext_data sd ON (s.oid = sd.stxoid)
         LEFT JOIN pg_namespace cn ON (cn.oid = c.relnamespace)
         LEFT JOIN pg_namespace sn ON (sn.oid = s.stxnamespace)
         LEFT JOIN LATERAL
                   ( SELECT array_agg(values) AS most_common_vals,
                            array_agg(nulls) AS most_common_val_nulls,
                            array_agg(frequency) AS most_common_freqs,
                            array_agg(base_frequency) AS most_common_base_freqs
                     FROM pg_mcv_list_items(sd.stxdmcv)
                   ) m ON sd.stxdmcv IS NOT NULL
    WHERE pg_has_role(c.relowner, 'USAGE')
    AND (c.relrowsecurity = false OR NOT row_security_active(c.oid));
```

## 前提知識

- **拡張統計**: 複数の列の関係（相関など）を、プランナーが見積もるための統計情報。
- **`stxkeys`**: 拡張統計の対象になっている列の番号（attnum）の配列。
- **`LATERAL`**: サブクエリが、左側の FROM の行を参照できる書き方。
- **行レベルセキュリティ（RLS）**: 行ごとに見せる範囲を決める仕組み。
- **`security_barrier`**: ビューの条件が、利用者の関数などに先に評価されないようにする指定。

## 何をしているか

### 1. 列番号を列名に変える

```sql:line-numbers=288
           ( SELECT array_agg(a.attname ORDER BY a.attnum)
             FROM unnest(s.stxkeys) k
                  JOIN pg_attribute a
                       ON (a.attrelid = s.stxrelid AND a.attnum = k)
           ) AS attnames,
```

`unnest(s.stxkeys)` で配列を 1 つずつの値に分け、`pg_attribute` と結合して列名を取り出します。`array_agg(a.attname ORDER BY a.attnum)` で、列名を列の並び順に 1 つの配列へ戻します。

### 2. 最頻値を LATERAL で展開する

```sql:line-numbers=306
         LEFT JOIN LATERAL
                   ( SELECT array_agg(values) AS most_common_vals,
                            array_agg(nulls) AS most_common_val_nulls,
                            array_agg(frequency) AS most_common_freqs,
                            array_agg(base_frequency) AS most_common_base_freqs
                     FROM pg_mcv_list_items(sd.stxdmcv)
                   ) m ON sd.stxdmcv IS NOT NULL
```

`pg_mcv_list_items(sd.stxdmcv)` は、最頻値のリストを行に分けて返します。`LEFT JOIN LATERAL` で、統計データがあるときだけ展開し、その結果を 4 つの配列にまとめます。

### 3. 見せてよい行だけを残す

```sql:line-numbers=313
    WHERE pg_has_role(c.relowner, 'USAGE')
    AND (c.relrowsecurity = false OR NOT row_security_active(c.oid));
```

`WHERE` の条件で、表の所有者に権限があるかを確かめます。さらに、行レベルセキュリティが有効な表は、その時点で行の制限が効いている場合に限り、この統計を見せません。

## ここがすごい

- **ネストした配列を平らにする**: 列番号の配列を、列名の配列に戻すという変換を、サブクエリだけで書いています。
- **統計データが無い行を消さない**: `LEFT JOIN LATERAL` と `ON ... IS NOT NULL` の組み合わせで、統計が無くても拡張統計の行は残ります。
- **見えない情報を漏らさない**: 権限と行レベルセキュリティの条件を、統計の段階で確かめています。
- **トレードオフ**: 最頻値を展開する分、ビューの処理は重くなります。

## まとめ

- 配列の要素を結合で名前に変え、`array_agg` で配列に戻す。
- `LEFT JOIN LATERAL` は、対応するデータが無いときも行を残す。
- 統計を見せる前に、所有者の権限と行レベルセキュリティを確かめる。
