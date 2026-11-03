---
title: "書き込みを横取りして設定を変える pg_settings"
description: "PostgreSQL の設定一覧を表すビュー。UPDATE 文を RULE で set_config() 関数の呼び出しに書き換えて、ビューへの更新で設定を変えられるようにしている。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [646, 658]
function: "pg_settings"
difficulty: 2
tags: [設計パターン, API設計]
format: 2
---

## ひとことで

`pg_settings` は、`work_mem` や `search_path` などの設定値を一覧できるビューです。ふつうのビューは読むだけですが、このビューは `UPDATE` 文で設定を変えられます。その仕掛けが `CREATE RULE` で、ビューへの `UPDATE` を `set_config()` 関数の呼び出しに置き換えています。

## コード

```sql:line-numbers=646
CREATE VIEW pg_settings AS
    SELECT * FROM pg_show_all_settings() AS A;

CREATE RULE pg_settings_u AS
    ON UPDATE TO pg_settings
    WHERE new.name = old.name DO
    SELECT set_config(old.name, new.setting, 'f');

CREATE RULE pg_settings_n AS
    ON UPDATE TO pg_settings
    DO INSTEAD NOTHING;

GRANT SELECT, UPDATE ON pg_settings TO PUBLIC;
```

## 前提知識

- **ビュー（VIEW）**: テーブルのように `SELECT` できるが、中身は保存された問い合わせ文。実データは持たない。
- **ルール（RULE）**: 特定の操作（ここでは `UPDATE`）が来たとき、別の SQL 文に置き換える PostgreSQL 独自の仕組み。
- **`set_config(名前, 値, is_local)`**: 設定値を変える関数。3 番目が `'f'` なら、現在のセッションの間ずっと有効になる。
- **`new` と `old`**: ルールの中で、更新後の行と更新前の行を指す名前。
- **`GRANT ... TO PUBLIC`**: 全ユーザーに権限を与える指定。

## 何をしているか

### 1. 中身は設定一覧の関数の結果

まず、ビュー本体は関数 `pg_show_all_settings()` の結果をそのまま見せるだけです。

```sql:line-numbers=646
CREATE VIEW pg_settings AS
    SELECT * FROM pg_show_all_settings() AS A;
```

### 2. `UPDATE` を `set_config()` に置き換える

次のルールが、設定値の更新を実際の変更に変えます。

```sql:line-numbers=649
CREATE RULE pg_settings_u AS
    ON UPDATE TO pg_settings
    WHERE new.name = old.name DO
    SELECT set_config(old.name, new.setting, 'f');
```

`WHERE new.name = old.name` は「設定名を変えない更新だけを対象にする」という条件です。たとえば `UPDATE pg_settings SET setting = '64MB' WHERE name = 'work_mem'` と書くと、このルールが動き、`set_config('work_mem', '64MB', 'f')` が実行されます。`DO` は「元の文に追加で実行する」という意味で、ここでは `SELECT` の結果は捨てられます。

### 3. 元の `UPDATE` を実際のビューには当てない

次のルールは、ビューへの `UPDATE` を丸ごと「何もしない」に置き換えます。

```sql:line-numbers=654
CREATE RULE pg_settings_n AS
    ON UPDATE TO pg_settings
    DO INSTEAD NOTHING;
```

`DO INSTEAD NOTHING` は、元の文を本物のビューに当てないという意味です。つまり、ビューそのものは書き換えられず、設定の変更は必ず 2 番目のルールの `set_config()` 経由になります。名前が一致しない更新は、何も起きずに終わります。

### 4. 一般ユーザーにも `UPDATE` を許す

最後の `GRANT` で、全ユーザーにこのビューの更新を許可します。

```sql:line-numbers=658
GRANT SELECT, UPDATE ON pg_settings TO PUBLIC;
```

ただし、誰でもどの設定でも変えられるわけではありません。設定ごとに「ユーザーが変えてよいか」の制限があり、その判定は `set_config()` の側で行われます。ビューは入り口の形を整えているだけです。

## ここがすごい

- **普通の `UPDATE` 文で設定を変えられる**: `SET` コマンドを覚えなくても、読んだビューに対して同じ構文で書けます。
- **ビュー自体は書き換えられない**: 2 番目のルールがあるため、想定外の更新で表の中身が壊れることがありません。
- **トレードオフ**: ルールは「どこで何が起きているか」が見えにくい仕組みです。`pg_settings` を更新すると設定が変わる、と知らないと戸惑います。

## まとめ

- ビューは「読むための箱」だけでなく、ルールを付けると「書き込みの入り口」にもできる。
- `WHERE` で条件を絞ったルールと、`DO INSTEAD NOTHING` を組み合わせると、更新の経路を 1 か所に集められる。
- 実際の判断（何を変えてよいか）は、関数の側に任せると役割が分かれて読みやすい。
