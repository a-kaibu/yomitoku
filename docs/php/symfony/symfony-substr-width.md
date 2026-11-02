---
title: 文字の幅を考えて、ターミナル用に部分文字列を切る
description: Symfony Console の Helper::substr は、ASCII だけなら標準の substr を使い、日本語や絵文字を含むときは書記素単位で切ります。見た目の幅を崩さないための使い分けです。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "e6396e82011ded4608b896e8fff4da24d253382a"
file: src/Symfony/Component/Console/Helper/Helper.php
lines: [92, 109]
function: Helper::substr
difficulty: 3
format: 2
tags: [Unicode, 文字列処理, CLI]
---
## ひとことで

`Helper::substr` は、ターミナルに表示される文字列の一部を切り出す関数です。ASCII だけの文字列なら PHP の `substr` を使い、日本語や絵文字を含むときは、表示上の 1 文字（書記素）単位で切ります。

## コード

```php:line-numbers=92
    public static function substr(?string $string, int $from, ?int $length = null): string
    {
        $string ??= '';

        if (0 === $match = preg_match('/[^\x00-\x0C\x0E-\x7F]/u', $string)) {
            return substr($string, $from, $length);
        }

        if ($match) {
            return (new UnicodeString($string))->slice($from, $length);
        }

        if (false === $encoding = mb_detect_encoding($string, null, true)) {
            return substr($string, $from, $length);
        }

        return mb_substr($string, $from, $length, $encoding);
    }
```

## 前提知識

- **バイトと文字**: `substr` は、文字列をバイト単位で切ります。UTF-8 の日本語は 1 文字が 3 バイトなので、途中で切ると文字が壊れます。
- **書記素（グラフィム）**: 人が 1 文字と感じる単位です。`é` は 1 書記素ですが、コードの上では 2 つの文字で書かれることがあります。
- **正規表現の `\x00-\x0C\x0E-\x7F`**: ASCII の範囲の文字を表す記号です。`[^...]` は、その範囲以外の文字を探す意味になります。
- **`preg_match` の戻り値**: 一致すれば `1`、しなければ `0`、エラーなら `false` を返します。
- **`UnicodeString`**: Symfony の String コンポーネントの型で、書記素単位の操作を提供します。
- **`mb_substr`**: マルチバイトの文字列を、文字単位で切る関数です。

## 何をしているか

### 1. ASCII だけなら標準の substr

```php:line-numbers=96
        if (0 === $match = preg_match('/[^\x00-\x0C\x0E-\x7F]/u', $string)) {
            return substr($string, $from, $length);
        }
```

正規表現で、ASCII 以外の文字を探します。見つからなければ（戻り値が 0）、文字列は ASCII だけです。そのときは、ASCII 1 文字がバイト 1 つと対応するので、標準の `substr` で十分です。

### 2. 非 ASCII 文字があれば書記素で切る

```php:line-numbers=100
        if ($match) {
            return (new UnicodeString($string))->slice($from, $length);
        }
```

非 ASCII の文字が見つかったら、`UnicodeString` に包んで `slice` を呼びます。`slice` は書記素の単位で切り出すので、日本語の 1 文字を途中で割る心配がありません。

### 3. 文字コードが判定できなければ標準の関数

```php:line-numbers=104
        if (false === $encoding = mb_detect_encoding($string, null, true)) {
            return substr($string, $from, $length);
        }

        return mb_substr($string, $from, $length, $encoding);
```

文字コードを判定できないときは、標準の `substr` に戻します。判定できたときは、その文字コードで `mb_substr` を使い、文字単位で切ります。

## ここがすごい

- **速い道と正確な道を分ける**: ASCII だけの文字列は、正規表現の 1 回の確認で標準関数に流れます。大量の行を表示するときにも、遅くなりにくい作りです。
- **表示の幅を意識している**: ターミナルでは、日本語は 2 桁分の幅を取ります。切り出しの単位を文字として揃えると、表の列がずれにくくなります。
- **失敗の経路が明確**: 判定できない場合の戻り先が、標準の `substr` と決まっています。例外で止まらず、最低限の結果を返します。
- **型と名前の一致**: 切り出しの単位は、関数名の `substr` に似ていますが、中身は表示の単位に合わせて変わります。

## まとめ

- ASCII だけなら標準の `substr` で十分で、速い。
- 日本語や絵文字を含むなら、書記素や文字単位で切らないと壊れる。
- 文字コードの判定に失敗したときの戻り先を決めておくと、安全に動く。
- 「表示される幅」を意識すると、ターミナルの表示が崩れにくくなる。
