---
title: "2 つのコレクションを、位置ごとにペアにしてまとめる"
description: "Laravel の Collection::zip は、複数のコレクションの同じ位置の値を、1 つにまとめた組にします。array_map に複数の配列を渡す PHP の仕組みを使っています。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Collection.php
lines: [1909, 1916]
function: Collection::zip
difficulty: 2
format: 2
tags: [データ構造, イディオム, 関数型]
---

## ひとことで

`zip` は、2 つのコレクションを **同じ位置どうしで組にする** 関数です。`[1, 2]` と `['a', 'b']` を zip すると、`[[1, 'a'], [2, 'b']]` ができます。表の列を並べたり、ペアの値を作ったりするときに使われます。

## コード

```php:line-numbers=1909
    public function zip($items)
    {
        $arrayableItems = array_map(fn ($items) => $this->getArrayableItems($items), func_get_args());

        $params = array_merge([fn () => $this->newInstance(func_get_args()), $this->items], $arrayableItems);

        return $this->newInstance(array_map(...$params));
    }
```

## 前提知識

- **`array_map` に複数の配列を渡す**: 配列を複数並べると、各位置の値が同時に関数へ渡されます。
- **`func_get_args`**: 関数に渡された引数を、すべて配列として取り出す PHP の関数です。
- **`...` のスプレッド**: 配列を展開して、関数の引数として並べて渡す書き方です。
- **`array_merge`**: 配列をつなぐ関数です。
- **`getArrayableItems`**: 渡されたものを、配列として扱える形に変えるメソッドです。

## 何をしているか

### 1. 渡されたものを、配列に直す

```php:line-numbers=1911
        $arrayableItems = array_map(fn ($items) => $this->getArrayableItems($items), func_get_args());
```

`func_get_args()` で、`zip` に渡されたすべてのコレクションを取り出し、それぞれを配列に直します。

### 2. 呼び出しの引数を組み立てる

```php:line-numbers=1913
        $params = array_merge([fn () => $this->newInstance(func_get_args()), $this->items], $arrayableItems);
```

最初の引数は、組を作る関数です。`fn () => $this->newInstance(func_get_args())` は、位置ごとの値を受け取り、それをコレクションにします。2 つ目に、自分自身の中身（`$this->items`）を入れ、残りに変換済みの配列を並べます。

### 3. 位置ごとに組を作る

```php:line-numbers=1915
        return $this->newInstance(array_map(...$params));
```

`array_map(...$params)` は、自分の中身と他の配列を、同じ位置どうしで組にして関数に渡します。組み立ての関数はその値を受け取り、コレクションにして返します。

具体例として `collect([1, 2])->zip(['a', 'b'])` は、`[1, 'a']` と `[2, 'b']` の 2 つのコレクションを中に持つ結果になります。

## ここがすごい

### 「複数の配列を同時に回す」を、標準の仕組みで行う

zip は、複数の列を同じ位置で揃えて読む処理です。PHP の `array_map` は、複数の配列を渡すと同じ位置の値を同時に関数へ渡せます。この関数は、その性質をそのまま使い、自分でループを書かずに済ませています。

### 組の作り方を、関数の引数として渡す

```php:line-numbers=1913
        $params = array_merge([fn () => $this->newInstance(func_get_args()), $this->items], $arrayableItems);
```

組を作る処理を、最初の引数に渡しています。`array_map` は、その関数がどんな値を受け取っても、位置ごとに呼び出すだけです。組の形を変えたくなったら、この 1 行を変えるだけで済みます。

### 引数の数が変わっても動く

`func_get_args` を使っているので、zip に渡す数は 2 つでも 3 つでもかまいません。引数の数を固定しない書き方が、柔軟さを生んでいます。

## まとめ

- 同じ位置の値を組にする処理は、複数の配列を `array_map` に渡すと簡単に書ける。
- 組を作る方法を関数として渡すと、組の形を変えやすい。
- 引数の数を固定せず `func_get_args` で受けると、何個でも組にできる。
- 展開（`...`）を使うと、可変の数の配列を引数として渡せる。
