---
title: 同じURLを同じ文字列にそろえて、キャッシュの取り違えを防ぐ
description: Symfony の Request::normalizeQueryString は、クエリ文字列を解析して、キー順に並べ直してから組み立て直します。順番が違うだけの同じ URL を、一つの形にそろえます。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "e6396e82011ded4608b896e8fff4da24d253382a"
file: src/Symfony/Component/HttpFoundation/Request.php
lines: [761, 771]
function: Request::normalizeQueryString
difficulty: 2
format: 2
tags: [ネットワーク, キャッシュ, 文字列処理]
---
## ひとことで

`normalizeQueryString` は、URL の `?` 以降のクエリ文字列を、キーの順に並べ直した標準の形に変える関数です。`?b=2&a=1` と `?a=1&b=2` は同じ意味ですが、文字列としては違うので、この関数で同じ形にそろえます。

## コード

```php:line-numbers=761
    public static function normalizeQueryString(?string $qs): string
    {
        if ('' === ($qs ?? '')) {
            return '';
        }

        $qs = HeaderUtils::parseQuery($qs);
        ksort($qs);

        return http_build_query($qs, '', '&', \PHP_QUERY_RFC3986);
    }
```

## 前提知識

- **クエリ文字列**: URL の `?` のあとに続く部分です。`key=value` の組を `&` でつないで書きます。
- **`??`（null 合体演算子）**: 左側が `null` なら右側を使います。`$qs ?? ''` は、`null` を空文字として扱うための書き方です。
- **`HeaderUtils::parseQuery`**: クエリ文字列を配列に直す Symfony の関数です。`a=1&b=2` が `['a' => '1', 'b' => '2']` になります。
- **`ksort`**: 配列をキーの順（アルファベット順など）に並べ替える PHP の関数です。配列を直接書き換えます。
- **`http_build_query`**: 配列を、クエリ文字列の形に組み立てる PHP の関数です。
- **`PHP_QUERY_RFC3986`**: 組み立てるときの、空白や記号のエンコード方法を指定する定数です。

## 何をしているか

### 1. 空なら空のまま返す

```php:line-numbers=763
        if ('' === ($qs ?? '')) {
            return '';
        }
```

クエリ文字列が `null` か空なら、何もせず空の文字列を返します。余計な処理をしないための早期の終了です。

### 2. 配列にしてキー順に並べる

```php:line-numbers=767
        $qs = HeaderUtils::parseQuery($qs);
        ksort($qs);
```

まず、文字列を連想配列に変換します。続く `ksort` が、キーの並びを揃えます。`b=2&a=1` は `a` が先に来る配列になります。

### 3. 規則に従って組み立て直す

```php:line-numbers=770
        return http_build_query($qs, '', '&', \PHP_QUERY_RFC3986);
```

`http_build_query` は、配列を `key=value` の並びに戻します。区切りは `&`、エンコードは RFC 3986 の規則に従います。この規則では、空白は `%20` になります。

結果として、`?b=2&a=1` は `a=1&b=2` に変わります。

## ここがすごい

- **解析と組み立てを対で使う**: 文字列を配列にして、配列から文字列に戻すので、順番だけが変わり、値は壊れません。
- **キーの順に揃える**: 順番の違う URL を、同じ文字列にできます。キャッシュの鍵として使うときに、同じ内容のリクエストが別物になるのを防げます。
- **エンコードの規則を明示**: `PHP_QUERY_RFC3986` を指定して、どの環境でも同じ結果になるようにしています。
- **空の場合を先に返す**: クエリが無い URL に対して、解析の処理を走らせません。

## まとめ

- クエリ文字列は、配列に直してからキーの順に並べると、同じ意味の URL を同じ形にできる。
- 解析と組み立てを対で使うと、値を壊さずに形だけ変えられる。
- エンコードの規則を明示すると、結果が環境に依存しない。
- 同じ内容のリクエストを一つにまとめると、キャッシュや比較が安定する。
