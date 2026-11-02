---
title: 文字列の先頭を取り出して、残りを元の変数に戻す
description: phpseclib の Strings::shift は、参照渡しの文字列から先頭の数バイトを取り出し、残りを同じ変数に書き戻します。暗号の通信データを、順番に読み進めるための小さな関数です。
language: php
project: phpseclib
repo: https://github.com/phpseclib/phpseclib
license: MIT
copyright: Copyright (c) 2011-2026 TerraFrost and other contributors
commit: "694f9b2336a4923f86ce7c69ad5ab480ff97728b"
file: phpseclib/Common/Functions/Strings.php
lines: [35, 40]
function: Strings::shift
difficulty: 1
format: 2
tags: [パース, 文字列処理, ネットワーク]
---
## ひとことで

`shift` は、文字列の先頭から指定したバイト数を取り出して返し、残りの部分を元の変数に書き戻す関数です。SSH や暗号の通信では、受け取ったデータを、フィールドの順番どおりに読み進めるときに使われます。

## コード

```php:line-numbers=35
    public static function shift(string &$string, int $index = 1): string
    {
        $substr = substr($string, 0, $index);
        $string = substr($string, $index);
        return $substr;
    }
```

## 前提知識

- **参照渡し `&$string`**: 関数の中で変数を書き換えると、呼び出し元の変数も変わる渡し方です。`&` が付いた引数が、この仕組みを表します。
- **`substr`**: 文字列の一部を取り出す PHP の関数です。第 2 引数から先を取り出すと、残りになります。
- **バイト単位**: `substr` はバイトの位置で切ります。バイナリのデータでは、この方が都合が良いです。
- **戻り値 `: string`**: 戻り値が文字列であることを宣言しています。
- **`static` メソッド**: インスタンスを作らずに、クラス名から直接呼べる関数です。

## 何をしているか

### 1. 先頭から指定のバイト数を取り出す

```php:line-numbers=37
        $substr = substr($string, 0, $index);
```

先頭から `$index` バイトを取り出して、`$substr` に入れます。`$index` の既定値は 1 なので、省略すると 1 バイトだけを取ります。

### 2. 残りを元の変数に書き戻す

```php:line-numbers=38
        $string = substr($string, $index);
```

`$string` を、`$index` バイト目から後ろの部分に置き換えます。参照渡しなので、呼び出し元の変数も同じ残りになります。

### 3. 取り出した部分を返す

```php:line-numbers=39
        return $substr;
```

取り出した先頭の部分を、戻り値として返します。

たとえば `$data = 'abcdef'` の状態で `shift($data, 2)` を呼ぶと、戻り値は `ab`、`$data` は `cdef` になります。続けて `shift($data, 2)` を呼ぶと、今度は `cd` が取れ、`$data` は `ef` になります。

## ここがすごい

- **読み進める処理を 1 行に**: 「先頭を取る」と「残りを残す」を、1 つの関数で同時に行えます。呼び出し側は、ループの中で `shift` を繰り返すだけで済みます。
- **参照渡しで状態を持つ**: 読み進めた位置を、別の変数で管理する必要がありません。変数そのものが、次に読む位置を覚えています。
- **バイト単位の一貫性**: 暗号のデータは、文字ではなくバイトの長さで決まっています。`substr` でバイト単位に切ることで、フィールドの長さを正確に扱えます。
- **既定値で 1 バイトずつ読める**: 引数を省略すると 1 バイトずつ読めるので、短い区切りのデータにも使えます。

## まとめ

- 先頭から順に読むデータは、取り出すと残りを戻す関数にすると書きやすい。
- 参照渡しを使うと、読み進めた位置を変数自身が覚える。
- バイナリのデータは、文字単位ではなくバイト単位で切る。
- 既定値を用意すると、短い区切りの読み出しも同じ関数で書ける。
