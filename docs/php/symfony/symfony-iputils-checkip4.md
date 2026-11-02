---
title: "IP アドレスが範囲に入るかを 2 進数の先頭比較で調べる"
description: "Symfony の IpUtils::checkIp4 は、IPv4 アドレスが 192.168.1.0/24 のような範囲に入るかを判定します。32 桁の 2 進数にそろえて、先頭の桁だけを比べるのが工夫です。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/HttpFoundation/IpUtils.php
lines: [92, 125]
function: IpUtils::checkIp4
difficulty: 3
format: 2
tags: [ネットワーク, ビット演算, セキュリティ, キャッシュ]
---

## ひとことで

`checkIp4` は、アクセス元の IPv4 アドレスが **許可された範囲（CIDR 表記）** に入っているかを調べる関数です。`192.168.1.0/24` のように書かれた範囲に、`192.168.1.10` が入るかを判定します。Symfony のリクエスト処理で、信頼できる IP からの接続だけを通すときに使われます。

## コード

```php:line-numbers=92
    public static function checkIp4(string $requestIp, string $ip): bool
    {
        $cacheKey = $requestIp.'-'.$ip.'-v4';
        if (null !== $cacheValue = self::getCacheResult($cacheKey)) {
            return $cacheValue;
        }

        if (!filter_var($requestIp, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV4)) {
            return self::setCacheResult($cacheKey, false);
        }

        if (str_contains($ip, '/')) {
            [$address, $netmask] = explode('/', $ip, 2);

            if ('0' === $netmask) {
                return self::setCacheResult($cacheKey, false !== filter_var($address, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV4));
            }

            if (!ctype_digit($netmask) || 32 < (int) $netmask) {
                return self::setCacheResult($cacheKey, false);
            }

            $netmask = (int) $netmask;
        } else {
            $address = $ip;
            $netmask = 32;
        }

        if (false === ip2long($address)) {
            return self::setCacheResult($cacheKey, false);
        }

        return self::setCacheResult($cacheKey, 0 === substr_compare(\sprintf('%032b', ip2long($requestIp)), \sprintf('%032b', ip2long($address)), 0, $netmask));
    }
```

## 前提知識

- **IPv4 アドレス**: `192.168.1.10` のように 4 つの数字（0〜255）を `.` でつないだ住所です。実際には 32 桁の 2 進数です。
- **CIDR 表記 `/24`**: 先頭から何桁が「同じ範囲」を表すかを書く表記です。`/24` は先頭 24 桁が同じ住所の集まりという意味です。
- **`ip2long`**: IP アドレスを 1 つの整数に変換する PHP の関数です。
- **`sprintf('%032b', ...)`**: 整数を 2 進数の文字列にして、32 桁になるように 0 で埋める書き方です。
- **キャッシュ**: 一度調べた結果を覚えておく仕組みです。

## 何をしているか

### 1. キャッシュを確かめて、IPv4 として正しいかを見る

```php:line-numbers=94
        $cacheKey = $requestIp.'-'.$ip.'-v4';
        if (null !== $cacheValue = self::getCacheResult($cacheKey)) {
            return $cacheValue;
        }

        if (!filter_var($requestIp, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV4)) {
            return self::setCacheResult($cacheKey, false);
        }
```

まず「どの IP を、どの範囲で調べたか」をキーにして、キャッシュに結果があるかを確かめます。なければ `filter_var(..., FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)` で、アクセス元の IP が正しい IPv4 かを確かめます。正しくなければ、その時点で `false` にします。

### 2. 範囲を「住所」と「桁数」に分ける

```php:line-numbers=103
        if (str_contains($ip, '/')) {
            [$address, $netmask] = explode('/', $ip, 2);

            if ('0' === $netmask) {
                return self::setCacheResult($cacheKey, false !== filter_var($address, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV4));
            }

            if (!ctype_digit($netmask) || 32 < (int) $netmask) {
                return self::setCacheResult($cacheKey, false);
            }

            $netmask = (int) $netmask;
        } else {
            $address = $ip;
            $netmask = 32;
        }
```

`ip` に `/` が含まれていれば CIDR 表記です。`explode('/', $ip, 2)` で住所と桁数に分けます。桁数が `0` のときは、どんな住所でも入る範囲なので、範囲の住所が正しい IP なら `true` にします。桁数が数字でないか 32 より大きいと `false` です。

`/` がなければ、単独の住所として扱い、桁数を `32`（全部の桁が同じ）にします。

### 3. 先頭の桁だけを比べる

```php:line-numbers=120
        if (false === ip2long($address)) {
            return self::setCacheResult($cacheKey, false);
        }

        return self::setCacheResult($cacheKey, 0 === substr_compare(\sprintf('%032b', ip2long($requestIp)), \sprintf('%032b', ip2long($address)), 0, $netmask));
```

`ip2long` で両方の IP を整数にし、`sprintf('%032b', ...)` で 32 桁の 2 進数の文字列にします。そして `substr_compare` で、先頭から `$netmask` 桁だけを比べます。0 が返れば、その桁までは同じなので、範囲の中です。

具体例で確かめましょう。`192.168.1.10` と `192.168.1.0/24` を比べると、先頭 24 桁の 2 進数はどちらも同じです。残りの 8 桁は見ないので、結果は `true` になります。

## ここがすごい

### 範囲の判定を「先頭の桁の比較」1 回に減らしている

範囲に入るかは、本来「ネットマスクで AND を取って比べる」と書くのが定番です。この関数は、2 進数の文字列にして先頭 `$netmask` 桁を比べるだけで、同じ判定をしています。文字列の比較は PHP で速く、ビットの計算をしないので読みやすくもなっています。

### 結果をキャッシュして、同じ問い合わせを速くする

Web サーバーでは、同じ IP が何度もアクセスしてきます。各リクエストで範囲を計算し直す代わりに、`setCacheResult` で結果を保存します。`checkIp4` の最初に `getCacheResult` で確かめるので、2 回目以降は計算を省けます。

### 不正な入力を早めに弾く

`filter_var` で、リクエスト元が本当に IPv4 かを確かめてから比較に進みます。桁数の `ctype_digit` と `32 < (int) $netmask` も、比較の前に値の範囲を確かめています。こうした早めの `return` で、意味のない比較を避けています。

## まとめ

- IP の範囲判定は、2 進数の文字列にそろえて先頭の桁を比べると書きやすい。
- 桁数 `/0` のような特殊な場合は、先に分けて扱うと読みやすい。
- 同じ問い合わせが多い処理は、結果をキャッシュして計算を省く。
- 入力が正しいかは、比較の前に `filter_var` などで早めに確かめる。
