---
title: "「in」の判定を、文字列・配列・反復可能な値で使い分ける"
description: "Twig の inFilter は、テンプレートの in 演算子の判定を行います。文字列の部分一致、配列の要素の一致、オブジェクトの同一性など、対象ごとに比べ方を変えています。"
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Extension/CoreExtension.php
lines: [1070, 1112]
function: CoreExtension::inFilter
difficulty: 3
format: 2
tags: [型システム, 文字列処理, イテレータ]
---

## ひとことで

`inFilter` は、Twig テンプレートの `{% if 'a' in list %}` のような **in 演算子** を実際に判定する関数です。文字列の中に含まれるか、配列の中にあるかなど、右側の値の種類によって比べ方が変わります。

## コード

```php:line-numbers=1070
    public static function inFilter($value, $compare)
    {
        if ($value instanceof Markup) {
            $value = (string) $value;
        }
        if ($compare instanceof Markup) {
            $compare = (string) $compare;
        }

        if (\is_string($compare)) {
            if (\is_string($value) || \is_int($value) || \is_float($value)) {
                return '' === $value || str_contains($compare, (string) $value);
            }

            return false;
        }

        if (!is_iterable($compare)) {
            return false;
        }

        if (\is_object($value) || \is_resource($value)) {
            if (!\is_array($compare)) {
                foreach ($compare as $item) {
                    if ($item === $value) {
                        return true;
                    }
                }

                return false;
            }

            return \in_array($value, $compare, true);
        }

        foreach ($compare as $item) {
            if (0 === self::compare($value, $item)) {
                return true;
            }
        }

        return false;
    }
```

## 前提知識

- **テンプレートエンジン**: HTML の中に変数や条件を書いて、データを埋め込む仕組みです。Twig は PHP 向けのテンプレートエンジンです。
- **`Markup`**: Twig で「すでに安全な HTML」を表すクラスです。文字列としても扱えます。
- **`is_iterable`**: 値を `foreach` で回せるかを調べる関数です。配列やイテレータが該当します。
- **`str_contains`**: 文字列に別の文字列が含まれるかを調べる関数です。
- **`in_array(..., true)`**: 型も含めて完全に一致する要素があるかを調べる関数です。

## 何をしているか

### 1. 安全な文字列に変えてから比べる

```php:line-numbers=1072
        if ($value instanceof Markup) {
            $value = (string) $value;
        }
        if ($compare instanceof Markup) {
            $compare = (string) $compare;
        }
```

`Markup`（すでに安全な HTML を表すオブジェクト）は、普通の文字列に変えてから比べます。

### 2. 右側が文字列なら、部分一致を調べる

```php:line-numbers=1079
        if (\is_string($compare)) {
            if (\is_string($value) || \is_int($value) || \is_float($value)) {
                return '' === $value || str_contains($compare, (string) $value);
            }

            return false;
        }
```

右側（`$compare`）が文字列のとき、左側が文字列や数値なら、`str_contains` で「含まれるか」を調べます。左側が空の文字列なら、どんな文字列にも含まれるとみなして `true` にします。左側が数値などでなければ `false` です。

### 3. 右側が配列などでないなら、false

```php:line-numbers=1087
        if (!is_iterable($compare)) {
            return false;
        }
```

右側が反復できない値なら、`in` で比べようがないので `false` を返します。

### 4. 左側がオブジェクトなら、同じものかを調べる

```php:line-numbers=1091
        if (\is_object($value) || \is_resource($value)) {
            if (!\is_array($compare)) {
                foreach ($compare as $item) {
                    if ($item === $value) {
                        return true;
                    }
                }

                return false;
            }

            return \in_array($value, $compare, true);
        }
```

左側がオブジェクトのとき、右側が配列なら `in_array(..., true)` で、同じオブジェクトかを確かめます。配列でなければ、1 つずつ回して `===` で比べます。

### 5. それ以外は、比較の結果で判定する

```php:line-numbers=1105
        foreach ($compare as $item) {
            if (0 === self::compare($value, $item)) {
                return true;
            }
        }

        return false;
```

残りの値は、`compare` 関数で比べて、0（等しい）が 1 つでもあれば `true` にします。

## ここがすごい

### 同じ `in` でも、型ごとに正しい比べ方を選ぶ

テンプレートの利用者は、`in` が文字列にも配列にも使えることを期待します。この関数は、右側の型を見て、比べ方を切り替えています。利用者は型の違いを意識せず、同じ書き方で判定できます。

### 厳密な比べ方と、ゆるい比べ方を使い分ける

オブジェクトは、同じ実体かどうかを `===` で比べるのが正しい判断です。一方、数値と文字列の値は、Twig の `compare` で比べて、型の違いを吸収します。比べる対象の性質に応じて、基準を変えている点がおもしろいところです。

### 早めに `false` を返す

反復できない値や、比べようのない値は、最初の段階で `false` にしています。後の比較に進まないので、無駄な処理もなく、予想外の結果も防げます。

## まとめ

- 同じ演算子でも、右側の型によって比べ方を変えると、利用者は迷わない。
- オブジェクトは同一性（`===`）、値は比較の関数で比べ分けると正確になる。
- 文字列の部分一致は `str_contains` が簡潔に書ける。
- 比べようのない値は、早めに `false` と返すと安全。
