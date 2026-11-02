---
title: "最後の処理に、例外を受け止める関門を付ける"
description: "Laravel の Pipeline::prepareDestination は、パイプラインの最後に呼ばれる処理を、例外を受け止める関数で包みます。例外は専用の処理に渡され、パイプラインの外へ直接飛び出しません。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Pipeline/Pipeline.php
lines: [176, 185]
function: Pipeline::prepareDestination
difficulty: 2
format: 2
tags: [エラー処理, 設計パターン, クロージャ]
---

## ひとことで

`prepareDestination` は、パイプラインの **一番最後に呼ばれる処理**（目的地）を、**例外を受け止める形に包み直す** 関数です。最後の処理で例外が起きても、Laravel の例外の処理に任せられます。

## コード

```php:line-numbers=176
    protected function prepareDestination(Closure $destination)
    {
        return function ($passable) use ($destination) {
            try {
                return $destination($passable);
            } catch (Throwable $e) {
                return $this->handleException($passable, $e);
            }
        };
    }
```

## 前提知識

- **目的地（デスティネーション）**: パイプラインの処理をすべて通ったあとに、最後に呼ばれる関数です。
- **`try ... catch`**: 例外が起きたときに、それを受け止めて別の処理に移る書き方です。
- **`Throwable`**: PHP の例外とエラーの共通の型です。`Exception` より広い範囲を受け止められます。
- **無名関数の `use`**: 外側の `$destination` を取り込んで、後で呼べるようにする書き方です。
- **`handleException`**: 受け止めた例外を、どう扱うかを決めるメソッドです。

## 何をしているか

### 1. 目的地を、包んだ関数として返す

```php:line-numbers=178
        return function ($passable) use ($destination) {
```

`prepareDestination` は、`$destination` をそのまま返すのではなく、それを呼ぶ新しい無名関数を返します。`use` で `$destination` を取り込んでいるので、後で呼ばれたときに元の処理が使えます。

### 2. 呼び出しを `try` で囲む

```php:line-numbers=179
            try {
                return $destination($passable);
            } catch (Throwable $e) {
                return $this->handleException($passable, $e);
            }
```

目的地の関数を `try` の中で呼びます。成功すれば、その結果をそのまま返します。

### 3. 例外は、専用の処理に渡す

```php:line-numbers=181
            } catch (Throwable $e) {
                return $this->handleException($passable, $e);
```

`Throwable` の例外が起きたら、`handleException` に、処理の対象（`$passable`）と例外を渡します。そこで例外の扱いを決めて、その結果を返します。

つまり、目的地で起きた例外は、パイプラインの外へ投げられることなく、ここで受け止められます。

## ここがすごい

### 例外の扱いを、1 か所に集める

パイプラインの途中にある処理では、例外は外側の仕組みに任せられます。しかし最後の処理は、結果がそのまま呼び出し元に返る場所です。ここで `try` で囲んでおけば、例外の扱いを `handleException` に一本化できます。

### 包むことで、呼び出し元の形を変えない

```php:line-numbers=178
        return function ($passable) use ($destination) {
```

包んだ関数も、もとの処理と同じように「入力を受け取り、結果を返す」形です。パイプラインの中から見ると、何も変わりません。外側の部品を入れ替えても、流れが壊れない設計です。

### 「受け止める」と「処理する」を分けている

例外を受け止めるのは、この関数の仕事です。どう処理するかは `handleException` に任せています。役割を分けておくと、処理の方針を変えたいときに、この関数を触らずに済みます。

## まとめ

- 最後の処理を包むと、例外の扱いを 1 か所に集められる。
- 包んだ関数の形を元と同じにすると、呼び出し側の変更が要らない。
- 受け止める仕組みと、処理の方針は別々にすると変更しやすい。
- 例外を受け止める範囲は、`Throwable` にすると漏れが少ない。
