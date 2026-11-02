---
title: 末尾の一致だけを置き換える、Str::replaceEnd
description: Laravel の Str::replaceEnd は、文字列の末尾が指定の語で終わるときだけ、その語を別の語に置き換えます。途中に同じ語があっても、末尾以外は変わりません。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "b20bf7f442beabdb70e45cf9d29cd6c64675f856"
file: src/Illuminate/Support/Str.php
lines: [1441, 1454]
function: Str::replaceEnd
difficulty: 1
format: 2
tags: [文字列処理, 防御的プログラミング, API設計]
---
## ひとことで

`Str::replaceEnd` は、文字列の末尾に `$search` があるときだけ、それを `$replace` に置き換える関数です。途中に同じ語があっても、末尾でなければ何もしません。ファイル名の拡張子を変えるような場面に向いています。

## コード

```php:line-numbers=1441
    public static function replaceEnd($search, $replace, $subject)
    {
        $search = (string) $search;

        if ($search === '') {
            return $subject;
        }

        if (static::endsWith($subject, $search)) {
            return static::replaceLast($search, $replace, $subject);
        }

        return $subject;
    }
```

## 前提知識

- **`endsWith`**: 文字列が指定の語で終わるかを `true` か `false` で返す、Str クラスのメソッドです。
- **`replaceLast`**: 文字列の中で、最後に現れた語だけを置き換えるメソッドです。最初に現れた語を置き換える `replaceFirst` と対になっています。
- **`(string)`**: 値を文字列にするキャストです。
- **末尾と途中**: `a.txt.bak` の `.txt` は途中にあり、末尾の `.bak` とは別物です。「末尾か」を判定することが、この関数の要点です。

## 何をしているか

### 1. 空の語を弾く

```php:line-numbers=1443
        $search = (string) $search;

        if ($search === '') {
            return $subject;
        }
```

検索する語を文字列にそろえ、空なら何もせず元の文字列を返します。空の語を置き換えると、文字列の至る所に挿入されてしまうので、これを防ぎます。

### 2. 末尾なら最後の一致を置き換える

```php:line-numbers=1449
        if (static::endsWith($subject, $search)) {
            return static::replaceLast($search, $replace, $subject);
        }
```

末尾が `$search` で終わっていれば、`replaceLast` で最後の一致を置き換えます。末尾の一致は、必ず最後にあるので、最後の一致を置き換えれば正しく動きます。

### 3. 末尾でなければ何もしない

```php:line-numbers=1453
        return $subject;
```

末尾で終わらない場合は、元の文字列をそのまま返します。途中に `$search` があっても、それは変わりません。

たとえば `report.txt.txt` で `.txt` を `.md` に置き換えると、末尾の `.txt` だけが `.md` になり、結果は `report.txt.md` です。

## ここがすごい

- **位置を限定する**: 「どこにある一致か」を末尾に限ることで、意図しない置き換えを防げます。`str_replace` で全部を置き換える書き方と比べて、安全です。
- **判定と置き換えを分ける**: 末尾か確かめる処理と、置き換えの処理を、既存のメソッドに分けています。読み手は「末尾なら、最後の一致を変える」と理解できます。
- **空の語の防御**: 空の語を弾くことで、全体の文字列が壊れるのを防いでいます。
- **対になる関数との整合**: `replaceFirst`、`replaceLast` と並ぶ、位置を指定する置換の 1 つです。名前から、どこが変わるかが分かります。

## まとめ

- 末尾だけを置き換えるには、末尾の判定を先にして、最後の一致を変える。
- 途中の一致は変えないことで、意図しない書き換えを防げる。
- 空の語は必ず弾いておくと、文字列の全体が壊れない。
- 「どの位置を変えるか」を名前で示すと、読み手が誤解しにくい。
