---
title: 入れ子の配列を「a.b.c」の一列にほどく再帰クロージャ
description: Laravel の Arr::dot は、入れ子の連想配列を user.address.city のようなドット記法のキーをもつ 1 段の配列に変換します。再帰を自己参照するクロージャで書いている点がおもしろい関数です。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Arr.php
lines: [185, 207]
function: Arr::dot
difficulty: 2
format: 2
tags: [データ構造, 再帰, クロージャ]
---

## ひとことで

`Arr::dot` は、入れ子になった連想配列を **ドット記法**（`user.address.city` のように `.` でつないだキー）の 1 段の配列に変換します。Laravel の設定値の読み出しや、フォームのエラーの整理などで使われている、小さいけれど実用的な関数です。

## コード

::: code-group

```php:line-numbers=185 [日本語訳]
    public static function dot($array, $prepend = '', $depth = INF)
    {
        $results = [];

        $flatten = function ($data, $prefix, $currentDepth) use (&$results, &$flatten, $depth): void {
            foreach ($data as $key => $value) {
                $newKey = $prefix.$key;

                if (is_array($value) && ! empty($value) && $currentDepth < $depth) {
                    $flatten($value, $newKey.'.', $currentDepth + 1);
                } else {
                    $results[$newKey] = $value;
                }
            }
        };

        $flatten($array, $prepend, 0);

        // 自分自身を参照するクロージャを破棄して、メモリリークを防ぐ…
        $flatten = null;

        return $results;
    }
```

```php:line-numbers=185 [原文]
    public static function dot($array, $prepend = '', $depth = INF)
    {
        $results = [];

        $flatten = function ($data, $prefix, $currentDepth) use (&$results, &$flatten, $depth): void {
            foreach ($data as $key => $value) {
                $newKey = $prefix.$key;

                if (is_array($value) && ! empty($value) && $currentDepth < $depth) {
                    $flatten($value, $newKey.'.', $currentDepth + 1);
                } else {
                    $results[$newKey] = $value;
                }
            }
        };

        $flatten($array, $prepend, 0);

        // Destroy self-referencing closure to avoid memory leak...
        $flatten = null;

        return $results;
    }
```

:::

## 前提知識

- **連想配列**: `['name' => 'Ami']` のように、キーに文字列を使える配列です。`=>` でキーと値を結びます。
- **無名関数（クロージャ）**: `function (...) use (...) { ... }` の形で、その場で作る関数です。`use` で外側の変数を取り込めます。
- **参照渡し `&`**: `use (&$results)` のように `&` を付けると、コピーではなく **同じ変数** を指すようになります。
- **`.` は文字列連結**: PHP では文字列どうしをつなぐ演算子に `+` ではなく `.` を使います。`$prefix.$key` は「前の部分 + キー」という意味です。
- **`INF`**: 無限大を表す PHP の定数です。`$depth = INF` と書くと、深さの上限を事実上なくせます。

## 何をしているか

### 1. 結果を入れる箱と、自分を呼べる関数を用意する

```php:line-numbers=187
        $results = [];

        $flatten = function ($data, $prefix, $currentDepth) use (&$results, &$flatten, $depth): void {
```

`$results` に結果を集めます。`$flatten` は配列の中身を 1 つずつ見ていく関数です。`use` の中の `&$flatten` によって、クロージャが **自分自身を呼び出せる** ようになっています。ふつうの関数では自分の名前で呼べますが、無名関数には名前がないので、このように参照で取り込む書き方をします。

### 2. 値が配列なら潜り、そうでなければ結果に入れる

```php:line-numbers=190
            foreach ($data as $key => $value) {
                $newKey = $prefix.$key;

                if (is_array($value) && ! empty($value) && $currentDepth < $depth) {
                    $flatten($value, $newKey.'.', $currentDepth + 1);
                } else {
                    $results[$newKey] = $value;
                }
```

キーは `$prefix.$key` で、親のキーに `.` をつないで作ります。値がまだ配列で、かつ深さの上限に達していなければ、`$flatten` を **中身に対して再び** 呼び出します。配列でなければ（または空配列なら）それ以上は潜らず、`$results[$newKey] = $value` で結果に書き込みます。

たとえば `['user' => ['address' => ['city' => 'Tokyo']]]` を入れると、`user` は配列なので `user.` という接頭辞で中へ潜ります。次に `address` も配列なので `user.address.` で潜り、最後に `city` が `user.address.city` というキーで `'Tokyo'` として入ります。空の配列 `[]` は「もう潜れない値」として扱われ、そのまま残ります。

### 3. 最後に後片づけをする

::: code-group

```php:line-numbers=201 [日本語訳]
        $flatten($array, $prepend, 0);

        // 自分自身を参照するクロージャを破棄して、メモリリークを防ぐ…
        $flatten = null;

        return $results;
```

```php:line-numbers=201 [原文]
        $flatten($array, $prepend, 0);

        // Destroy self-referencing closure to avoid memory leak...
        $flatten = null;

        return $results;
```

:::

最初の呼び出しで `$flatten($array, $prepend, 0)` を実行し、終わったら `$flatten = null;` で変数を空にします。この 1 行がなぜ必要なのかは、後の「ここがすごい」で説明します。

## ここがすごい

### 再帰を「自分を呼べるクロージャ」に閉じ込めている

再帰の補助関数を `private static function` として別に書くこともできます。しかしこの書き方だと、補助関数がクラスのメソッドとして外に見えてしまいます。クロージャにすれば、処理はこの関数の中だけで完結します。`$depth` のような深さの情報も、引数ではなく `use` で外から取り込めるので、呼び出し側の引数が増えません。

### 深さの上限を「無限大」というデフォルトで表している

`$depth = INF` が既定値なので、普通に使えばすべての階層を潜ります。上限を指定したときだけ `$currentDepth < $depth` の条件が効きます。「上限なし」を特別扱いする `if` を書かずに済むのは、`INF` が整数と比べても常に大きい値として扱えるからです。

### 自己参照の輪を、わざわざ切っている

::: code-group

```php:line-numbers=203 [日本語訳]
        // 自分自身を参照するクロージャを破棄して、メモリリークを防ぐ…
        $flatten = null;
```

```php:line-numbers=203 [原文]
        // Destroy self-referencing closure to avoid memory leak...
        $flatten = null;
```

:::

クロージャは `use (&$flatten)` で自分自身を参照しています。参照が自分に戻ってくる **循環参照** になるため、関数が終わっても変数の参照カウントが 0 になりません。PHP のガベージコレクタが後で回収しますが、長時間動くプロセスでは積み重なるおそれがあります。`$flatten = null;` で輪を切れば、すぐに解放されます。コードのコメントにもある、メモリリーク対策の 1 行です。

## まとめ

- 無名関数に `use (&$f)` で自分を取り込むと、自己参照の再帰が書ける。
- 入れ子の構造は、キーを「親 + `.` + 子」で連結すると 1 段にほどける。
- 自己参照の輪は、使い終わったら `null` にして切ると後始末が確実になる。
- 既定値 `INF` で「上限なし」を表すと、条件分岐を増やさずに済む。
