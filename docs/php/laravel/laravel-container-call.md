---
title: "呼び出しの途中で、循環した依存をたどらないようにする"
description: "Laravel のサービスコンテナの call は、クラスのメソッドを依存性の注入つきで呼び出します。呼び出し中のクラスをスタックに積んで、finally で必ず外す仕組みが見どころです。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Container/Container.php
lines: [788, 809]
function: Container::call
difficulty: 3
format: 2
tags: [設計パターン, エラー処理, メタプログラミング]
---

## ひとことで

`Container::call` は、`'Ami@handle'` のようなメソッドを、**必要な引数を自動で用意して呼び出す** 関数です。Laravel のサービスコンテナが、コンストラクタやメソッドの引数に型を書くだけで必要なオブジェクトを渡せる仕組みの一部です。

## コード

```php:line-numbers=788
    public function call($callback, array $parameters = [], $defaultMethod = null)
    {
        $pushedToBuildStack = false;

        if (($className = $this->getClassForCallable($callback)) && ! in_array(
            $className,
            $this->buildStack,
            true
        )) {
            $this->buildStack[] = $className;

            $pushedToBuildStack = true;
        }

        try {
            return BoundMethod::call($this, $callback, $parameters, $defaultMethod);
        } finally {
            if ($pushedToBuildStack) {
                array_pop($this->buildStack);
            }
        }
    }
```

## 前提知識

- **依存性の注入（DI）**: 必要なオブジェクトを、使う側が自分で作らずに外から受け取る設計です。
- **サービスコンテナ**: 依存関係を登録して、必要なときに組み立ててくれる仕組みです。
- **`try ... finally`**: 途中で例外が起きても、`finally` の中の後始末が必ず実行される書き方です。
- **`array_pop`**: 配列の最後の要素を取り出して、削除する関数です。
- **`in_array(..., true)`**: 厳密な比較（型まで同じか）で、配列に値があるかを調べる関数です。

## 何をしているか

### 1. 呼び出し中のクラスを、スタックに積む

```php:line-numbers=790
        $pushedToBuildStack = false;

        if (($className = $this->getClassForCallable($callback)) && ! in_array(
            $className,
            $this->buildStack,
            true
        )) {
            $this->buildStack[] = $className;

            $pushedToBuildStack = true;
        }
```

`getClassForCallable` で、呼び出し先のクラス名を取り出します。そのクラスがまだ `$buildStack` になければ、積んで `$pushedToBuildStack` を `true` にします。すでに入っていれば、積まずに進みます。

`buildStack` は「今、どのクラスの組み立ての途中か」を表す一覧です。同じクラスを何度も積まないように、`in_array(..., true)` で確かめています。

### 2. 本体を呼び出す

```php:line-numbers=802
        try {
            return BoundMethod::call($this, $callback, $parameters, $defaultMethod);
```

`try` の中で `BoundMethod::call` に処理を任せます。ここで引数の注入が行われ、メソッドが実行されます。結果はそのまま返します。

### 3. 必ず後始末をする

```php:line-numbers=804
        } finally {
            if ($pushedToBuildStack) {
                array_pop($this->buildStack);
            }
        }
```

`finally` の中で、積んだものを `array_pop` で取り出して外します。メソッドが正常に終わっても、例外が出ても、この後始末は必ず実行されます。

## ここがすごい

### 「今の作業中」を覚えておく、スタックの使い方

組み立ての途中で、別のクラスがさらに組み立てを要求することがあります。そのとき、同じクラスが自分自身を要求し続けると、無限に組み立てが続いてしまいます。`buildStack` に「今作業中のクラス」を積んでおけば、途中の状態を後から確かめられます。

### `finally` で、積んだものを必ず外す

```php:line-numbers=804
        } finally {
            if ($pushedToBuildStack) {
                array_pop($this->buildStack);
            }
        }
```

例外が途中で投げられても、積んだ状態が残ると、次の呼び出しが誤った判定をしてしまいます。`finally` を使うことで、どの終わり方でも必ず後始末されます。`$pushedToBuildStack` のフラグで、積んだものだけを外すのも丁寧な点です。

### 「積んだかどうか」を記録してから外す

最初から全部外す（配列を空にする）と、外側の呼び出しが積んだものまで消えてしまいます。積んだかどうかをフラグで覚えておくことで、自分が積んだものだけを正確に外せます。

## まとめ

- 作業中の状態は、スタックに積んで管理すると、入れ子の処理に強くなる。
- 後始末は `finally` に書くと、例外が起きても取りこぼさない。
- 自分が積んだものだけを外すために、フラグで記録しておくと安全。
- 同じものを重ねて積まないように、重複を確かめると循環を防げる。
