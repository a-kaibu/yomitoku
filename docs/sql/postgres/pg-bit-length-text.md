---
title: "文字列のバイト数から bit_length を求める"
description: "PostgreSQL の bit_length(text)。文字列の長さを文字数ではなくバイト数で数え、それを 8 倍してビット数にする。日本語など多バイトの文字でも正しく数える。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [60, 64]
function: "bit_length(text)"
difficulty: 1
tags: [文字列処理, Unicode]
format: 2
---

## ひとことで

`bit_length` は、文字列が何ビットで表されているかを返す関数です。`length()` が文字数を返すのに対し、`bit_length()` は保存されたバイトの数を使います。日本語のように 1 文字が複数バイトになる文字でも、実際のサイズを正しく測れます。

## コード

```sql:line-numbers=60
CREATE OR REPLACE FUNCTION bit_length(text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
RETURN octet_length($1) * 8;
```

## 前提知識

- **文字数とバイト数**: 1 文字が何バイトで表されるかは、文字コードによって違う。UTF-8 では、日本語の 1 文字は通常 3 バイト。
- **ビット**: 1 バイトは 8 ビット。
- **`octet_length()`**: 文字列のバイト数を返す関数。
- **`length()`**: 文字列の文字数を返す関数。
- **`text` 型**: 可変長の文字列の型。

## 何をしているか

### 1. 引数の型ごとに定義する

`bit_length` は、`bit`、`bytea`、`text` の 3 つの型に対して、別々に定義されています。この部分は `text` 版です。

```sql:line-numbers=60
CREATE OR REPLACE FUNCTION bit_length(text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
```

### 2. バイト数を 8 倍する

本体は、`octet_length($1)` でバイト数を取り、それに 8 を掛けてビット数にしています。

```sql:line-numbers=64
RETURN octet_length($1) * 8;
```

たとえば「あ」は UTF-8 では 3 バイトなので、`bit_length('あ')` は `24` になります。`length('あ')` の `1` とは違う値です。

## ここがすごい

- **単位を変えるだけの簡潔な定義**: 「バイト数 × 8」という 1 つの式で、ビット数を表しています。
- **型の違いで別の定義を用意する**: `bit` は文字数そのもの、`bytea` と `text` はバイト数、と型ごとに意味の正しい式を選んでいます。
- **多バイト文字でも正しい**: 文字数と取り違えると、データベースの保存容量の見積もりを誤ります。この関数はその誤りを防ぎます。
- **トレードオフ**: 文字数が知りたいときには使えません。目的（文字数か容量か）に応じて、`length` と使い分ける必要があります。

## まとめ

- 文字数とバイト数は別物で、容量の計算ではバイト数を使う。
- 型ごとに意味が違うので、同じ名前の関数を型ごとに定義している。
- 単位の換算は、1 つの式で書けば十分な場合が多い。
