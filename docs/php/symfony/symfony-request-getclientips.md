---
title: 信頼できるプロキシからの転送だけを、接続元として読む
description: Symfony の Request::getClientIps は、サーバーに接続してきた IP のほかに、X-Forwarded-For ヘッダーに書かれた元の IP を返します。ただし、信頼できるプロキシから来た場合だけ、そのヘッダーを読みます。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/HttpFoundation/Request.php
lines: [895, 904]
function: Request::getClientIps
difficulty: 2
format: 2
tags: [ネットワーク, セキュリティ, 防御的プログラミング]
---

## ひとことで

`getClientIps` は、リクエストを送ってきた **利用者の IP アドレス** を返す関数です。サーバーの前にプロキシ（中継サーバー）があるときは、`X-Forwarded-For` ヘッダーに元の IP が書かれています。ただし、その書き込みは信用できるプロキシからのものだけを使います。

## コード

```php:line-numbers=895
    public function getClientIps(): array
    {
        $ip = $this->server->get('REMOTE_ADDR');

        if (!$this->isFromTrustedProxy()) {
            return [$ip];
        }

        return $this->getTrustedValues(self::HEADER_X_FORWARDED_FOR, $ip) ?: [$ip];
    }
```

## 前提知識

- **プロキシ（中継サーバー）**: 利用者とサーバーの間に入って、通信を中継する機器です。
- **`REMOTE_ADDR`**: サーバーが直接受け取った接続元の IP アドレスです。
- **`X-Forwarded-For`**: プロキシが、元の利用者の IP を書き加えるヘッダーです。誰でも偽って書けるので、扱いに注意が必要です。
- **信頼できるプロキシ**: 設定で「この IP からの転送は正しい」と決めた中継元です。
- **三項演算子の `?:`（省略形）**: 左が空なら右の値を使う書き方です。

## 何をしているか

### 1. 直接の接続元を、まず取り出す

```php:line-numbers=897
        $ip = $this->server->get('REMOTE_ADDR');
```

`REMOTE_ADDR` は、サーバーが直接見た接続元の IP です。プロキシを使っていなければ、これが利用者の IP です。

### 2. 信頼できるプロキシでなければ、接続元をそのまま返す

```php:line-numbers=899
        if (!$this->isFromTrustedProxy()) {
            return [$ip];
        }
```

`isFromTrustedProxy` で、接続してきた相手が信頼できる中継元かを確かめます。そうでなければ、ヘッダーは無視して `[$ip]` を返します。

### 3. 信頼できるなら、ヘッダーの値を使う

```php:line-numbers=903
        return $this->getTrustedValues(self::HEADER_X_FORWARDED_FOR, $ip) ?: [$ip];
```

`getTrustedValues(self::HEADER_X_FORWARDED_FOR, $ip)` で、ヘッダーに書かれた IP の一覧を取り出します。ヘッダーが空なら、`?:` で直接の接続元 `[$ip]` に戻ります。

具体例として、信頼できるプロキシ経由で `X-Forwarded-For: 203.0.113.5, 10.0.0.2` が届いたら、元の利用者は先頭の `203.0.113.5` です。

## ここがすごい

### 「誰が書いたか」で、信じるかどうかを決める

ヘッダーは、利用者が自由に書き換えられます。そのまま信じると、IP 制限や不正対策を簡単にすり抜けられてしまいます。この関数は、接続してきた相手が信頼できるプロキシかどうかを先に確かめ、その場合だけヘッダーを読みます。

### 疑わしいときは、接続元の値を返す

信頼できない相手からのヘッダーは捨て、直接の接続元を返します。安全側に倒れる設計なので、設定を忘れても偽装されるリスクが小さく保たれます。

### 空のときに戻す書き方

`?: [$ip]` で、ヘッダーがない場合も、直接の接続元を返します。どの場合でも、必ず 1 つ以上の IP が返るので、呼び出し側は配列の先頭を安心して使えます。

## まとめ

- 接続元の IP は、ヘッダーを信じる前に、中継元が信頼できるかを確かめる。
- 利用者が書き換えられる値は、そのまま使わないのが安全の基本。
- 疑わしいときは、直接の接続元に戻すと、偽装の影響を小さくできる。
- 空のときの既定値を決めておくと、呼び出し側が常に値を得られる。
