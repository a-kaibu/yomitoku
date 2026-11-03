---
title: "接続の GSSAPI 認証の情報を、クライアントの接続だけに絞る"
description: "pg_stat_gssapi は、GSSAPI で認証した接続の情報を一覧するビュー。pg_stat_get_activity の結果から、クライアントのポートがある行だけを WHERE で選ぶ。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1093, 1101]
function: "pg_stat_gssapi"
difficulty: 2
tags: [セキュリティ, 防御的プログラミング]
format: 2
---

## ひとことで

`pg_stat_gssapi` は、Kerberos などの GSSAPI という仕組みで認証された接続について、認証の主体（プリンシパル）や暗号化の状態を見せるビューです。サーバー内部の背景プロセスは、クライアントと接続していないので、一覧から除かれます。

## コード

```sql:line-numbers=1093
CREATE VIEW pg_stat_gssapi AS
    SELECT
            S.pid,
            S.gss_auth AS gss_authenticated,
            S.gss_princ AS principal,
            S.gss_enc AS encrypted,
            S.gss_delegation AS credentials_delegated
    FROM pg_stat_get_activity(NULL) AS S
    WHERE S.client_port IS NOT NULL;
```

## 前提知識

- **GSSAPI**: 外部の認証の仕組み（Kerberos など）を使うための標準の仕組み。
- **プリンシパル（principal）**: 認証された利用者の名前。`user@REALM` の形が多い。
- **委譲（delegation）**: 認証の権限を、別のサービスに引き継ぐこと。
- **`client_port`**: クライアントとつながっている接続の番号。背景プロセスには無い。
- **`pg_stat_get_activity()`**: 接続やプロセスの一覧を返す関数。

## 何をしているか

### 1. 接続の一覧から、GSSAPI の情報を取り出す

`pg_stat_get_activity(NULL)` は、すべてのプロセスの情報を返します。その中から、プロセスの番号と、認証の情報の列だけを選びます。

```sql:line-numbers=1094
    SELECT
            S.pid,
            S.gss_auth AS gss_authenticated,
            S.gss_princ AS principal,
            S.gss_enc AS encrypted,
            S.gss_delegation AS credentials_delegated
    FROM pg_stat_get_activity(NULL) AS S
```

`gss_auth` は GSSAPI で認証されたかどうか、`gss_princ` は主体の名前、`gss_enc` は通信が暗号化されたかどうかを表します。

### 2. クライアントとつながった接続だけを残す

最後の条件で、クライアントのポートがある行だけを残します。

```sql:line-numbers=1101
    WHERE S.client_port IS NOT NULL;
```

背景プロセスには、クライアントのポートが無いので、この条件で外れます。認証の情報は、利用者が接続したものだけを見ればよいからです。

## ここがすごい

- **情報の種類で絞る**: 「どの接続が外部から来たか」を、ポートの有無で判定しています。背景プロセスを別の条件で除く必要がありません。
- **認証の情報を分けて見せる**: 認証されたか、誰か、暗号化されたか、委譲されたか、を別の列にしています。
- **既存の関数を再利用する**: 接続の一覧を作る関数を、そのまま土台にしています。新しい仕組みは要りません。
- **トレードオフ**: 認証の情報は、接続が終わると一覧から消えます。過去の認証の記録を残すには、ログなど別の仕組みが必要です。

## まとめ

- 外部からの接続だけを見たいときは、接続の番号やポートの有無で絞る。
- 認証の結果は、項目ごとに列を分けると読み取りやすい。
- 既存の一覧関数に条件を足すと、少ない記述で目的の情報が得られる。
