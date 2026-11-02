---
title: 利用者が指定した Host ヘッダーを、URL の書き換えで消さない
description: Guzzle の shouldPreserveHost は、リクエストに明示された Host ヘッダーが URL のホストと違うかを調べます。違うときは、URL を書き換えても Host ヘッダーを残すように、呼び出し側へ知らせます。
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling, Copyright (c) 2012 Jeremy Lindblom
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/Client.php
lines: [708, 723]
function: shouldPreserveHost
difficulty: 3
format: 2
tags: [ネットワーク, API設計, 防御的プログラミング]
---
## ひとことで

`shouldPreserveHost` は、リクエストの `Host` ヘッダーを、URL を書き換えたあとも残すべきかを判定する関数です。利用者が `Host` を明示していて、それが URL のホストやポートと違うときは `true` を返します。Guzzle は、この結果を `withUri` の第 2 引数に渡します。

## コード

```php:line-numbers=708
    private static function shouldPreserveHost(RequestInterface $request): bool
    {
        if (!$request->hasHeader('Host')) {
            return false;
        }

        $uri = $request->getUri();
        $host = $uri->getHost();
        $port = $uri->getPort();

        if ($port !== null) {
            $host .= ':'.$port;
        }

        return $host !== $request->getHeaderLine('Host');
    }
```

## 前提知識

- **`Host` ヘッダー**: HTTP リクエストで、どのホストに送るかを伝えるヘッダーです。通常は URL のホスト名と同じになります。
- **ポート番号**: `example.com:8080` のように、ホストの後ろに付く番号です。既定の番号（80 や 443）は、URL から省かれることがあります。
- **PSR-7 の `withUri`**: リクエストの URL を変えた新しいリクエストを作るメソッドです。第 2 引数の `$preserveHost` が `true` のとき、既存の `Host` ヘッダーを残します。
- **URL の書き換え**: 利用者が指定した `base_uri` などによって、最終的な URL が変わることがあります。そのとき、`Host` ヘッダーをどうするかが問題になります。
- **`getPort` が `null` を返す場合**: URL にポートが書かれていないときは、`null` になります。

## 何をしているか

### 1. Host ヘッダーが無ければ、残す理由もない

```php:line-numbers=710
        if (!$request->hasHeader('Host')) {
            return false;
        }
```

リクエストに `Host` ヘッダーが無いときは、残すものがないので `false` を返します。

### 2. URL のホストとポートをつなぐ

```php:line-numbers=714
        $uri = $request->getUri();
        $host = $uri->getHost();
        $port = $uri->getPort();

        if ($port !== null) {
            $host .= ':'.$port;
        }
```

URI からホストを取り出し、ポートがあれば `:` と一緒につなぎます。`Host` ヘッダーと同じ形にそろえるための準備です。

### 3. 両者が違うかを比べる

```php:line-numbers=722
        return $host !== $request->getHeaderLine('Host');
```

URL から作った値と、`Host` ヘッダーの値を比べます。違えば `true` になり、`withUri` は既存の `Host` を残します。一致していれば `false` になり、URL のホストが `Host` として使われます。

## ここがすごい

- 「利用者が明示した `Host` を尊重する」という方針を、1 つの比較で表しています。必要な場面だけ、ヘッダーを残せます。
- ホストとポートを、ヘッダーと同じ書式につなげてから比べるので、`example.com:80` と `example.com` の違いを、正しく扱えます。
- ヘッダーが無いときは、早く `false` を返します。通常のリクエストでは、余計な比較をせずに済みます。
- 判定だけを行い、書き換え自体は `withUri` に任せています。PSR-7 の仕組みに沿った、役割の分け方になっています。

## まとめ

`shouldPreserveHost` は、利用者が明示した `Host` ヘッダーが URL と食い違うかを、比べて判定する関数です。結果は `withUri` の第 2 引数に渡されます。URL の書き換えによって、利用者の指定が静かに消えないようにする、細やかな配慮です。
