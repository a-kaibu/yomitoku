---
title: 複数の配列から全部の組み合わせを作る直積の書き方
description: Laravel の Arr::crossJoin は、いくつもの配列から「どれか 1 つずつ選んだ組み合わせ」をすべて作ります。結果を少しずつ広げていく素直な反復で、直積を表しています。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Arr.php
lines: [142, 161]
function: Arr::crossJoin
difficulty: 2
format: 2
tags: [アルゴリズム, イディオム, データ構造]
---

## ひとことで

`Arr::crossJoin` は、複数の配列を渡すと **すべての組み合わせ**（直積）を返します。たとえば「色が赤・青」「サイズが S・M・L」なら、6 通りの組み合わせができます。商品のバリエーションや、テストの入力パターンを作るときに役立ちます。

## コード

```php:line-numbers=142
    public static function crossJoin(...$arrays)
    {
        $results = [[]];

        foreach ($arrays as $index => $array) {
            $append = [];

            foreach ($results as $product) {
                foreach ($array as $item) {
                    $product[$index] = $item;

                    $append[] = $product;
                }
            }

            $results = $append;
        }

        return $results;
    }
```

## 前提知識

- **可変長引数 `...$arrays`**: `crossJoin([1, 2], ['a'], [true])` のように、配列をいくつでも渡せます。関数の中では `$arrays` という 1 つの配列として受け取ります。
- **直積（デカルト積）**: 「1 つ目の集合の要素」と「2 つ目の集合の要素」をすべて組にしたものです。集合が 2 つなら 2 × 2 = 4 通り、3 つ目を足すと、さらに掛け算で増えていきます。
- **配列のコピーと代入**: PHP の配列は代入するとコピーされます。`$product[$index] = $item;` で書き換えても、元の配列には影響しません。
- **`[[]]` という初期値**: 組み合わせが 0 個の状態を表す、中身が空の配列 1 個です。ここから始めると、最初の配列の要素が 1 つずつ入った組として作られます。

## 何をしているか

### 1. 結果を「空の組み合わせ 1 つ」で初期化する

```php:line-numbers=144
        $results = [[]];
```

`$results` は `[[]]` で始めます。これは「要素を 1 つも選んでいない組み合わせが 1 通りある」という意味です。ここに直積の要素を足していくことで、最後に全組み合わせが残ります。

### 2. 配列を 1 つずつ掛け合わせる

```php:line-numbers=146
        foreach ($arrays as $index => $array) {
            $append = [];

            foreach ($results as $product) {
                foreach ($array as $item) {
                    $product[$index] = $item;

                    $append[] = $product;
                }
            }

            $results = $append;
        }
```

ループの外側で、次の配列 `$array` を見ます。内側のループでは、今までに作った組 `$product` と、新しい配列の要素 `$item` を組み合わせます。`$product[$index] = $item;` で、その組の `$index` 番目（今見ている配列の位置）に要素を入れ、`$append[] = $product;` で結果に追加します。ループの終わりに `$results = $append;` と差し替えるので、次の配列に進むたびに組の数が掛け算で増えていきます。

具体的に `crossJoin(['赤', '青'], ['S', 'M'])` を見てみましょう。最初の `$results` は `[[]]` です。1 つ目の配列で `[[0 => '赤'], [0 => '青']]` ができ、2 つ目の配列で `[[0 => '赤', 1 => 'S'], [0 => '赤', 1 => 'M'], [0 => '青', 1 => 'S'], [0 => '青', 1 => 'M']]` と 4 通りになります。

### 3. 結果を返す

```php:line-numbers=160
        return $results;
```

最後に `$results` を返すと、各組は「元の配列の位置」を添字にした配列になっています。

## ここがすごい

### 「組の配列」を毎回作り直す、わかりやすさ重視の書き方

直積は再帰やジェネレータでも書けますが、この実装は **配列の数だけ外側のループを回す** だけなので、読むと何が起きるかがすぐわかります。ループの中で `$append` を作り、最後に `$results` へ入れ替えるのは、「今までの結果を、次の配列で広げる」という考え方をそのまま表しています。

### 添字（キー）で「どの配列の要素か」を残している

組に入る値は `$product[$index] = $item;` で、添字つきで入ります。`$index` は引数のリストの位置です。そのため、連想配列を渡しても、結果の組はどの配列から来た値かを位置で区別できます。`foreach ($arrays as $index => ...)` という書き方が、この仕組みを支えています。

### 配列はコピーされるので、組みが混ざらない

PHP では `$product` を書き換えても、ほかの組に影響しません。ループの中で `$product` を取り出してから書き換え、`$append[] = $product;` で保存するので、組どうしが共有されずに済みます。もし参照で持っていたら、同じ組の値が次々に上書きされてしまうところです。

## まとめ

- 直積は「今までの結果 × 次の配列の要素」を繰り返すと、そのまま作れる。
- 初期値 `[[]]` を置くと、最初の配列の処理を他と同じ形で書ける。
- 添字で位置を残すと、どの配列から来た値かがわかる。
- PHP の配列は代入でコピーされるので、組を安全に作り直せる。
