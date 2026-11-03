---
title: "外部キーの参照先を pg_depend でたどる"
description: "information_schema.referential_constraints。外部キーが参照する主キーや一意制約を、pg_depend の依存関係を 2 段階でたどって見つけ、ON DELETE などの動作を文字で返す。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 2003-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/information_schema.sql
lines: [1234, 1265]
function: "referential_constraints"
difficulty: 3
tags: [データ構造, 型システム]
format: 2
---

## ひとことで

`referential_constraints` は、外部キー（別のテーブルの行を参照する制約）の一覧です。参照先の主キーや一意制約の名前を、PostgreSQL の内部の依存関係をたどって見つけます。更新時や削除時にどう動くか（`CASCADE` など）も、英語の記号から読める言葉に変えています。

## コード

```sql:line-numbers=1234
CREATE VIEW referential_constraints AS
    SELECT CAST(current_database() AS sql_identifier) AS constraint_catalog,
           CAST(ncon.nspname AS sql_identifier) AS constraint_schema,
           CAST(con.conname AS sql_identifier) AS constraint_name,
           CAST(
             CASE WHEN npkc.nspname IS NULL THEN NULL
                  ELSE current_database() END
             AS sql_identifier) AS unique_constraint_catalog,
           CAST(npkc.nspname AS sql_identifier) AS unique_constraint_schema,
           CAST(pkc.conname AS sql_identifier) AS unique_constraint_name,

           CAST(
             CASE con.confmatchtype WHEN 'f' THEN 'FULL'
                                    WHEN 'p' THEN 'PARTIAL'
                                    WHEN 's' THEN 'NONE' END
             AS character_data) AS match_option,

           CAST(
             CASE con.confupdtype WHEN 'c' THEN 'CASCADE'
                                  WHEN 'n' THEN 'SET NULL'
                                  WHEN 'd' THEN 'SET DEFAULT'
                                  WHEN 'r' THEN 'RESTRICT'
                                  WHEN 'a' THEN 'NO ACTION' END
             AS character_data) AS update_rule,

           CAST(
             CASE con.confdeltype WHEN 'c' THEN 'CASCADE'
                                  WHEN 'n' THEN 'SET NULL'
                                  WHEN 'd' THEN 'SET DEFAULT'
                                  WHEN 'r' THEN 'RESTRICT'
                                  WHEN 'a' THEN 'NO ACTION' END
             AS character_data) AS delete_rule
```

## 前提知識

- **外部キー**: あるテーブルの列が、別のテーブルの主キーなどを指す制約。
- **`pg_constraint`**: 制約の情報を持つ内部テーブル。外部キーは `contype` が `'f'` になる。
- **`pg_depend`**: 「どの対象が、どの対象に依存しているか」を記録する内部テーブル。外部キーは、参照先のインデックスに依存している。
- **`ON DELETE` / `ON UPDATE`**: 参照先の行が削除・更新されたときの動作。`CASCADE` は連動、`RESTRICT` は拒否など。
- **`INNER JOIN` と `LEFT JOIN`**: 必ず一致するものだけを残すか、一致しなくても左の行を残すかの違い。

## 何をしているか

### 1. 動作を言葉に変える

まず、外部キーの「更新時」と「削除時」の動作を、内部の 1 文字の記号から言葉にします。

```sql:line-numbers=1245
           CAST(
             CASE con.confmatchtype WHEN 'f' THEN 'FULL'
                                    WHEN 'p' THEN 'PARTIAL'
                                    WHEN 's' THEN 'NONE' END
             AS character_data) AS match_option,

           CAST(
             CASE con.confupdtype WHEN 'c' THEN 'CASCADE'
                                  WHEN 'n' THEN 'SET NULL'
                                  WHEN 'd' THEN 'SET DEFAULT'
                                  WHEN 'r' THEN 'RESTRICT'
                                  WHEN 'a' THEN 'NO ACTION' END
             AS character_data) AS update_rule,
```

`confupdtype` と `confdeltype` は、同じ形の `CASE` で `'c'` を `CASCADE`、`'n'` を `SET NULL` のように変えています。対応づけを同じ形にそろえることで、2 つの列の読み方が揃います。

### 2. 外部キーと参照先の制約を依存関係でつなぐ

外部キーの参照先には、直接の印がありません。そこで、`pg_depend` を 2 回たどります。最初に、外部キーが依存するインデックスを探し、次に、そのインデックスを持つ主キーや一意制約を探します。

```sql:line-numbers=1267
    FROM (pg_namespace ncon
          INNER JOIN pg_constraint con ON ncon.oid = con.connamespace
          INNER JOIN pg_class c ON con.conrelid = c.oid AND con.contype = 'f')
```

```sql:line-numbers=1274
          ON d2.refclassid = 'pg_constraint'::regclass
             AND d2.classid = 'pg_class'::regclass
             AND d2.objid = d1.refobjid AND d2.objsubid = 0
             AND d2.deptype = 'i'
         LEFT JOIN pg_constraint pkc ON pkc.oid = d2.refobjid
            AND pkc.contype IN ('p', 'u')
            AND pkc.conrelid = con.confrelid
         LEFT JOIN pg_namespace npkc ON pkc.connamespace = npkc.oid

```

`d1` は外部キーからインデックスへ、`d2` はインデックスから主キー・一意制約へ向かう依存です。`pkc.contype IN ('p', 'u')` で、対象を主キーと一意制約に絞っています。

### 3. 権限があるものだけを見せる

最後の `WHERE` が、見てよい制約だけを残します。

```sql:line-numbers=1283
    WHERE pg_has_role(c.relowner, 'USAGE')
```

```sql:line-numbers=1285
          OR has_table_privilege(c.oid, 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
          OR has_any_column_privilege(c.oid, 'INSERT, UPDATE, REFERENCES') ;
```

テーブルの持ち主か、挿入・更新などの権限を持つ人だけが、外部キーの情報を見られます。SQL 標準の定義に合わせて、`SELECT` の権限は条件に入れていません。

## ここがすごい

- **内部の依存関係を使って、直接は書かれていない対応を見つける**: 外部キーと主キーを結ぶ列は、どこにも書かれていません。依存の記録をたどるのが、確実な方法です。
- **2 段階の `LEFT JOIN` で、見つからない場合も残す**: 対応が見つからないときも、外部キーの行は消えません。
- **値の変換を同じ形で並べている**: 同じ書き方の `CASE` を繰り返すので、動作の意味を読み比べやすくなっています。
- **トレードオフ**: 依存関係の並びは PostgreSQL の内部の作り方に依存します。仕様の細部が変わると、このビューの読み方も変わる可能性があります。

## まとめ

- 直接の印がない関係は、依存の記録（`pg_depend`）をたどると見つけられる。
- 内部の記号は、同じ形の `CASE` で言葉に変えると読みやすい。
- 権限の判定は最後の `WHERE` にまとめると、見せる範囲が分かりやすい。
