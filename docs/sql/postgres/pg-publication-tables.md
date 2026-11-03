---
title: "公開するテーブルと列を LATERAL で一覧する"
description: "pg_publication_tables は、論理レプリケーションの公開（publication）に含まれるテーブルを一覧するビュー。LATERAL で関数の結果を使い、列名は配列の副問い合わせで集める。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [413, 427]
function: "pg_publication_tables"
difficulty: 3
tags: [データ構造, 標準ライブラリ]
format: 2
---

## ひとことで

`pg_publication_tables` は、論理レプリケーションで「公開」されているテーブルを一覧するビューです。公開に含まれる列の名前と、行の絞り込み条件（行フィルタ）も一緒に見せます。関数の結果を行ごとに使うために、`LATERAL` という書き方を使っています。

## コード

```sql:line-numbers=413
CREATE VIEW pg_publication_tables AS
    SELECT
        P.pubname AS pubname,
        N.nspname AS schemaname,
        C.relname AS tablename,
        ( SELECT array_agg(a.attname ORDER BY a.attnum)
          FROM pg_attribute a
          WHERE a.attrelid = GPT.relid AND
                a.attnum = ANY(GPT.attrs)
        ) AS attnames,
        pg_get_expr(GPT.qual, GPT.relid) AS rowfilter
    FROM pg_publication P,
         LATERAL pg_get_publication_tables(P.pubname) GPT,
         pg_class C JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE C.oid = GPT.relid;
```

## 前提知識

- **論理レプリケーション**: テーブルの変更を、行の内容として別のサーバーへ送る仕組み。
- **publication（公開）**: どのテーブルを、どの操作について送るかを決めた設定のまとまり。
- **`LATERAL`**: FROM の中の副問い合わせや関数が、左側にある表の列を参照できるようにする書き方。
- **`array_agg(... ORDER BY ...)`**: 値を集めて配列にする集計関数。並び順を指定できる。
- **`= ANY(配列)`**: 値が配列の中のどれかと一致するかを調べる比較。

## 何をしているか

### 1. 公開ごとにテーブルを取り出す

`pg_get_publication_tables()` は、公開名を受け取り、その公開に含まれるテーブルの情報を返す関数です。`LATERAL` を付けると、`P` の行ごとにこの関数が呼ばれます。

```sql:line-numbers=414
    SELECT
        P.pubname AS pubname,
        N.nspname AS schemaname,
```

```sql:line-numbers=424
    FROM pg_publication P,
         LATERAL pg_get_publication_tables(P.pubname) GPT,
         pg_class C JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE C.oid = GPT.relid;
```

`pg_class` と `pg_namespace` を結んで、テーブルの名前とスキーマを付けます。

### 2. 列の名前を配列の副問い合わせで集める

公開された列は、列の番号の配列（`attrs`）として保存されています。それを、列名の配列に変換します。

```sql:line-numbers=418
        ( SELECT array_agg(a.attname ORDER BY a.attnum)
          FROM pg_attribute a
          WHERE a.attrelid = GPT.relid AND
                a.attnum = ANY(GPT.attrs)
        ) AS attnames,
```

`array_agg(a.attname ORDER BY a.attnum)` は、列名を列番号の順に並べて配列にします。`a.attnum = ANY(GPT.attrs)` で、公開された列だけを選んでいます。

### 3. 行フィルタの条件を文字列にする

最後に、行の絞り込み条件を `pg_get_expr()` で、読める式の文字列に戻します。

```sql:line-numbers=423
        pg_get_expr(GPT.qual, GPT.relid) AS rowfilter
```

## ここがすごい

- **関数を行ごとに使える**: `LATERAL` で、公開の行ごとにテーブルの一覧を展開できます。普通の結合では書きにくい形を、短く表せます。
- **列の番号を名前に変える**: 内部では番号の配列で持つ情報を、列名の配列として見せ、利用者が理解できる形にしています。
- **`ORDER BY` を集計の中に書く**: 配列の要素の順番を、元の列番号の順にそろえています。
- **トレードオフ**: 副問い合わせを行ごとに実行するので、テーブルの数が多いと遅くなることがあります。このビューはカタログの一覧なので、通常は問題になりません。

## まとめ

- 関数の結果を行ごとに使うときは、`LATERAL` を使うと書きやすい。
- 配列の副問い合わせは、集計と `ORDER BY` を組み合わせると、要素の順番を保ったまま集められる。
- 内部の番号は、名前の配列に変えると読みやすくなる。
