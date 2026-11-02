---
title: "サーバーから届いた Cookie を、安全な条件だけで保存する"
description: "Guzzle の CookieJar::extractCookies は、レスポンスの Set-Cookie を読み、ドメインや https などの条件を確かめてから Cookie を保存します。"
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling <mtdowling@gmail.com>
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/Cookie/CookieJar.php
lines: [243, 291]
function: CookieJar::extractCookies
difficulty: 3
format: 2
tags: [セキュリティ, ネットワーク]
---

## ひとことで

Web サーバーは、レスポンスの `Set-Cookie` という見出しで Cookie を送ってきます。この関数は、その Cookie を全部そのまま保存するのではなく、安全な条件を 1 つずつ確かめてから保存します。

## コード

::: code-group

```php:line-numbers=243 [日本語訳]
    public function extractCookies(
        #[\SensitiveParameter]
        RequestInterface $request,
        #[\SensitiveParameter]
        ResponseInterface $response
    ): void {
        if ($cookieHeader = $response->getHeader('Set-Cookie')) {
            $uri = $request->getUri();
            $requestHost = HostIdentity::canonicalHost($uri->getHost());
            $secure = $uri->getScheme() === 'https';
            $accepted = 0;

            foreach ($cookieHeader as $cookie) {
                if (\strlen($cookie) > self::MAX_SET_COOKIE_FIELD_LENGTH) {
                    continue;
                }

                $sc = SetCookie::fromString($cookie);
                $domain = $sc->getDomain();
                if ($domain === null || $domain === '') {
                    $sc->setDomain($requestHost);
                    $sc->setHostOnly(true);
                } else {
                    $sc->setHostOnly(false);
                }
                if (0 !== \strpos($sc->getPath(), '/')) {
                    $sc->setPath($this->getCookiePathFromRequest($request));
                }
                if (!$sc->matchesDomain($requestHost)) {
                    continue;
                }
                if (!$secure && ($sc->getSecure() || $this->overlaysSecureCookie($sc))) {
                    continue;
                }
                $prefixName = Psr7\Utils::asciiToLower((string) $sc->getName());
                if (\str_starts_with($prefixName, '__secure-') && !$sc->getSecure()) {
                    continue;
                }
                if (\str_starts_with($prefixName, '__host-') && (!$sc->getSecure() || !$sc->getHostOnly() || $sc->getPath() !== '/' || !self::hasPathAttribute($cookie))) {
                    continue;
                }
                // ここでは、`$sc->getDomain()` が公開サフィックス（com のような、誰でも登録できる範囲）なら拒否すべきだが、
                // 完全な公開サフィックス一覧（PSL）のライブラリは取り込みたくないので、ここでは拒否の処理を入れていない。
                if ($this->setCookie($sc) && ++$accepted === self::MAX_SET_COOKIE_FIELDS) {
                    break;
                }
            }
        }
    }
```

```php:line-numbers=243 [原文]
    public function extractCookies(
        #[\SensitiveParameter]
        RequestInterface $request,
        #[\SensitiveParameter]
        ResponseInterface $response
    ): void {
        if ($cookieHeader = $response->getHeader('Set-Cookie')) {
            $uri = $request->getUri();
            $requestHost = HostIdentity::canonicalHost($uri->getHost());
            $secure = $uri->getScheme() === 'https';
            $accepted = 0;

            foreach ($cookieHeader as $cookie) {
                if (\strlen($cookie) > self::MAX_SET_COOKIE_FIELD_LENGTH) {
                    continue;
                }

                $sc = SetCookie::fromString($cookie);
                $domain = $sc->getDomain();
                if ($domain === null || $domain === '') {
                    $sc->setDomain($requestHost);
                    $sc->setHostOnly(true);
                } else {
                    $sc->setHostOnly(false);
                }
                if (0 !== \strpos($sc->getPath(), '/')) {
                    $sc->setPath($this->getCookiePathFromRequest($request));
                }
                if (!$sc->matchesDomain($requestHost)) {
                    continue;
                }
                if (!$secure && ($sc->getSecure() || $this->overlaysSecureCookie($sc))) {
                    continue;
                }
                $prefixName = Psr7\Utils::asciiToLower((string) $sc->getName());
                if (\str_starts_with($prefixName, '__secure-') && !$sc->getSecure()) {
                    continue;
                }
                if (\str_starts_with($prefixName, '__host-') && (!$sc->getSecure() || !$sc->getHostOnly() || $sc->getPath() !== '/' || !self::hasPathAttribute($cookie))) {
                    continue;
                }
                // Note: At this point `$sc->getDomain()` being a public suffix should
                // be rejected, but we don't want to pull in the full PSL dependency.
                if ($this->setCookie($sc) && ++$accepted === self::MAX_SET_COOKIE_FIELDS) {
                    break;
                }
            }
        }
    }
```

:::

## 前提知識

- **Cookie**: ブラウザや HTTP クライアントが、サーバーからの情報を次の通信でも覚えておくための小さな文字列です。
- **ドメインとパス**: Cookie を送ってよい範囲です。ドメインは「どのホストか」、パスは「どの URL の下か」を表します。
- **`https`**: 暗号化された通信のことです。`secure` という印が付いた Cookie は、https の通信でしか扱わないようにします。
- **`foreach` と `break`**: 配列を順に取り出して処理し、必要なところで途中で抜ける命令です。

## 何をしているか

### 1. `Set-Cookie` があるかを確かめる

```php:line-numbers=249
        if ($cookieHeader = $response->getHeader('Set-Cookie')) {
```

レスポンスの見出しに `Set-Cookie` がなければ、何もせずに終わります。

### 2. 送った先のホストと、通信の種類を用意する

```php:line-numbers=250
            $uri = $request->getUri();
            $requestHost = HostIdentity::canonicalHost($uri->getHost());
            $secure = $uri->getScheme() === 'https';
            $accepted = 0;
```

リクエストの URL から、ホスト名と `https` かどうかを取り出します。Cookie を保存するときの基準にするためです。

### 3. 1 つずつ読み、長すぎるものは飛ばす

```php:line-numbers=255
            foreach ($cookieHeader as $cookie) {
                if (\strlen($cookie) > self::MAX_SET_COOKIE_FIELD_LENGTH) {
                    continue;
                }
```

Cookie の文字列が長すぎれば、そのまま次へ進みます。

### 4. ドメインとパスを整える

```php:line-numbers=260
                $sc = SetCookie::fromString($cookie);
                $domain = $sc->getDomain();
                if ($domain === null || $domain === '') {
                    $sc->setDomain($requestHost);
                    $sc->setHostOnly(true);
                } else {
                    $sc->setHostOnly(false);
                }
                if (0 !== \strpos($sc->getPath(), '/')) {
                    $sc->setPath($this->getCookiePathFromRequest($request));
                }
```

ドメインが空なら、リクエストのホスト名を入れて、ホスト専用の Cookie にします。パスが `/` で始まらなければ、リクエストの URL からパスを作り直します。

### 5. 安全性の条件を確かめる

```php:line-numbers=271
                if (!$sc->matchesDomain($requestHost)) {
                    continue;
                }
                if (!$secure && ($sc->getSecure() || $this->overlaysSecureCookie($sc))) {
                    continue;
                }
                $prefixName = Psr7\Utils::asciiToLower((string) $sc->getName());
                if (\str_starts_with($prefixName, '__secure-') && !$sc->getSecure()) {
                    continue;
                }
                if (\str_starts_with($prefixName, '__host-') && (!$sc->getSecure() || !$sc->getHostOnly() || $sc->getPath() !== '/' || !self::hasPathAttribute($cookie))) {
                    continue;
                }
```

ドメインが合わないもの、`https` でないのに `secure` 印が付いたもの、`__Secure-` や `__Host-` という名前の決まりに合わないものは、保存せずに飛ばします。

### 6. 保存して、数の上限で止める

```php:line-numbers=286
                if ($this->setCookie($sc) && ++$accepted === self::MAX_SET_COOKIE_FIELDS) {
                    break;
                }
```

`setCookie` で保存し、受け入れた数が上限に達したら `break` で止めます。

## ここがすごい

### 名前の決まりで、安全な Cookie を見分ける

```php:line-numbers=277
                $prefixName = Psr7\Utils::asciiToLower((string) $sc->getName());
                if (\str_starts_with($prefixName, '__secure-') && !$sc->getSecure()) {
                    continue;
                }
                if (\str_starts_with($prefixName, '__host-') && (!$sc->getSecure() || !$sc->getHostOnly() || $sc->getPath() !== '/' || !self::hasPathAttribute($cookie))) {
                    continue;
                }
```

`__Secure-` で始まる Cookie は、`secure` 印が付いていなければ保存しません。`__Host-` で始まる Cookie は、さらにドメインを指定せず、パスが `/` でなければなりません。名前だけで、安全に扱うべき Cookie を区別できる仕組みです。

### 1 つの悪い Cookie で全体を止めない

```php:line-numbers=255
            foreach ($cookieHeader as $cookie) {
                if (\strlen($cookie) > self::MAX_SET_COOKIE_FIELD_LENGTH) {
                    continue;
                }
```

条件に合わない Cookie は `continue` で飛ばすだけです。ほかの Cookie の保存は続きます。

## まとめ

この関数は、サーバーからの Cookie を「ドメイン」「https」「名前の決まり」「長さ」「数」で順に確かめてから保存します。一つ一つは短い条件ですが、積み重ねることで、悪意のある Cookie を受け入れにくくしています。
