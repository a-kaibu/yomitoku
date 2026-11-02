---
title: 偶数個のときは真ん中の 2 つの平均で、中央値を求める
description: Laravel の Collection::median は、値の中央値を求めます。要素数が奇数か偶数かで計算を分け、偶数のときは真ん中の 2 つの平均を使います。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Collection.php
lines: [98, 119]
function: Collection::median
difficulty: 1
format: 2
tags: [数値計算, アルゴリズム, ソート]
---

## ひとことで

`median` は、データを小さい順に並べたときの **真ん中の値**（中央値）を返す関数です。平均値は極端な値に引っぱられますが、中央値は影響されにくいので、売上や処理時間の代表値としてよく使われます。

## コード

```php:line-numbers=98
    public function median($key = null)
    {
        $values = (isset($key) ? $this->pluck($key) : $this)
            ->reject(fn ($item) => is_null($item))
            ->sort()->values();

        $count = $values->count();

        if ($count === 0) {
            return;
        }

        $middle = intdiv($count, 2);

        if ($count % 2) {
            return $values->get($middle);
        }

        return $this->newInstance([
            $values->get($middle - 1), $values->get($middle),
        ])->average();
    }
```

## 前提知識

- **中央値（メディアン）**: 小さい順に並べたとき、真ん中にくる値です。要素が偶数個のときは、真ん中の 2 つの平均を取ります。
- **`intdiv`**: 整数どうしの割り算で、小数点以下を切り捨てる関数です。
- **`pluck`**: コレクションから、特定のキーの値だけを取り出す操作です。
- **`reject`**: 条件に当てはまる要素を取り除く操作です。
- **`sort` と `values`**: `sort` は値で並べ、`values` は添字を振り直します。

## 何をしているか

### 1. 値だけを集めて、並べる

```php:line-numbers=100
        $values = (isset($key) ? $this->pluck($key) : $this)
            ->reject(fn ($item) => is_null($item))
            ->sort()->values();
```

`$key` があれば、その項目の値だけを `pluck` で取り出します。そうでなければ、コレクションそのものを使います。`reject` で `null` を取り除き、`sort()` で小さい順に並べ、`values()` で添字を 0 から振り直します。

### 2. 空なら、何も返さない

```php:line-numbers=104
        $count = $values->count();

        if ($count === 0) {
            return;
        }
```

要素が 0 個なら中央値はありません。`return;` で `null` を返します。

### 3. 奇数個なら、真ん中の 1 つを返す

```php:line-numbers=110
        $middle = intdiv($count, 2);

        if ($count % 2) {
            return $values->get($middle);
        }
```

`intdiv($count, 2)` で真ん中の位置を求めます。要素数が奇数なら `$count % 2` が 1 になるので、真ん中の値をそのまま返します。

### 4. 偶数個なら、真ん中の 2 つの平均を返す

```php:line-numbers=116
        return $this->newInstance([
            $values->get($middle - 1), $values->get($middle),
        ])->average();
```

要素数が偶数なら、真ん中の 2 つ（`$middle - 1` と `$middle`）を新しいコレクションにして、`average()` で平均を取ります。

具体例として `[1, 3, 5, 7]` の中央値は、真ん中の `3` と `5` の平均で `4` になります。

## ここがすごい

### 偶数と奇数を、剰余の 1 行で見分けている

`$count % 2` は、奇数なら 1、偶数なら 0 になります。`if` の 1 行で場合分けできるので、中央値の 2 つのケースが一目で分かります。

### 平均の計算を、既存の機能に任せている

偶数のときの平均は、新しいコレクションを作って `average()` を呼ぶだけです。自分で足して 2 で割るより、意図がはっきりします。同じコレクションの機能を組み合わせて書くのが、Laravel らしい書き方です。

### 空のときを最初に返す

要素がないときに `intdiv` や `get` へ進むと、意味のない値が出てきます。最初に `return;` で抜けることで、後の計算が安全になります。

## まとめ

- 中央値は、並べてから真ん中を取ると求まる。
- 偶数個のときは、真ん中の 2 つの平均を取る。
- 割り算で位置を求めるときは、整数の割り算（`intdiv`）を使うと安全。
- 空のときは最初に抜けると、後の計算で迷わない。
