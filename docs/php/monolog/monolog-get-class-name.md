---
title: 無名クラスの長い名前を、読みやすい短い名前にする
description: Monolog の Utils::getClassName は、PHP の無名クラスの名前に含まれる NUL 文字以降の長いファイルの情報を切り捨て、親クラス名と @anonymous の形に整えます。ログに出る名前を短くする工夫です。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Utils.php
lines: [36, 47]
function: Utils::getClassName
difficulty: 3
format: 2
tags: [メタプログラミング, 文字列処理, ログ]
---
## ひとことで

`getClassName` は、クラスの名前を受け取り、無名クラス（名前を付けずに作るクラス）の場合は読みやすい形にして返す関数です。PHP は無名クラスに、ファイル名や行番号を含む長い内部名を付けるので、そのままログに出すと読みにくくなります。

## コード

```php:line-numbers=36
    public static function getClassName(string $class): string
    {
        if (false === ($pos = strpos($class, "@anonymous\0"))) {
            return $class;
        }

        if (false === ($parent = get_parent_class($class))) {
            return substr($class, 0, $pos + 10);
        }

        return $parent . '@anonymous';
    }
```

## 前提知識

- **無名クラス**: `new class { ... }` のように、名前を付けずにその場で作るクラスです。
- **内部のクラス名**: PHP は無名クラスに `class@anonymous` で始まる名前を付けます。その後ろに、NUL 文字（`\0`）と、定義された場所の情報が続きます。
- **NUL 文字 `\0`**: 値が 0 の文字です。PHP の文字列の中で、区切りの役割を果たすことがあります。
- **`strpos`**: 文字列の中で、指定した語が最初に現れる位置を返す関数です。見つからなければ `false` を返します。
- **`get_parent_class`**: オブジェクトやクラスの親クラス名を返す関数です。親が無ければ `false` を返します。
- **`.`（連結）**: 文字列をつなぐ演算子です。

## 何をしているか

### 1. 無名クラスでなければ、そのまま返す

```php:line-numbers=38
        if (false === ($pos = strpos($class, "@anonymous\0"))) {
            return $class;
        }
```

`@anonymous` と NUL 文字の組み合わせが見つからなければ、普通の名前なので、何もせず返します。見つかった位置を `$pos` に覚えます。

### 2. 親が無ければ、先頭の部分だけを残す

```php:line-numbers=42
        if (false === ($parent = get_parent_class($class))) {
            return substr($class, 0, $pos + 10);
        }
```

親クラスが無い無名クラスは、`class@anonymous` の形で名前を残します。`@anonymous` は 10 文字なので、`$pos + 10` の位置までを切り出すと、NUL より前の部分が得られます。

### 3. 親があれば、親の名前を使う

```php:line-numbers=46
        return $parent . '@anonymous';
```

親クラスがある無名クラスは、`親クラス名@anonymous` の形にします。たとえば `Logger` を継承した無名クラスは、`Logger@anonymous` と表示されます。

## ここがすごい

- **内部の表現を隠す**: NUL 以降の、ファイル名や行番号を含む情報をログに出さないようにしています。ログを読む人が、無関係な情報を見なくて済みます。
- **親の名前で意味を伝える**: 親クラスの名前を残すと、「どの型の無名クラスか」が分かります。ただの `@anonymous` より、情報が多く残ります。
- **マジックナンバーの理由が明確**: `10` は `@anonymous` の文字数です。`$pos + 10` が「`@anonymous` の終わり」を指すことを、読み手は文字数から理解できます。
- **普通の名前には触れない**: 早めに返すので、通常のクラス名の処理が余計な影響を受けません。

## まとめ

- PHP の無名クラスの名前は、内部の情報を含むので、そのまま表示せずに整える。
- NUL 文字の位置で区切ると、表示に必要な部分だけを取り出せる。
- 親クラスがあれば、その名前を使うと型の情報が残る。
- 通常の名前は早めに返して、特別な場合だけを処理する。
