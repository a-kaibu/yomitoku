---
title: 全部の語が含まれるかを、1つずつ確かめる
description: Laravel の Str::containsAll は、探す語の並びのすべてが文字列に含まれるかを調べます。1 つでも見つからなければすぐに false を返し、空の並びには false を返します。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "b20bf7f442beabdb70e45cf9d29cd6c64675f856"
file: src/Illuminate/Support/Str.php
lines: [342, 355]
function: Str::containsAll
difficulty: 1
format: 2
tags: [文字列処理, 防御的プログラミング, API設計]
---
## ひとことで

`Str::containsAll` は、文字列が、与えられた語の一覧をすべて含んでいるかを調べる関数です。`contains` を語の数だけ繰り返し、1 つでも含まれていなければ、そこで `false` を返します。

## コード

```php:line-numbers=342
    public static function containsAll($haystack, $needles, $ignoreCase = false)
    {
        $any = false;

        foreach ($needles as $needle) {
            $any = true;

            if (! static::contains($haystack, $needle, $ignoreCase)) {
                return false;
            }
        }

        return $any;
    }
```

## 前提知識

- **`contains`**: 文字列の中に、指定した語が含まれるかを `true` か `false` で返すメソッドです。`$ignoreCase` を `true` にすると、大文字と小文字を区別しません。
- **`foreach`**: 配列の要素を 1 つずつ取り出して、同じ処理を繰り返す文です。
- **`! `**: 「でない」を表す否定の記号です。`! static::contains(...)` は、含まれていないときに真になります。
- **早期の `return`**: 途中で結果が決まったら、残りの処理を省いて関数の戻り値を返すことです。
- **空の一覧**: 語が 1 つも無い配列のことです。何も探さないので、結果をどう決めるかが問題になります。

## 何をしているか

### 1. 1 つ見つけるごとに記録する

```php:line-numbers=344
        $any = false;

        foreach ($needles as $needle) {
            $any = true;
```

`$any` は、「語が 1 つでも処理されたか」を覚える旗です。最初は `false` で、語を 1 つ処理するたびに `true` になります。

### 2. 含まれない語があれば即座に false

```php:line-numbers=349
            if (! static::contains($haystack, $needle, $ignoreCase)) {
                return false;
            }
        }
```

`contains` が `false` を返した語があれば、その時点で `false` を返します。残りの語を調べる必要はありません。

### 3. すべて含まれていれば旗を返す

```php:line-numbers=354
        return $any;
```

すべての語が含まれていた場合は、ここまで到達します。このとき `$any` は、語が 1 つ以上あった場合は `true`、一覧が空だった場合は `false` になります。

つまり `containsAll('abc', [])` は `false` です。何も確かめていないので、「すべて含む」とは言えない、という判断です。

## ここがすごい

- **早く抜ける**: 最初に見つからない語があったところで戻るので、長い一覧でも無駄な検索を続けません。
- **空の一覧を別に扱う**: 語が無いときに `true` を返すと、「何も確かめずに成功する」という危険な結果になります。旗を使うことで、この場合を `false` にしています。
- **既存のメソッドを再利用**: 含まれるかどうかの判定を `contains` に任せ、この関数は全体の繰り返しだけを書いています。`ignoreCase` の扱いも自動的に引き継がれます。
- **引数の形を柔軟に**: 語は配列でも、どんな反復可能な値でも受け取れるように `foreach` で扱っています。

## まとめ

- 「すべて含むか」は、語を 1 つずつ調べて、1 つでも外れたら即座に `false` にすると効率的。
- 空の一覧を「成功」にしない工夫として、処理した語があったかを旗で覚える。
- 判定の詳細は専用のメソッドに任せると、この関数は繰り返しに集中できる。
