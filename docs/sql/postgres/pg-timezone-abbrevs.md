---
title: "重複を避けて時差の略称を並べる UNION ALL"
description: "タイムゾーンの略称（JST や PST など）を一覧するビュー。2 つの問い合わせを UNION ALL でつなぎ、重複は NOT EXISTS で手作業で避けている。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [675, 681]
function: "pg_timezone_abbrevs"
difficulty: 2
tags: [データ構造, 最適化]
format: 2
---

## ひとことで

`pg_timezone_abbrevs` は、時差の略称（`JST` や `PST` など）と、その UTC からのずれを一覧するビューです。地域の定義から来る略称を優先し、そこに無い略称だけを後ろに足しています。その重複の除き方が少し変わっています。

## コード

```sql:line-numbers=675
CREATE VIEW pg_timezone_abbrevs AS
    SELECT * FROM pg_timezone_abbrevs_zone() z
    UNION ALL
    (SELECT * FROM pg_timezone_abbrevs_abbrevs() a
     WHERE NOT EXISTS (SELECT 1 FROM pg_timezone_abbrevs_zone() z2
                       WHERE z2.abbrev = a.abbrev))
    ORDER BY abbrev;
```

## 前提知識

- **`UNION ALL`**: 2 つの `SELECT` の結果を縦につなぐ。重複は取り除かない。
- **`UNION`**: 重複を取り除きながらつなぐ。取り除くために並べ替えや突き合わせの処理が追加で必要になる。
- **相関サブクエリ（`NOT EXISTS`）**: 外側の行ごとに内側の問い合わせを行い、一致する行が「無い」かどうかを調べる書き方。
- **別名（エイリアス）**: `z`、`a`、`z2` のように、表や関数の結果に短い名前を付けて区別すること。

## 何をしているか

### 1. 地域の定義から来る略称を先に並べる

最初の問い合わせは、タイムゾーンの定義から作られる略称をすべて取り出します。

```sql:line-numbers=675
CREATE VIEW pg_timezone_abbrevs AS
    SELECT * FROM pg_timezone_abbrevs_zone() z
    UNION ALL
```

### 2. 地域に無い略称だけを後ろに足す

2 番目の問い合わせは、略称の一覧から「最初の問い合わせに同じ略称が無いもの」だけを選びます。

```sql:line-numbers=678
    (SELECT * FROM pg_timezone_abbrevs_abbrevs() a
     WHERE NOT EXISTS (SELECT 1 FROM pg_timezone_abbrevs_zone() z2
                       WHERE z2.abbrev = a.abbrev))
```

`z2` は内側でもう一度 `pg_timezone_abbrevs_zone()` を呼び、同じ略称を探しています。`a.abbrev` と一致する行が 1 つでもあれば、その略称は捨てられます。

### 3. 全体を並べ替える

最後の `ORDER BY` は、つなぎ合わせた結果全体に対して働きます。

```sql:line-numbers=681
    ORDER BY abbrev;
```

## ここがすごい

- **`UNION` ではなく `UNION ALL` + `NOT EXISTS`**: `UNION` にすると全体を重複除去するための処理が増えます。ここでは「どちらを残すか」が決まっているので、先に優先する方を置き、後ろの重複だけを捨てています。
- **優先順位が読み取れる**: 上にある行が勝つ、という順番がそのまま SQL の形に表れています。
- **トレードオフ**: `NOT EXISTS` は、外側の行ごとに内側の問い合わせを見に行きます。対象の数が大きいと遅くなりますが、この一覧は小さいので問題になりません。

## まとめ

- 重複を除く必要があっても、優先順位がはっきりしているなら `UNION ALL` と `NOT EXISTS` で書ける。
- 相関サブクエリは「行ごとに一致するものがあるか」を素直に表せる。
- `ORDER BY` はつなぎ合わせた後の結果に効く、という点を押さえておくと読みやすい。
