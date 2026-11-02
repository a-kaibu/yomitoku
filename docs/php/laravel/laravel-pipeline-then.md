---
title: "処理の鎖を組み立てて、トランザクションの中で実行する"
description: "Laravel の Pipeline::then は、登録された処理を入れ子のクロージャとして組み立ててから実行します。データベースのトランザクションで包む仕組みと、後始末の finally も一緒に扱います。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Pipeline/Pipeline.php
lines: [128, 143]
function: Pipeline::then
difficulty: 3
format: 2
tags: [関数型, イテレータ, 設計パターン]
---

## ひとことで

`Pipeline::then` は、登録しておいた処理（パイプ）を **順番どおりに連結して 1 つの関数にし、それを実行する** 関数です。ミドルウェアのように「前後に処理を挟む」仕組みの心臓部で、Laravel では HTTP リクエストの処理にも使われています。

## コード

```php:line-numbers=128
    public function then(Closure $destination)
    {
        $pipeline = array_reduce(
            array_reverse($this->pipes()), $this->carry(), $this->prepareDestination($destination)
        );

        try {
            return $this->withinTransaction !== false
                ? $this->getContainer()->make('db')->connection($this->withinTransaction)->transaction(fn () => $pipeline($this->passable))
                : $pipeline($this->passable);
        } finally {
            if ($this->finally) {
                ($this->finally)($this->passable);
            }
        }
    }
```

## 前提知識

- **パイプライン**: 処理を「水道管」のように一列に並べ、データ（passable）を流していく考え方です。各処理は受け取ったデータを次の処理に渡します。
- **`array_reduce`**: 配列の要素を 1 つずつ畳み込んで、最後に 1 つの値にする関数です。ここでは「処理の列」を「1 つの関数」にするために使っています。
- **`array_reverse`**: 配列の順番を逆にします。外側から内側へ包んでいくため、逆順に並べ直す必要があります。
- **`finally`**: `try` の中で例外が起きても、必ず実行される後始末の書き方です。
- **`fn () => ...`**: 1 行で書ける短い無名関数（アロー関数）です。外側の変数を自動で取り込みます。

## 何をしているか

### 1. 処理を後ろから包んで 1 つの関数にする

```php:line-numbers=130
        $pipeline = array_reduce(
            array_reverse($this->pipes()), $this->carry(), $this->prepareDestination($destination)
        );
```

`$this->pipes()` で登録済みの処理の一覧を取り、`array_reverse` で逆順にします。そして `array_reduce` に `$this->carry()` を渡すと、各処理が「次の処理を呼び出す関数」で包まれていきます。最後に残るのは、一番外側の 1 つの関数です。`$this->prepareDestination($destination)` は、最後に呼ばれる本来の処理（目的地）を初期値として与えています。

逆順にするのは、一番外側に **最初の処理** が来るようにするためです。外から包む順番がそのまま実行の順番になります。

### 2. トランザクションの中で実行する

```php:line-numbers=134
        try {
            return $this->withinTransaction !== false
                ? $this->getContainer()->make('db')->connection($this->withinTransaction)->transaction(fn () => $pipeline($this->passable))
                : $pipeline($this->passable);
```

`withinTransaction` が `false` ではないとき、つまりトランザクションが指定されているときは、データベースのトランザクションの中で `$pipeline` を実行します。`transaction(fn () => ...)` は、途中で例外が出たらロールバックし、正常終了したらコミットします。指定がなければ、そのまま `$pipeline($this->passable)` を実行します。

### 3. 最後に必ず後始末をする

```php:line-numbers=138
        } finally {
            if ($this->finally) {
                ($this->finally)($this->passable);
            }
        }
```

`finally` の中では、`finally` に登録されたコールバックを必ず呼びます。成功しても、例外が出ても、どちらでも実行されるのがポイントです。`($this->finally)($this->passable)` と書かれているのは、プロパティに入っているクロージャを直接呼んでいるためです。

## ここがすごい

### 「処理の列」を「入れ子の関数」にしてしまう

パイプラインの素直な実装は、配列の添字を 1 つずつ進めるループかもしれません。しかし Laravel は、処理を **包み込んだ関数** として組み立てています。こうすると、どの処理も「次の処理を呼ぶ関数」という同じ形になり、前後に処理を挟むことが自然にできます。`carry()` という 1 つの関数が、この包み込みを全段で担当しています。

### トランザクションをかぶせるのは、組み立てた後

```php:line-numbers=135
            return $this->withinTransaction !== false
                ? $this->getContainer()->make('db')->connection($this->withinTransaction)->transaction(fn () => $pipeline($this->passable))
                : $pipeline($this->passable);
```

トランザクションは、組み立てた `$pipeline` の全体を包みます。途中の処理をいちいち囲まずに済むので、処理を増やしても書き換えが少なくて済みます。`withinTransaction` が `false` のときは、三項演算子で元の実行に戻る形になっていて、分岐が 1 か所にまとまっています。

### 例外のときも後始末が動く

`try` と `finally` を組み合わせることで、成功でも失敗でも `finally` が動きます。たとえば処理の途中で例外が飛んでも、後始末の処理は取りこぼされません。これは「初期化したものを必ず片づける」という設計を、言語の機能だけで実現したものです。

## まとめ

- 処理の列は、逆順に畳み込むと入れ子の関数（1 つの関数）にできる。
- 処理の前後を挟む仕組みは、包み込みの形で書くと自然に広がる。
- トランザクションのように「全体を包みたい」ものは、組み立てた後に外側で掛けるとよい。
- 後始末は `finally` に書くと、例外のときも確実に実行される。
