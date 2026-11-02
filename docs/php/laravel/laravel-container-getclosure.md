---
title: "「サービスを作る方法」を、後で呼べる無名関数として保存する"
description: "Laravel のサービスコンテナは、登録時に「どうやって作るか」を無名関数にして保存します。実際に必要になるまで作らず、同じクラス名なら直接組み立てる、という分岐を持ちます。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Container/Container.php
lines: [404, 415]
function: Container::getClosure
difficulty: 2
format: 2
tags: [設計パターン, クロージャ, メタプログラミング]
---

## ひとことで

`getClosure` は、サービスコンテナに登録されたクラスを **作るための関数**（クロージャ）を組み立てる関数です。登録した時点では作らず、必要になったときにだけ、この関数が呼ばれて実際のオブジェクトを作ります。

## コード

```php:line-numbers=404
    protected function getClosure($abstract, $concrete)
    {
        return function ($container, $parameters = []) use ($abstract, $concrete) {
            if ($abstract == $concrete) {
                return $container->build($concrete);
            }

            return $container->resolve(
                $concrete, $parameters, raiseEvents: false
            );
        };
    }
```

## 前提知識

- **サービスコンテナ**: 依存するオブジェクトの作り方を登録しておき、必要なときに組み立ててくれる仕組みです。
- **束縛（バインド）**: 名前と「作り方」を結びつけることです。`bind` で登録します。
- **無名関数（クロージャ）**: その場で作って、あとで呼べる関数です。作った時点の変数を取り込めます。
- **`build`**: クラスを、コンストラクタの引数を注入しながら組み立てるメソッドです。
- **`resolve`**: 名前から、登録された作り方を使ってオブジェクトを取り出すメソッドです。

## 何をしているか

### 1. 作るときに、名前と作り方を取り込む

```php:line-numbers=406
        return function ($container, $parameters = []) use ($abstract, $concrete) {
```

返す無名関数は、`$abstract`（登録した名前）と `$concrete`（作り方）を `use` で取り込んでいます。登録の時点の値を保存しておくので、後から変わることがありません。

### 2. 名前と作り方が同じなら、直接組み立てる

```php:line-numbers=407
            if ($abstract == $concrete) {
                return $container->build($concrete);
            }
```

登録した名前と作り方が同じクラス名なら、それは「そのクラスを自動で作ってほしい」という意味です。`$container->build($concrete)` で、コンストラクタの引数を自動で用意しながら組み立てます。

### 3. それ以外は、作り方の名前を解決する

```php:line-numbers=411
            return $container->resolve(
                $concrete, $parameters, raiseEvents: false
            );
```

作り方が別の名前（別のクラスや登録済みのサービス）なら、`resolve` でそれを取り出します。`raiseEvents: false` は、この取り出しで解決のイベントを発生させないことを表します。

## ここがすごい

### 作ることを、先延ばしにしている

サービスを登録するたびに作ってしまうと、使われないサービスまで組み立てることになり、無駄が増えます。この関数は作り方だけを無名関数に閉じ込めて返します。実際に作るのは、必要になったときだけです。

### 同じ名前なら、特別な分岐で済ませる

登録の名前と作り方が同じなら、「自動で組み立てる」と判断します。利用者は `bind(Foo::class)` と書くだけで、クラスを登録できます。分岐 1 つで、よくある書き方を短くしています。

### 名前付き引数で、意図を読み手に示す

`raiseEvents: false` と名前を付けて渡しているので、真偽値が何を意味するかが一目でわかります。引数が多い関数では、この書き方が読みやすさに効いてきます。

## まとめ

- 作り方を保存しておき、必要なときだけ作ると、無駄な組み立てを防げる。
- 同じ名前の登録を特別扱いすると、よくある書き方を短く書ける。
- 無名関数で作った時点の値を取り込むと、後から変わらない。
- 真偽値の引数は、名前を付けて渡すと意図が伝わる。
