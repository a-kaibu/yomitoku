---
title: "窓をずらしながら、重なりのある部分列を作る"
description: "Laravel の Collection::sliding は、データの上を窓（ウィンドウ）をずらしながら進むように、重なりのある小さな配列の並びを作ります。株価の移動平均のような計算に向いています。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Collection.php
lines: [1339, 1350]
function: Collection::sliding
difficulty: 2
format: 2
tags: [アルゴリズム, イテレータ, 数値計算]
---

## ひとことで

`sliding` は、コレクションの要素を **大きさ `$size` の窓** で切り出し、窓を `$step` ずつずらして並べます。隣どうしの窓は重なり合うのが特徴です。移動平均、連続した 2 要素の差分、文字列の 3 文字ずつの比較などで使われる考え方です。

## コード

```php:line-numbers=1339
    public function sliding($size = 2, $step = 1)
    {
        if ($size < 1) {
            throw new InvalidArgumentException('Size value must be at least 1.');
        } elseif ($step < 1) {
            throw new InvalidArgumentException('Step value must be at least 1.');
        }

        $chunks = floor(($this->count() - $size) / $step) + 1;

        return static::times($chunks, fn ($number) => $this->slice(($number - 1) * $step, $size));
    }
```

## 前提知識

- **コレクション**: Laravel が配列を扱いやすくするために用意したクラスです。`count()`、`slice()` のようなメソッドで操作します。
- **窓（ウィンドウ）**: 連続した要素を一定数だけ切り出した部分です。窓を少しずつずらすと、同じ要素が複数の窓に入ります。
- **`floor`**: 小数点以下を切り捨てる数学の関数です。
- **`static::times`**: `times(n, callback)` は 1 から n まで callback を呼び、結果をコレクションにする関数です。
- **例外 `InvalidArgumentException`**: 引数がおかしいときに投げる、PHP の標準的な例外です。

## 何をしているか

### 1. 引数が正しいかを確かめる

```php:line-numbers=1341
        if ($size < 1) {
            throw new InvalidArgumentException('Size value must be at least 1.');
        } elseif ($step < 1) {
            throw new InvalidArgumentException('Step value must be at least 1.');
        }
```

大きさ（`$size`）とずらす幅（`$step`）が 1 以上であることを確かめます。どちらかが 0 以下だと、窓が作れなかったりループが終わらなかったりするため、ここで例外にします。

### 2. 窓の数を計算する

```php:line-numbers=1347
        $chunks = floor(($this->count() - $size) / $step) + 1;
```

全体の要素数が `$this->count()` で、窓の大きさが `$size` です。窓の左端は `0, step, 2*step, ...` と動くので、全部入る窓の数は `floor((count - size) / step) + 1` になります。たとえば 5 要素で窓 3、ずらし 1 なら、`floor((5-3)/1)+1 = 3` 個の窓ができます。

### 3. 窓を 1 つずつ切り出す

```php:line-numbers=1349
        return static::times($chunks, fn ($number) => $this->slice(($number - 1) * $step, $size));
```

`static::times($chunks, fn ($number) => ...)` で、窓の数だけ関数を呼びます。`($number - 1) * $step` が、その窓の開始位置です。`slice(開始位置, $size)` で窓を 1 つ切り出し、結果を新しいコレクションとして返します。

具体的に `[1, 2, 3, 4, 5]` に窓 3、ずらし 1 を適用すると、`[1,2,3]`、`[2,3,4]`、`[3,4,5]` の 3 つができます。

## ここがすごい

### 窓の数を式 1 つで求めている

窓の数を求めるのに、ループを回して数えるのではなく、`floor((n - size) / step) + 1` という式で直接計算しています。こうすると、要素数が何万あっても一瞬で窓の数がわかります。`floor` を使うことで、ずらし幅が割り切れない場合も、最後の不完全な窓を作らずに済みます。

### 「何番目の窓か」だけを持って切り出す

窓の位置は、番号 `$number` から `($number - 1) * $step` で計算しています。前の窓の結果を覚えておく必要がなく、どの窓も独立に作れます。そのため、`times` の中で順番に呼ばれても、途中から取り出しても、同じ結果になります。

### 配列ではなく「元の並び」を読み直す

`slice` は元のコレクションから必要な範囲だけを取り出します。窓ごとに全部の要素をコピーするのではなく、必要な範囲を指定するだけなので、無駄な複製が少なくて済みます。

## まとめ

- 窓付きの切り出しは、窓の数を式で求めると、ループ不要で数えられる。
- 窓の開始位置を番号から計算すると、どの窓も独立に作れる。
- 引数の下限は最初に確かめておくと、無限ループや空の結果を防げる。
- 「重なり」は窓の大きさとずらし幅の差で決まる。
