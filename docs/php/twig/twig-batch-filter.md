---
title: "配列を n 個ずつのかたまりに分け、足りない分を埋める"
description: "Twig の batch フィルターは、配列を指定した個数ごとに分けて、表のように並べられる形にします。最後のかたまりが足りないときは、指定した値で埋めます。"
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Extension/CoreExtension.php
lines: [1714, 1734]
function: CoreExtension::batch
difficulty: 2
format: 2
tags: [データ構造, イテレータ, アルゴリズム]
---

## ひとことで

`batch` は、配列を **指定した個数ずつのかたまり** に分けるフィルターです。`{% for row in items|batch(3, '-') %}` のように書くと、3 個ずつの行にできます。表のレイアウトを作るときに便利です。

## コード

```php:line-numbers=1714
    public static function batch($items, $size, $fill = null, $preserveKeys = true): array
    {
        if (!is_iterable($items)) {
            throw new RuntimeError(\sprintf('The "batch" filter expects a sequence or a mapping, got "%s".', get_debug_type($items)));
        }

        $size = (int) ceil($size);

        $result = array_chunk(self::toArray($items, $preserveKeys), $size, $preserveKeys);

        if (null !== $fill && $result) {
            $last = \count($result) - 1;
            if ($fillCount = $size - \count($result[$last])) {
                for ($i = 0; $i < $fillCount; ++$i) {
                    $result[$last][] = $fill;
                }
            }
        }

        return $result;
    }
```

## 前提知識

- **かたまり（チャンク）**: 配列を一定の個数で区切った、小さな配列のことです。
- **`array_chunk`**: 配列を指定した個数ごとに分ける PHP の関数です。
- **`ceil`**: 小数を切り上げる関数です。
- **`count`**: 配列の要素数を数える関数です。
- **`null` 比較と `!==`**: 値が「指定されていない」かを確かめるための比べ方です。

## 何をしているか

### 1. 反復可能かを確かめる

```php:line-numbers=1716
        if (!is_iterable($items)) {
            throw new RuntimeError(\sprintf('The "batch" filter expects a sequence or a mapping, got "%s".', get_debug_type($items)));
        }
```

`batch` は配列か、キーのある反復可能な値にだけ使えます。それ以外なら、エラーにします。

### 2. 個数を整数にそろえ、かたまりに分ける

```php:line-numbers=1720
        $size = (int) ceil($size);

        $result = array_chunk(self::toArray($items, $preserveKeys), $size, $preserveKeys);
```

`ceil($size)` で、個数を整数に切り上げます。`array_chunk` で、配列を個数ごとに分けます。`$preserveKeys` が `true` なら、元のキーも保ちます。

### 3. 最後のかたまりを、指定の値で埋める

```php:line-numbers=1724
        if (null !== $fill && $result) {
            $last = \count($result) - 1;
            if ($fillCount = $size - \count($result[$last])) {
                for ($i = 0; $i < $fillCount; ++$i) {
                    $result[$last][] = $fill;
                }
            }
        }
```

`$fill` が指定されていて、結果が空でなければ、最後のかたまりに足りない個数を数えます。足りない個数だけ、`$fill` の値を追加します。

### 4. 結果を返す

```php:line-numbers=1733
        return $result;
```

分けられたかたまりの配列を返します。

具体例として、`[1, 2, 3, 4, 5]` を 3 個ずつ、埋め値 `'-'` で分けると、`[[1, 2, 3], [4, 5, '-']]` になります。

## ここがすごい

### 表のレイアウトを、データの側で整えている

テンプレートで、3 列の表を作るとき、最後の行の空いたマスをどう埋めるかは悩みどころです。この関数は、埋め値を指定すると、データの段階で行をそろえます。テンプレートの側は、行を回すだけで表が完成します。

### 足りない分だけを数えて埋める

`count` で、最後のかたまりの要素数を数え、足りない分だけ埋めています。埋める数が 0 のときは、何もしません。必要な分だけ処理する書き方で、無駄がありません。

### キーを保つかどうかを選べる

`$preserveKeys` で、元のキーを残すかを決められます。表示だけなら連番で十分ですが、キーを使って後で参照する場合は、元の情報を残せます。

## まとめ

- 配列を表のように並べるには、個数ごとにかたまりに分けると組み立てやすい。
- 足りない分は、データの段階で埋めておくと、表示側が単純になる。
- 足りない個数を数えて、必要な分だけ埋めると無駄がない。
- キーを残すかどうかを選べると、表示用と参照用の両方に使える。
