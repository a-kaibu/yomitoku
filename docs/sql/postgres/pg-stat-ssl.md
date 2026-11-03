---
title: "SSL で接続しているセッションを見る pg_stat_ssl"
description: "PostgreSQL の pg_stat_ssl ビュー。接続中のセッションのうち、クライアントの接続があるものだけを残し、SSL の版、暗号、証明書の情報を並べる。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_views.sql
lines: [1080, 1091]
function: "pg_stat_ssl"
difficulty: 2
tags: [セキュリティ, ネットワーク]
format: 2
---

## ひとことで

`pg_stat_ssl` は、サーバーに接続しているセッションが、SSL で暗号化されているかを見せるビューです。どの版の TLS を使っているか、どの暗号を使っているか、クライアントの証明書の情報は何かを、1 行ずつ読めます。

## コード

```sql:line-numbers=1080
CREATE VIEW pg_stat_ssl AS
    SELECT
            S.pid,
            S.ssl,
            S.sslversion AS version,
            S.sslcipher AS cipher,
            S.sslbits AS bits,
            S.ssl_client_dn AS client_dn,
            S.ssl_client_serial AS client_serial,
            S.ssl_issuer_dn AS issuer_dn
    FROM pg_stat_get_activity(NULL) AS S
    WHERE S.client_port IS NOT NULL;
```

## 前提知識

- **SSL / TLS**: 通信を暗号化して、盗み見や改ざんを防ぐ仕組み。
- **セッション**: サーバーに接続してから切断するまでの、1 つの利用の単位。
- **`pg_stat_get_activity`**: 接続中のセッションの情報を返す関数。
- **クライアント証明書**: 接続してきた側が、自分の身元を示すために提示する証明書。

## 何をしているか

### 1. 見せる列を選ぶ

```sql:line-numbers=1082
            S.pid,
            S.ssl,
            S.sslversion AS version,
            S.sslcipher AS cipher,
            S.sslbits AS bits,
            S.ssl_client_dn AS client_dn,
            S.ssl_client_serial AS client_serial,
            S.ssl_issuer_dn AS issuer_dn
```

`ssl` は SSL を使っているかどうかを表します。`version`、`cipher`、`bits` は暗号化の詳細です。`client_dn` などは、クライアント証明書の名前や番号を表します。

### 2. クライアントからの接続だけを残す

```sql:line-numbers=1090
    FROM pg_stat_get_activity(NULL) AS S
    WHERE S.client_port IS NOT NULL;
```

`WHERE S.client_port IS NOT NULL` は、クライアントの接続を持つセッションだけを残します。サーバー内部のプロセスには接続の相手がいないので、ここで除かれます。

## ここがすごい

- **暗号の詳細を列に分ける**: 版、暗号、鍵の長さを別の列にして、どれが弱いかを比べやすくしています。
- **内部のプロセスを除く**: 条件を 1 つ書くだけで、利用者が見るべき接続だけが残ります。
- **列の名前を読みやすくする**: `sslversion` を `version` などに変えて、利用者が迷わないようにしています。

## まとめ

- 関数の結果から、必要な列だけを別名を付けて出す。
- `IS NOT NULL` の条件で、接続の相手がいる行だけに絞る。
- 暗号の情報は、版と暗号と鍵の長さを分けて見ると判断しやすい。
