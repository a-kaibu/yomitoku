---
title: "「128M」のような設定の書き方を、バイト数に直す"
description: "Monolog の expandIniShorthandBytes は、php.ini にある 128M や 2G のような省略形のサイズを、バイト数の整数に変えます。switch の break を省いて、単位を順に掛けていく工夫が見どころです。"
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Utils.php
lines: [279, 307]
function: Utils::expandIniShorthandBytes
difficulty: 2
format: 2
tags: [数値計算, 文字列処理, 正規表現]
---

## ひとことで

`expandIniShorthandBytes` は、PHP の設定ファイル（php.ini）に書かれる **サイズの省略形**（`128M` や `2G`）を、バイト数の整数に変換する関数です。メモリの上限などを、プログラムで比べられるようにします。

## コード

::: code-group

```php:line-numbers=279 [日本語訳]
    public static function expandIniShorthandBytes($val)
    {
        if (!\is_string($val)) {
            return false;
        }

        // -1 のような値は、そのまま返す。
        if ((int) $val < 0) {
            return (int) $val;
        }

        if (!(bool) preg_match('/^\s*(?<val>\d+)(?:\.\d+)?\s*(?<unit>[gmk]?)\s*$/i', $val, $match)) {
            return false;
        }

        $val = (int) $match['val'];
        switch (strtolower($match['unit'])) {
            case 'g':
                $val *= 1024;
                // break がないので、次の case へ続く（意図的）。
            case 'm':
                $val *= 1024;
                // break がないので、次の case へ続く（意図的）。
            case 'k':
                $val *= 1024;
        }

        return $val;
    }
```

```php:line-numbers=279 [原文]
    public static function expandIniShorthandBytes($val)
    {
        if (!\is_string($val)) {
            return false;
        }

        // support -1
        if ((int) $val < 0) {
            return (int) $val;
        }

        if (!(bool) preg_match('/^\s*(?<val>\d+)(?:\.\d+)?\s*(?<unit>[gmk]?)\s*$/i', $val, $match)) {
            return false;
        }

        $val = (int) $match['val'];
        switch (strtolower($match['unit'])) {
            case 'g':
                $val *= 1024;
                // no break
            case 'm':
                $val *= 1024;
                // no break
            case 'k':
                $val *= 1024;
        }

        return $val;
    }
```

:::

## 前提知識

- **php.ini**: PHP の動作を決める設定ファイルです。`memory_limit = 128M` のように書きます。
- **省略形の単位**: `K`（キロ）、`M`（メガ）、`G`（ギガ）のことです。ここでは 1 K = 1024 バイトです。
- **`switch` と `break`**: `break` がないと、次の `case` の処理も続けて実行される PHP の書き方です。
- **`strtolower`**: 文字列を小文字にする関数です。単位の大文字・小文字の違いを吸収します。
- **名前付きグループ `(?<val>...)`**: 正規表現の一致から、名前で値を取り出す書き方です。

## 何をしているか

### 1. 負の数や、文字列以外を先に扱う

::: code-group

```php:line-numbers=281 [日本語訳]
        if (!\is_string($val)) {
            return false;
        }

        // -1 のような値は、そのまま返す。
        if ((int) $val < 0) {
            return (int) $val;
        }
```

```php:line-numbers=281 [原文]
        if (!\is_string($val)) {
            return false;
        }

        // support -1
        if ((int) $val < 0) {
            return (int) $val;
        }
```

:::

文字列でなければ `false` を返します。`-1` のように負の値は、「無制限」を表す特別な値なので、そのまま整数として返します。

### 2. 数と単位の形を、正規表現で確かめる

```php:line-numbers=290
        if (!(bool) preg_match('/^\s*(?<val>\d+)(?:\.\d+)?\s*(?<unit>[gmk]?)\s*$/i', $val, $match)) {
            return false;
        }
```

`/^\s*(?<val>\d+)(?:\.\d+)?\s*(?<unit>[gmk]?)\s*$/i` は、「数字 + 任意の単位」の形にマッチします。数字の部分は `val`、単位の部分は `unit` という名前で取り出せます。合わなければ `false` です。

### 3. 単位を、下の段から順に掛ける

::: code-group

```php:line-numbers=294 [日本語訳]
        $val = (int) $match['val'];
        switch (strtolower($match['unit'])) {
            case 'g':
                $val *= 1024;
                // break がないので、次の case へ続く（意図的）。
            case 'm':
                $val *= 1024;
                // break がないので、次の case へ続く（意図的）。
            case 'k':
                $val *= 1024;
        }

        return $val;
```

```php:line-numbers=294 [原文]
        $val = (int) $match['val'];
        switch (strtolower($match['unit'])) {
            case 'g':
                $val *= 1024;
                // no break
            case 'm':
                $val *= 1024;
                // no break
            case 'k':
                $val *= 1024;
        }

        return $val;
```

:::

`val` を整数にして、単位によって 1024 を掛けます。`g` の場合は、`case 'g'` から `case 'm'`、`case 'k'` へと落ちていき、3 回掛けられます。`no break` のコメントは、その落ち込みが意図的であることを示しています。

具体例として `2G` は、`2 × 1024 × 1024 × 1024 = 2147483648` になります。

## ここがすごい

### 単位の掛け算を、落ち込みで書いている

`G` は `M` の 1024 倍、`M` は `K` の 1024 倍です。だから、`G` のときは 3 回、`M` のときは 2 回、1024 を掛ければよいことになります。`break` を書かずに下の `case` へ落とすと、この「段数」がそのまま表せます。if を 3 つ並べるより、単位の関係が一目でわかります。

### 負の数は「無制限」として通す

PHP の `memory_limit` では `-1` が「制限なし」を表します。単位の形として不正にせず、特別に通すことで、設定の意味を正しく扱えます。

### 小数は、受け取ってから切り捨てる

```php:line-numbers=290
        if (!(bool) preg_match('/^\s*(?<val>\d+)(?:\.\d+)?\s*(?<unit>[gmk]?)\s*$/i', $val, $match)) {
```

`(?:\.\d+)?` で小数の部分をいったん受け取り、残りは捨てます。`2.5G` は `2G` として扱われます。厳密さより、読みやすさと実用性を選んだ書き方です。

## まとめ

- 単位の関係が段階的なら、`break` を省いた switch で掛け算を重ねられる。
- 特別な値（`-1` など）は、形式の判定より前に通すと意図がわかりやすい。
- 正規表現に名前を付けると、一致した部分が何かを読み手に示せる。
- 小数の扱いのように、厳密さより用途に合う割り切りを選ぶこともある。
