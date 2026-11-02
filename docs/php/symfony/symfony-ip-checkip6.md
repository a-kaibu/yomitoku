---
title: "IPv6 のアドレスを 16 ビットずつ区切って、範囲を比べる"
description: "Symfony の IpUtils::checkIp6 は、IPv6 アドレスが範囲に入るかを判定します。128 ビットを 16 ビットずつの 8 つの数として扱い、ネットマスクに応じた部分だけを比べます。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/HttpFoundation/IpUtils.php
lines: [139, 197]
function: IpUtils::checkIp6
difficulty: 3
format: 2
tags: [ネットワーク, ビット演算, セキュリティ]
---

## ひとことで

`checkIp6` は、アクセス元の **IPv6 アドレス** が、`2001:db8::/32` のような範囲に入っているかを判定します。IPv4 と同じ考え方ですが、アドレスが 128 ビットと長いため、16 ビットずつ区切って比べる方法を取っています。

## コード

::: code-group

```php:line-numbers=139 [日本語訳]
    public static function checkIp6(string $requestIp, string $ip): bool
    {
        $cacheKey = $requestIp.'-'.$ip.'-v6';
        if (null !== $cacheValue = self::getCacheResult($cacheKey)) {
            return $cacheValue;
        }

        if (!((\extension_loaded('sockets') && \defined('AF_INET6')) || @inet_pton('::1'))) {
            throw new \RuntimeException('Unable to check Ipv6. Check that PHP was not compiled with option "disable-ipv6".');
        }

        // IPv4 のアドレスを誤って渡していないかを確かめる。
        if (!filter_var($requestIp, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV6)) {
            return self::setCacheResult($cacheKey, false);
        }

        if (str_contains($ip, '/')) {
            [$address, $netmask] = explode('/', $ip, 2);

            if (!filter_var($address, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV6)) {
                return self::setCacheResult($cacheKey, false);
            }

            if ('0' === $netmask) {
                return (bool) unpack('n*', @inet_pton($address));
            }

            if (!ctype_digit($netmask) || 1 > (int) $netmask || 128 < (int) $netmask) {
                return self::setCacheResult($cacheKey, false);
            }

            $netmask = (int) $netmask;
        } else {
            if (!filter_var($ip, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV6)) {
                return self::setCacheResult($cacheKey, false);
            }

            $address = $ip;
            $netmask = 128;
        }

        $bytesAddr = unpack('n*', @inet_pton($address));
        $bytesTest = unpack('n*', @inet_pton($requestIp));

        if (!$bytesAddr || !$bytesTest) {
            return self::setCacheResult($cacheKey, false);
        }

        for ($i = 1, $ceil = ceil($netmask / 16); $i <= $ceil; ++$i) {
            $left = $netmask - 16 * ($i - 1);
            $left = ($left <= 16) ? $left : 16;
            $mask = ~(0xFFFF >> $left) & 0xFFFF;
            if (($bytesAddr[$i] & $mask) != ($bytesTest[$i] & $mask)) {
                return self::setCacheResult($cacheKey, false);
            }
        }

        return self::setCacheResult($cacheKey, true);
    }
```

```php:line-numbers=139 [原文]
    public static function checkIp6(string $requestIp, string $ip): bool
    {
        $cacheKey = $requestIp.'-'.$ip.'-v6';
        if (null !== $cacheValue = self::getCacheResult($cacheKey)) {
            return $cacheValue;
        }

        if (!((\extension_loaded('sockets') && \defined('AF_INET6')) || @inet_pton('::1'))) {
            throw new \RuntimeException('Unable to check Ipv6. Check that PHP was not compiled with option "disable-ipv6".');
        }

        // Check to see if we were given a IP4 $requestIp or $ip by mistake
        if (!filter_var($requestIp, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV6)) {
            return self::setCacheResult($cacheKey, false);
        }

        if (str_contains($ip, '/')) {
            [$address, $netmask] = explode('/', $ip, 2);

            if (!filter_var($address, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV6)) {
                return self::setCacheResult($cacheKey, false);
            }

            if ('0' === $netmask) {
                return (bool) unpack('n*', @inet_pton($address));
            }

            if (!ctype_digit($netmask) || 1 > (int) $netmask || 128 < (int) $netmask) {
                return self::setCacheResult($cacheKey, false);
            }

            $netmask = (int) $netmask;
        } else {
            if (!filter_var($ip, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV6)) {
                return self::setCacheResult($cacheKey, false);
            }

            $address = $ip;
            $netmask = 128;
        }

        $bytesAddr = unpack('n*', @inet_pton($address));
        $bytesTest = unpack('n*', @inet_pton($requestIp));

        if (!$bytesAddr || !$bytesTest) {
            return self::setCacheResult($cacheKey, false);
        }

        for ($i = 1, $ceil = ceil($netmask / 16); $i <= $ceil; ++$i) {
            $left = $netmask - 16 * ($i - 1);
            $left = ($left <= 16) ? $left : 16;
            $mask = ~(0xFFFF >> $left) & 0xFFFF;
            if (($bytesAddr[$i] & $mask) != ($bytesTest[$i] & $mask)) {
                return self::setCacheResult($cacheKey, false);
            }
        }

        return self::setCacheResult($cacheKey, true);
    }
```

:::

## 前提知識

- **IPv6**: 128 ビットのアドレスで、`2001:db8::1` のようにコロンで区切って書きます。
- **ネットマスク**: 範囲のうち、先頭から何ビットを比べるかを表す数字です（`/32` なら先頭 32 ビット）。
- **`inet_pton`**: IP アドレスの文字列を、バイナリ（生のバイト列）に変換する関数です。
- **`unpack('n*', ...)`**: バイナリを、2 バイトずつの数（ビッグエンディアンの 16 ビット整数）の配列に変換する関数です。
- **ビットマスク**: 特定のビットだけを残すための数値です。`&` 演算子と組み合わせて使います。

## 何をしているか

### 1. 両方が IPv6 として正しいかを確かめる

::: code-group

```php:line-numbers=146 [日本語訳]
        if (!((\extension_loaded('sockets') && \defined('AF_INET6')) || @inet_pton('::1'))) {
            throw new \RuntimeException('Unable to check Ipv6. Check that PHP was not compiled with option "disable-ipv6".');
        }

        // IPv4 のアドレスを誤って渡していないかを確かめる。
        if (!filter_var($requestIp, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV6)) {
            return self::setCacheResult($cacheKey, false);
        }
```

```php:line-numbers=146 [原文]
        if (!((\extension_loaded('sockets') && \defined('AF_INET6')) || @inet_pton('::1'))) {
            throw new \RuntimeException('Unable to check Ipv6. Check that PHP was not compiled with option "disable-ipv6".');
        }

        // Check to see if we were given a IP4 $requestIp or $ip by mistake
        if (!filter_var($requestIp, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV6)) {
            return self::setCacheResult($cacheKey, false);
        }
```

:::

IPv6 が使える環境かを確かめたうえで、`requestIp` が正しい IPv6 かを `filter_var` で調べます。IPv4 の形を渡していた場合は、ここで `false` になります。

### 2. 範囲の部分と、桁数を取り出す

```php:line-numbers=155
        if (str_contains($ip, '/')) {
            [$address, $netmask] = explode('/', $ip, 2);

            if (!filter_var($address, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV6)) {
                return self::setCacheResult($cacheKey, false);
            }

            if ('0' === $netmask) {
                return (bool) unpack('n*', @inet_pton($address));
            }

            if (!ctype_digit($netmask) || 1 > (int) $netmask || 128 < (int) $netmask) {
                return self::setCacheResult($cacheKey, false);
            }

            $netmask = (int) $netmask;
        } else {
            if (!filter_var($ip, \FILTER_VALIDATE_IP, \FILTER_FLAG_IPV6)) {
                return self::setCacheResult($cacheKey, false);
            }

            $address = $ip;
            $netmask = 128;
        }
```

`/` があれば、住所と桁数（`$netmask`）に分けます。桁数は 1 から 128 の間でなければなりません。`/` がなければ、単独のアドレスとして桁数を 128（全部）にします。

### 3. 16 ビットずつ、比べるべき部分だけを比較する

```php:line-numbers=180
        $bytesAddr = unpack('n*', @inet_pton($address));
        $bytesTest = unpack('n*', @inet_pton($requestIp));

        if (!$bytesAddr || !$bytesTest) {
            return self::setCacheResult($cacheKey, false);
        }

        for ($i = 1, $ceil = ceil($netmask / 16); $i <= $ceil; ++$i) {
            $left = $netmask - 16 * ($i - 1);
            $left = ($left <= 16) ? $left : 16;
            $mask = ~(0xFFFF >> $left) & 0xFFFF;
            if (($bytesAddr[$i] & $mask) != ($bytesTest[$i] & $mask)) {
                return self::setCacheResult($cacheKey, false);
            }
        }

        return self::setCacheResult($cacheKey, true);
```

`inet_pton` の結果を `unpack('n*', ...)` で、16 ビットの数の配列にします。そして `ceil($netmask / 16)` の回数だけ、16 ビットごとに比べます。

各回で `$left` は、その区切りで比べるビット数です。最後の区切りだけは途中で切れることがあるので、`~(0xFFFF >> $left) & 0xFFFF` で、先頭の `$left` ビットだけを残すマスクを作ります。比べて違えば、すぐに `false` を返します。

具体例として、`/40` なら区切りは 3 つです。3 つ目は `40 - 32 = 8` ビットだけ比べるので、マスクは `0xFF00` になります。

## ここがすごい

### IPv4 とは違う、16 ビット単位の比較

IPv4 では 32 桁の 2 進数の文字列を比べましたが、IPv6 では 128 桁の文字列を使うと扱いが重くなります。そこで 16 ビットずつの数に分けて、必要な区切りだけを比べる方法にしています。同じ考え方を、データの大きさに合わせて変えた書き方です。

### 途中で切れるビットを、マスクで表している

ネットマスクは 16 の倍数とは限りません。最後の区切りだけ、先頭の一部のビットを比べる必要があります。`0xFFFF >> $left` で作った値を反転させると、先頭 `$left` ビットだけが 1 のマスクになります。計算を式 1 つにまとめているので、どんな桁数でも同じ式で扱えます。

### 誤った形式をまず弾く

IPv4 のアドレスを IPv6 の関数に渡す間違いは、よくあることです。最初に `filter_var` で確かめて、違えば結果を `false` にします。この関数には、「入力の形を先に確かめる」という考え方が一貫しています。

## まとめ

- 長いアドレスは、扱いやすい大きさ（16 ビットなど）に区切ると比べやすい。
- 区切りの途中で止まるビット数は、マスクの式で一度に表せる。
- 入力が正しい形式かを最初に確かめると、後の計算が単純になる。
- 同じ判定でも、データの大きさに合わせて比べ方を変えると効率がよい。
