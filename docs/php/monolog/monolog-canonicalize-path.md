---
title: "ログの保存先を、どこから実行しても同じ絶対パスにする"
description: "Monolog の canonicalizePath は、ログファイルの相対パスを、現在のフォルダを基準にした絶対パスに変えます。file:// の付いた書き方と、Windows のドライブ指定も扱います。"
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Utils.php
lines: [117, 138]
function: Utils::canonicalizePath
difficulty: 2
format: 2
tags: [移植性, 文字列処理, ファイル]
---

## ひとことで

`canonicalizePath` は、ログの保存先（`logs/app.log` のような相対パス）を、**絶対パス**（`/home/app/logs/app.log`）に変えます。どのフォルダから実行しても、同じファイルに書けるようにするためです。

## コード

::: code-group

```php:line-numbers=117 [日本語訳]
    public static function canonicalizePath(string $streamUrl): string
    {
        $prefix = '';
        if ('file://' === substr($streamUrl, 0, 7)) {
            $streamUrl = substr($streamUrl, 7);
            $prefix = 'file://';
        }

        // ほかの種類のストリーム（php:// など）は扱わない。
        if (false !== strpos($streamUrl, '://')) {
            return $streamUrl;
        }

        // すでに絶対パス。
        if (substr($streamUrl, 0, 1) === '/' || substr($streamUrl, 1, 1) === ':' || substr($streamUrl, 0, 2) === '\\\\') {
            return $prefix.$streamUrl;
        }

        $streamUrl = getcwd() . '/' . $streamUrl;

        return $prefix.$streamUrl;
    }
```

```php:line-numbers=117 [原文]
    public static function canonicalizePath(string $streamUrl): string
    {
        $prefix = '';
        if ('file://' === substr($streamUrl, 0, 7)) {
            $streamUrl = substr($streamUrl, 7);
            $prefix = 'file://';
        }

        // other type of stream, not supported
        if (false !== strpos($streamUrl, '://')) {
            return $streamUrl;
        }

        // already absolute
        if (substr($streamUrl, 0, 1) === '/' || substr($streamUrl, 1, 1) === ':' || substr($streamUrl, 0, 2) === '\\\\') {
            return $prefix.$streamUrl;
        }

        $streamUrl = getcwd() . '/' . $streamUrl;

        return $prefix.$streamUrl;
    }
```

:::

## 前提知識

- **絶対パスと相対パス**: 絶対パスは `/` や `C:` から始まる完全な場所です。相対パスは、今いるフォルダからの位置です。
- **`file://`**: ファイルを表す URL の形式です。`file:///var/log/app.log` のように書きます。
- **ストリーム**: PHP で、ファイルや URL を同じ方法で読み書きするための仕組みです。`php://stdout` のような書き方があります。
- **`getcwd()`**: 今いるフォルダ（作業ディレクトリ）の絶対パスを返す関数です。
- **`substr`**: 文字列の一部を取り出す関数です。先頭の文字を調べるのに使います。

## 何をしているか

### 1. `file://` を取り外して覚えておく

```php:line-numbers=119
        $prefix = '';
        if ('file://' === substr($streamUrl, 0, 7)) {
            $streamUrl = substr($streamUrl, 7);
            $prefix = 'file://';
        }
```

先頭が `file://` なら、それを取り除き、後で付け直すために `$prefix` に覚えておきます。

### 2. ほかのストリームは、そのまま返す

::: code-group

```php:line-numbers=125 [日本語訳]
        // ほかの種類のストリーム（php:// など）は扱わない。
        if (false !== strpos($streamUrl, '://')) {
            return $streamUrl;
        }
```

```php:line-numbers=125 [原文]
        // other type of stream, not supported
        if (false !== strpos($streamUrl, '://')) {
            return $streamUrl;
        }
```

:::

`://` を含むものは、`php://` などほかの種類のストリームです。パスではないので、手を加えずに返します。

### 3. すでに絶対パスなら、そのまま返す

::: code-group

```php:line-numbers=130 [日本語訳]
        // すでに絶対パス。
        if (substr($streamUrl, 0, 1) === '/' || substr($streamUrl, 1, 1) === ':' || substr($streamUrl, 0, 2) === '\\\\') {
            return $prefix.$streamUrl;
        }
```

```php:line-numbers=130 [原文]
        // already absolute
        if (substr($streamUrl, 0, 1) === '/' || substr($streamUrl, 1, 1) === ':' || substr($streamUrl, 0, 2) === '\\\\') {
            return $prefix.$streamUrl;
        }
```

:::

先頭が `/`、2 文字目が `:`（ドライブ文字）、または `\\` で始まっていれば、もう絶対パスです。`$prefix` を付けて返します。

### 4. 相対パスなら、今のフォルダをつなぐ

```php:line-numbers=135
        $streamUrl = getcwd() . '/' . $streamUrl;

        return $prefix.$streamUrl;
```

残りは相対パスとみなし、`getcwd()` で得た今のフォルダの絶対パスに `/` とつなぎます。

具体例として、今のフォルダが `/srv/app` のときに `logs/app.log` を渡すと、`/srv/app/logs/app.log` になります。

## ここがすごい

### 「何をしないか」を先に決めている

この関数は、対応しないストリームや、もう絶対パスのものには手を加えません。変換が必要なものだけを扱うので、予想外の書き換えを防げます。最初の条件分岐が、変換の範囲を明確にしています。

### Windows のパスも、同じ判定で扱う

`C:` のようなドライブ名や、`\\server` のネットワーク共有は、Windows の絶対パスです。Linux のルールだけで判定すると、これらを相対パスとして誤って扱ってしまいます。OS の違いを 1 つの条件にまとめて扱っています。

### `file://` を取り除いて、付け直す

中身の処理を、`file://` のない普通のパスとして行えるようにしています。処理の中心を単純に保ち、外側だけで形式の違いを包むのが、この関数の考え方です。

## まとめ

- パスを絶対パスにそろえると、実行する場所に左右されなくなる。
- 変換の対象を先に絞ると、予想外の書き換えを防げる。
- OS ごとの絶対パスの形を知っておくと、判定を間違えない。
- 形式の違い（`file://` など）は外側で取り除き、中身は単純な形で扱う。
