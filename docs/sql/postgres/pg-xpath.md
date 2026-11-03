---
title: "XML から XPath で値を取り出す関数の既定の名前空間"
description: "PostgreSQL の xpath(text, xml)。名前空間の指定を省いたとき、空の名前空間の配列 {} を渡して、既存の 3 引数の xpath を呼ぶ。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [243, 247]
function: "xpath(text, xml)"
difficulty: 2
tags: [API設計, 標準ライブラリ]
format: 2
---

## ひとことで

`xpath` は、XML の文書の中から、XPath という書き方で指定した要素を取り出す関数です。この 2 引数の版は、名前空間の指定を省いたときの既定の動きを、空の配列を渡す 3 引数の版に任せています。

## コード

```sql:line-numbers=243
CREATE OR REPLACE FUNCTION xpath(text, xml)
 RETURNS xml[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
RETURN xpath($1, $2, '{}'::text[]);
```

## 前提知識

- **XML**: 要素と属性で文書の構造を表す形式。
- **XPath**: XML の中から、目的の要素を指定する書き方（例: `/book/title`）。
- **名前空間（namespace）**: XML の要素名が、どの範囲の名前かを区別する仕組み。XPath の中で名前空間を使うときは、対応表が必要になる。
- **`text[]`**: 文字列の配列。`'{}'::text[]` は、空の配列を表す。
- **`xml[]`**: XML の値の配列。結果は、見つかった要素の配列になる。

## 何をしているか

### 1. 2 引数の形と戻り値を定義する

戻り値は、`xml` の配列です。XPath で見つかった要素が、配列として返されます。

```sql:line-numbers=243
CREATE OR REPLACE FUNCTION xpath(text, xml)
 RETURNS xml[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
```

### 2. 空の名前空間の対応表を渡して、3 引数の関数を呼ぶ

本体は、`'{}'::text[]`（空の配列）を名前空間の指定として渡し、3 引数の `xpath` を呼ぶだけです。名前空間を使わない文書では、この既定値で十分です。

```sql:line-numbers=247
RETURN xpath($1, $2, '{}'::text[]);
```

`'{}'::text[]` の `::text[]` は、文字列の空配列であることを明示する型の変換です。

## ここがすごい

- **既定値を、空の対応表で表す**: 「名前空間は無い」という状態を、空の配列という値で素直に表しています。
- **引数を省ける形を用意する**: 名前空間を気にしない多くの利用者は、2 引数の形だけで済みます。
- **既存の関数の再利用**: 本体の処理は 3 引数の関数に任せ、2 引数の版は薄いラッパーになっています。
- **トレードオフ**: 名前空間を使う XML では、2 引数の版は使えません。そのときは 3 引数の形で対応表を渡す必要があります。

## まとめ

- 省略可能な引数は、「何も無い」を表す値（空の配列など）を渡す薄い関数で用意できる。
- 型を明示する `::text[]` は、空の配列の型を間違えないために役立つ。
- 既存の完全な形の関数を、短い形で包むのは、利用者の書き方を楽にする定番の手法。
