---
title: 名前空間の部品を、区切りの \ でつなぐ
description: PHP-Parser の Name::concat は、2 つの名前を名前空間の区切り \ でつなぎ、どちらかが null のときはもう片方をそのまま使います。null の扱いを 4 通りに分けています。
language: php
project: PHP-Parser
repo: https://github.com/nikic/PHP-Parser
license: BSD-3-Clause
copyright: Copyright (c) 2011, Nikita Popov
commit: "1ee86c89e58a23810602e78ca445784bb7b2ad3e"
file: lib/PhpParser/Node/Name.php
lines: [226, 240]
function: Name::concat
difficulty: 1
format: 2
tags: [文字列処理, パース, API設計]
---
## ひとことで

`concat` は、PHP の名前（`Foo\Bar` のような名前空間付きの名前）を 2 つつなげて、新しい `Name` ノードを作る関数です。どちらかが無い（`null`）ときは、もう片方だけを使い、両方無ければ `null` を返します。

## コード

```php:line-numbers=226
    public static function concat($name1, $name2, array $attributes = []) {
        if (null === $name1 && null === $name2) {
            return null;
        }
        if (null === $name1) {
            return new static($name2, $attributes);
        }
        if (null === $name2) {
            return new static($name1, $attributes);
        } else {
            return new static(
                self::prepareName($name1) . '\\' . self::prepareName($name2), $attributes
            );
        }
    }
```

## 前提知識

- **名前空間**: PHP で関数やクラスを区別するための仕組みです。`App\Models\User` のように `\` で区切って書きます。
- **`Name` ノード**: PHP-Parser が、ソースコードの名前を木構造の部品として表すオブジェクトです。構文木の 1 つのノードになります。
- **`null`**: 値が無いことを表す特別な値です。`null === $x` は、`$x` が無いかを型まで含めて調べます。
- **`new static(...)`**: 呼び出された側のクラスのインスタンスを作ります。継承しても、そのサブクラスのインスタンスになります。
- **`'\\'`**: 1 文字の `\` を表す文字列です。`\` 自体が文字列のエスケープ記号なので、2 つ重ねて書きます。
- **`array $attributes = []`**: 位置情報などの付加情報を入れる配列です。省略すると空配列になります。

## 何をしているか

### 1. 両方が無いとき

```php:line-numbers=227
        if (null === $name1 && null === $name2) {
            return null;
        }
```

どちらの名前も無ければ、つなぐものがないので `null` を返します。

### 2. 片方だけ無いとき

```php:line-numbers=230
        if (null === $name1) {
            return new static($name2, $attributes);
        }
        if (null === $name2) {
            return new static($name1, $attributes);
        } else {
```

どちらか一方が `null` のときは、もう一方をそのまま新しいノードにします。区切りの `\` は付けません。たとえば `concat(null, 'Foo')` は `Foo` だけになります。

### 3. 両方あるとき

```php:line-numbers=236
            return new static(
                self::prepareName($name1) . '\\' . self::prepareName($name2), $attributes
            );
```

両方あるときは、`prepareName` で 2 つの名前を整えたあと、その間に `'\\'` を挟んでつなぎます。`'\\'` は、区切りの `\` 1 文字です。結果は `Foo\Bar` になります。

`prepareName` の中身は、名前の書き方を揃える処理です。ここでは、つなぐ前の表記を揃えることだけ覚えておけば十分です。

### 4. 付加情報を引き継ぐ

```php:line-numbers=237
                self::prepareName($name1) . '\\' . self::prepareName($name2), $attributes
```

`$attributes` を新しいノードに渡します。位置情報などは、つないだあとの名前にも引き継がれます。

## ここがすごい

- **null を先に片付ける**: 3 つの場合（両方 null、片方だけ null、両方ある）を、先頭から順に分けています。残りの 1 通りだけが文字列の連結になるので、読みやすい形です。
- **区切りの有無を場面で分ける**: 片方が無いときに `\` を付けないことで、先頭に余計な区切りが入りません。結果が `\Foo` のようにならないのは、この分岐のおかげです。
- **`static` で型を保つ**: `new static` を使うので、この関数を継承したクラスから呼んでも、同じ種類のノードが返ります。
- **付加情報を捨てない**: 元の位置情報を、つなぎ直したノードに残します。エラー表示の位置がずれないためです。

## まとめ

- 名前のつなぎ合わせは、`null` の 4 通りを分けて扱うと、読みやすく誤りも減る。
- 区切りの `\` は、両方ある場合だけ入れる。
- `new static` は、呼び出されたクラスの型を返すための書き方。
- 付加情報は、新しいノードに引き継いで位置情報を保つ。
