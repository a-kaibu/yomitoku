---
title: "入れ子の配列を、リストか連想配列かで並べ替える"
description: "Laravel の Arr::sortRecursive は、入れ子になった配列のすべての階層を並べ替えます。配列がリストか連想配列かで、キーで並べるか値で並べるかを切り替えます。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Arr.php
lines: [1155, 1176]
function: Arr::sortRecursive
difficulty: 2
format: 2
tags: [ソート, 再帰, データ構造]
---

## ひとことで

`Arr::sortRecursive` は、入れ子になった配列の **すべての階層** を並べ替える関数です。番号だけの配列は値の順に、名前のついた連想配列はキーの順に並べます。設定ファイルの比較や、テストの結果を安定させるときに役立ちます。

## コード

```php:line-numbers=1155
    public static function sortRecursive($array, $options = SORT_REGULAR, $descending = false)
    {
        foreach ($array as &$value) {
            if (is_array($value)) {
                $value = static::sortRecursive($value, $options, $descending);
            }
        }

        if (! array_is_list($array)) {
            match ($descending) {
                false, SortDirection::Ascending => ksort($array, $options),
                true, SortDirection::Descending => krsort($array, $options),
            };
        } else {
            match ($descending) {
                false, SortDirection::Ascending => sort($array, $options),
                true, SortDirection::Descending => rsort($array, $options),
            };
        }

        return $array;
    }
```

## 前提知識

- **ソート（並べ替え）**: 要素を大きさや文字の順番に並べ直すことです。
- **参照 `&$value`**: `foreach` で配列の要素を直接書き換えるための書き方です。
- **`array_is_list`**: 配列のキーが 0, 1, 2, ... と順番に並んでいるか（リストか）を調べる PHP の関数です。
- **`ksort` / `sort`**: キーで並べる関数と、値で並べる関数です。どちらも元の配列を書き換えます。
- **`match` 式**: 値ごとに結果を選ぶ PHP の書き方です。`switch` より簡潔に書けます。

## 何をしているか

### 1. 下の階層から先に並べる

```php:line-numbers=1157
        foreach ($array as &$value) {
            if (is_array($value)) {
                $value = static::sortRecursive($value, $options, $descending);
            }
        }
```

`foreach` で各要素を参照として取り出し、配列なら自分自身を呼び出して、その中を並べ替えます。`&$value` と書いているので、結果を直接元の配列に入れられます。まず深い階層から並べるのがポイントです。

### 2. リストか連想配列かで、並べ方を選ぶ

```php:line-numbers=1163
        if (! array_is_list($array)) {
            match ($descending) {
                false, SortDirection::Ascending => ksort($array, $options),
                true, SortDirection::Descending => krsort($array, $options),
            };
```

`array_is_list($array)` が偽なら、連想配列です。このとき `ksort` でキーの順に並べます。`$descending` が `true` なら `krsort` で逆順にします。

### 3. リストなら、値で並べる

```php:line-numbers=1168
        } else {
            match ($descending) {
                false, SortDirection::Ascending => sort($array, $options),
                true, SortDirection::Descending => rsort($array, $options),
            };
        }
```

リストなら `sort` で値の順に並べます。降順なら `rsort` を使います。`match` は、`SortDirection` の列挙型（昇順・降順）も受け付けるように書かれています。

```php:line-numbers=1175
        return $array;
```

最後に並べ替えた配列を返します。

## ここがすごい

### リストと連想配列で、並べる基準を変えている

番号の配列を「キーで並べる」と、順番が変わらないので意味がありません。逆に連想配列を「値で並べる」と、名前と値の対応が崩れます。この関数は、配列の形を見て基準を変えています。それぞれにとって自然な並べ方になります。

### 下の階層から並べると、上の階層は簡単になる

```php:line-numbers=1157
        foreach ($array as &$value) {
            if (is_array($value)) {
                $value = static::sortRecursive($value, $options, $descending);
            }
        }
```

子の配列を先に並べてから親を並べるので、親の並べ替えは要素の値に影響されません。どの階層もひとつの同じ手順で扱えるので、再帰の形がきれいに保たれています。

### `match` で、昇順と降順の分岐を見やすくした

```php:line-numbers=1164
            match ($descending) {
                false, SortDirection::Ascending => ksort($array, $options),
                true, SortDirection::Descending => krsort($array, $options),
            };
```

昇順と降順の 2 つの処理を、`match` で 1 か所にまとめています。`ksort` と `krsort` の対応が一目でわかるので、読み手も迷いにくくなります。

## まとめ

- 入れ子の並べ替えは、子の階層を先に並べると、親の処理が単純になる。
- 配列の形（リストか連想配列か）で、並べる基準を変えると自然な結果になる。
- 参照の `&` を使うと、配列を直接書き換える処理を簡潔に書ける。
- `match` を使うと、昇順・降順の分岐が読みやすくなる。
