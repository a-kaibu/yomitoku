---
title: 文字を壊さずにバイト数で切る、ログ用の部分文字列
description: Monolog の Utils::substr は、mbstring が使えるとき mb_strcut でバイト数を指定して切ります。途中で多バイト文字を割らないので、長いログを切っても文字化けしにくくなります。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Utils.php
lines: [103, 110]
function: Utils::substr
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, ログ]
---
## ひとことで

`Utils::substr` は、文字列の一部をバイト数で切り出す関数です。ログのメッセージが大きすぎるときに、上限のバイト数で切るような場面で使われます。mbstring が使える場合は `mb_strcut` を使い、文字の途中で切れないようにします。

## コード

```php:line-numbers=103
    public static function substr(string $string, int $start, ?int $length = null): string
    {
        if (\extension_loaded('mbstring')) {
            return mb_strcut($string, $start, $length);
        }

        return substr($string, $start, (null === $length) ? \strlen($string) : $length);
    }
```

## 前提知識

- **バイトと文字**: UTF-8 では、日本語の 1 文字は 3 バイトです。`substr` は、バイトの位置で切るので、途中で切ると文字が壊れます。
- **`mb_strcut`**: 指定したバイト数の範囲で切り出す関数です。切る位置が多バイト文字の途中にかかる場合は、文字の手前で止めます。
- **`mb_substr` との違い**: `mb_substr` は文字数で切ります。`mb_strcut` はバイト数で切ります。ログの容量を守るには、バイト数のほうが都合が良いことがあります。
- **`extension_loaded`**: 拡張機能が読み込まれているかを調べる関数です。
- **`\`（名前空間の先頭）**: 組み込み関数を明示して呼ぶための印です。

## 何をしているか

### 1. mbstring があれば mb_strcut を使う

```php:line-numbers=105
        if (\extension_loaded('mbstring')) {
            return mb_strcut($string, $start, $length);
        }
```

mbstring の拡張が入っていれば、`mb_strcut` で切ります。`$start` と `$length` は、どちらもバイト数です。

たとえば `日本語` は 9 バイトです。最初の 4 バイトで切ると、`日` の 3 バイトの後ろの 1 バイトは、途中で切れるはずの文字です。`mb_strcut` は、その文字を含めずに `日` だけを返します。

### 2. 拡張が無ければ標準の substr を使う

```php:line-numbers=109
        return substr($string, $start, (null === $length) ? \strlen($string) : $length);
```

mbstring が無い場合は、標準の `substr` を使います。長さが省略されたときは、文字列の長さを渡して、末尾まで切ります。`null` の扱いを、ここで揃えています。

ただし標準の `substr` は、文字の途中でも切ってしまいます。そのため、拡張が無い環境では、日本語の途中で文字化けが起きる可能性があります。

## ここがすごい

- **バイト数の制限に強い**: ログの上限はバイト数で決まることが多いので、バイト単位で切れる関数を使うと、上限をきちんと守れます。
- **文字の途中で切らない**: `mb_strcut` は、多バイト文字の境界で止まります。上限ぎりぎりで切っても、壊れた文字が残りにくいです。
- **代わりの経路を用意する**: 拡張が無い環境でも、動かなくなるのではなく、標準の関数で同じ形の結果を返します。
- **引数の `null` を吸収する**: 長さの省略を、この関数の中で一度だけ処理しています。呼び出し側は `null` を気にせずに書けます。

## まとめ

- ログの上限をバイト数で守るなら、バイト単位で切る関数を使う。
- 多バイト文字を含む文字列は、文字の境界で止まる `mb_strcut` が安全。
- 拡張の有無で結果が変わる場合は、代わりの経路を用意して、動作を止めない。
- 文字数で切るか、バイト数で切るかは、目的（表示か容量か）で選ぶ。
