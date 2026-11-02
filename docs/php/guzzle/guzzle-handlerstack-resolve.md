---
title: "玉ねぎの皮のように、ミドルウェアを内側から包んで組み立てる"
description: "Guzzle の HandlerStack::resolve は、登録されたミドルウェアを逆順に包んでいき、1 つの通信関数を組み立てます。組み立て結果は覚えておき、2 回目からは再利用します。"
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling <mtdowling@gmail.com>
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/HandlerStack.php
lines: [200, 227]
function: HandlerStack::resolve
difficulty: 3
format: 2
tags: [設計パターン, 関数型, キャッシュ]
---

## ひとことで

`HandlerStack::resolve` は、登録しておいた複数のミドルウェアを **1 つの通信関数に組み立てる** 関数です。玉ねぎの皮のように、内側の処理を外側の部品が包んでいきます。組み立ては最初の 1 回だけ行い、結果を覚えておきます。

## コード

```php:line-numbers=200
    public function resolve(): callable
    {
        if ($this->cached === null) {
            if (($prev = $this->handler) === null) {
                throw new \LogicException('No handler has been specified');
            }

            if (!\is_callable($prev)) {
                throw new \LogicException('Handler must be callable');
            }

            foreach (\array_reverse($this->stack) as $fn) {
                if (!\is_array($fn) || !\array_key_exists(0, $fn) || !\is_callable($fn[0])) {
                    throw new \LogicException('Middleware must be callable');
                }

                $prev = $fn[0]($prev);

                if (!\is_callable($prev)) {
                    throw new \LogicException('Middleware must return a callable');
                }
            }

            $this->cached = $prev;
        }

        return $this->cached;
    }
```

## 前提知識

- **ハンドラースタック**: ミドルウェアを順番に登録しておく入れ物です。`push` や `unshift` で追加します。
- **包む（ラップ）**: 関数を別の関数の中に入れて、前後に処理を足すことです。
- **`array_reverse`**: 配列の順番を逆にする関数です。
- **`null` と `is_callable`**: `null` は「まだない」、`is_callable` は「関数として呼べるか」を確かめる関数です。
- **`LogicException`**: 使い方の間違いを示す例外です。

## 何をしているか

### 1. 最初に、通信の本体を確かめる

```php:line-numbers=202
        if ($this->cached === null) {
            if (($prev = $this->handler) === null) {
                throw new \LogicException('No handler has been specified');
            }

            if (!\is_callable($prev)) {
                throw new \LogicException('Handler must be callable');
            }
```

`$this->cached` が `null`、つまりまだ組み立てていないときだけ、組み立てを行います。まず、最後に呼ばれる本体（`handler`）があるかと、呼べる関数かを確かめます。

### 2. 逆順に、1 つずつ包んでいく

```php:line-numbers=211
            foreach (\array_reverse($this->stack) as $fn) {
                if (!\is_array($fn) || !\array_key_exists(0, $fn) || !\is_callable($fn[0])) {
                    throw new \LogicException('Middleware must be callable');
                }

                $prev = $fn[0]($prev);

                if (!\is_callable($prev)) {
                    throw new \LogicException('Middleware must return a callable');
                }
            }
```

`array_reverse($this->stack)` で、登録の逆の順に並べます。最後に登録されたものから包み始めるので、結果として最初に登録されたものが一番外側になります。

`$prev = $fn[0]($prev);` は、今の処理（`$prev`）を、ミドルウェア（`$fn[0]`）に渡して、包んだ新しい関数を得ています。その結果を次の `$prev` にします。

### 3. 組み立てた結果を覚えて返す

```php:line-numbers=223
            $this->cached = $prev;
        }

        return $this->cached;
```

最後の関数を `$this->cached` に入れて返します。次に `resolve` が呼ばれたときは、組み立てずに同じ関数を返します。

## ここがすごい

### 「登録の逆順で包む」ことで、登録の順番が外から内へ並ぶ

先に登録したものを一番外側にするために、逆順で包んでいます。たとえば、ログ、再試行、認証の順に登録すると、通信の流れは「ログが最初に見て、認証がその次に…」となり、登録の順番と同じ順番で処理が通ります。逆順にすることで、登録する人の直感と処理の順番が一致します。

### 組み立てを、初回に 1 回だけ行う

```php:line-numbers=202
        if ($this->cached === null) {
```

通信のたびに組み立て直すと、無駄な処理が増えます。`$this->cached` が残っていれば、以後はそれを返すだけです。ミドルウェアの登録は最初に済ませ、通信を何百回しても組み立ては 1 回で済みます。

### 不正な部品を、組み立ての時点で弾く

各ミドルウェアが関数を返すかを、包むたびに確かめています。問題があれば、通信を始める前に例外になるので、原因がすぐにわかります。

## まとめ

- 複数の処理を包んで組み立てるときは、登録の逆順に包むと、登録順どおりに実行される。
- 組み立ての結果を覚えておけば、毎回の通信で組み立て直す必要がない。
- 部品は、組み立ての時点で確かめておくと、エラーの原因を早く見つけられる。
- 玉ねぎの皮のように、外側が内側を包む形は、前後の処理を挟む仕組みと相性がよい。
