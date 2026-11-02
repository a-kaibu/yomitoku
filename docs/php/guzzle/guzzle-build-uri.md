---
title: 送信する URL を、設定に合わせて整える
description: Guzzle の buildUri は、リクエストの URL に base_uri を組み合わせ、国際化ドメイン名を変換し、スキームが無いときは http を補います。利用者が短く書いた URL を、実際に送れる完全な形にする関数です。
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling, Copyright (c) 2012 Jeremy Lindblom
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/Client.php
lines: [679, 699]
function: buildUri
difficulty: 2
format: 2
tags: [ネットワーク, 文字列処理, 移植性]
---
## ひとことで

`buildUri` は、Guzzle の HTTP クライアントが、リクエストの URL を実際に送れる形に整える関数です。`base_uri` が指定されていれば相対的な URL を解決し、日本語などを含むドメイン名を変換し、スキームが無ければ `http` を付けます。利用者は、短い URL を書くだけで済みます。

## コード

```php:line-numbers=679
    private function buildUri(
        UriInterface $uri,
        #[\SensitiveParameter]
        array $config
    ): UriInterface {
        if (isset($config['base_uri'])) {
            $uriFactory = self::requireUriFactory($config[RequestOptions::URI_FACTORY] ?? new HttpFactory());
            $uri = Psr7\UriResolver::resolve(self::createUri($config['base_uri'], $uriFactory), $uri);
        }

        $idnOptions = Idn::normalizeConversionOption($config['idn_conversion'] ?? null);
        if ($idnOptions !== null) {
            $uri = Idn::convertUri($uri, $idnOptions);
        }

        if ($uri->getScheme() === '' && $uri->getHost() !== '') {
            $uri = $uri->withScheme('http');
        }

        return $uri;
    }
```

## 前提知識

- **URI**: `https://example.com/path?x=1` のように、資源の場所を表す文字列です。スキーム、ホスト、パスなどの部分に分かれます。
- **`base_uri`**: クライアントに設定する、基準になる URL です。`/users` のような相対的な URL は、これに対して解決されます。
- **IDN（国際化ドメイン名）**: `例え.jp` のように、ASCII 以外の文字を含むドメイン名です。通信では `xn--` で始まる ASCII の形に変換して送ります。
- **PSR-7 の UriInterface**: URI を表す共通のインターフェースです。`withScheme` などのメソッドで、変更した新しい URI を作れます。
- **`??`**: 左側の値が `null` のときに、右側の値を使う演算子です。`$config[...] ?? new HttpFactory()` のように、設定が無いときの既定の値を用意するのに使われます。

## 何をしているか

### 1. base_uri があれば、相対的な URL を解決する

```php:line-numbers=684
        if (isset($config['base_uri'])) {
            $uriFactory = self::requireUriFactory($config[RequestOptions::URI_FACTORY] ?? new HttpFactory());
            $uri = Psr7\UriResolver::resolve(self::createUri($config['base_uri'], $uriFactory), $uri);
        }
```

設定に `base_uri` があるとき、それを URI に変換してから、`UriResolver::resolve` で元の URI を解決します。`/users` のような相対的な URL が、基準となる URL の下で完全な形になります。

### 2. IDN を変換する

```php:line-numbers=689
        $idnOptions = Idn::normalizeConversionOption($config['idn_conversion'] ?? null);
        if ($idnOptions !== null) {
            $uri = Idn::convertUri($uri, $idnOptions);
        }
```

`idn_conversion` の設定から、変換の方法を決めます。指定がなければ `null` になり、変換は行われません。変換が必要なときだけ、`Idn::convertUri` でホスト名を ASCII の形に直します。

### 3. スキームが無ければ http を付ける

```php:line-numbers=694
        if ($uri->getScheme() === '' && $uri->getHost() !== '') {
            $uri = $uri->withScheme('http');
        }
```

スキームが空で、ホストが分かっているときは、`withScheme('http')` で `http` を付けます。`example.com/path` のように書かれた URL を、通信できる形にするためです。

### 4. 整えた URI を返す

```php:line-numbers=698
        return $uri;
```

最後に、整えた URI を返します。

## ここがすごい

- 3 つの整え方を、順番に 1 つずつ適用しているので、どの段階で何が起きるかが読み取りやすい作りです。各段は、条件に合うときだけ動きます。
- 基準 URL の解決を、IDN の変換より先に行っています。基準の中のドメイン名も、同じ変換を受けられます。
- スキームの補完を最後に置いています。`base_uri` によって、すでにスキームが決まっていれば、余計な `http` を付けません。
- 利用者が設定を書く場所は `config` の連想配列だけで、この関数は内部の詳細を隠しています。呼び出し側は、URL を渡して結果を受け取るだけです。

## まとめ

`buildUri` は、リクエストの URL を、基準の URL、国際化ドメイン名、スキームの補完という 3 段階で整える関数です。短く書いた URL を、確実に送れる形へ変換します。Guzzle の使いやすさを支えている、目立たないけれど大切な処理です。
