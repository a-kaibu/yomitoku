---
title: "n 個おきに要素を取り出すための、剰余の数え方"
description: "Laravel の Collection::nth は、コレクションから「3 個おきに」のように間隔をあけて要素を取り出します。剰余 % を使って位置を判定する、簡潔な書き方です。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Collection.php
lines: [971, 990]
function: Collection::nth
difficulty: 1
format: 2
tags: [アルゴリズム, イテレータ, 数値計算]
---

## ひとことで

`nth` は、コレクションの要素を **一定の間隔ごとに** 取り出します。`nth(3)` なら、1 番目、4 番目、7 番目……の要素が残ります。サンプルの間引きや、交互のデータの振り分けに使えます。

## コード

```php:line-numbers=971
    public function nth($step, $offset = 0)
    {
        if ($step < 1) {
            throw new InvalidArgumentException('Step value must be at least 1.');
        }

        $new = [];

        $position = 0;

        foreach ($this->slice($offset)->items as $item) {
            if ($position % $step === 0) {
                $new[] = $item;
            }

            $position++;
        }

        return $this->newInstance($new);
    }
```

## 前提知識

- **剰余（%）**: 割り算の余りです。`7 % 3` は `1` です。余りが 0 かどうかで、「割り切れるか」を判定できます。
- **`slice($offset)`**: 指定した位置から後ろの要素を取り出すコレクションの操作です。
- **`newInstance`**: 同じ種類のコレクションを、新しい中身で作るメソッドです。
- **`InvalidArgumentException`**: 引数が正しくないときに投げる PHP の標準の例外です。

## 何をしているか

### 1. 間隔が正しいかを確かめる

```php:line-numbers=973
        if ($step < 1) {
            throw new InvalidArgumentException('Step value must be at least 1.');
        }
```

`$step` が 1 より小さいと、「0 個おき」のような意味のない指定になるので、例外にします。

### 2. 開始位置をずらして、要素を順に見る

```php:line-numbers=977
        $new = [];

        $position = 0;

        foreach ($this->slice($offset)->items as $item) {
```

`slice($offset)` で、開始位置より後ろの要素だけを残します。`$offset` は既定値が 0 なので、何も指定しなければ先頭から見ます。

### 3. 位置が間隔の倍数なら、取り出す

```php:line-numbers=982
            if ($position % $step === 0) {
                $new[] = $item;
            }

            $position++;
        }
```

`$position` は、今見ている要素の番号（0 から始まる）です。`$position % $step === 0` なら、その要素は取り出す対象です。`$position++` で、次の要素の番号に進みます。

具体例として `['a','b','c','d','e','f','g']` に `nth(3)` を適用すると、番号 0、3、6 の `a`、`d`、`g` が残ります。

```php:line-numbers=989
        return $this->newInstance($new);
```

最後に、残った要素を新しいコレクションとして返します。

## ここがすごい

### 割り算の余りだけで、「何番目か」を判定している

間隔をあけて取り出す処理は、「番号を 3 で割った余りが 0 か」という 1 つの条件で書けます。`$position` を数えておくだけで、余計な添字の計算がいりません。とても短い書き方です。

### 開始位置を先に切ってから数える

`slice($offset)` で先頭を切ってから数えるので、数える番号は常に 0 から始まります。`offset` と `step` の組み合わせを、呼び出し側が自由に決められるのは、この順番のおかげです。

### 1 行の条件が、そのまま読み手の意図になる

`$position % $step === 0` は、「間隔の倍数の位置」と読めます。コードを読んだ人が、そのまま意味を理解できる書き方です。

## まとめ

- 間隔をあけた取り出しは、番号の剰余が 0 かどうかで判定できる。
- 開始位置を先に切ると、数える番号が 0 から始まって分かりやすい。
- 意味のない間隔（0 以下）は、最初に例外で弾くと安全。
- 条件式は、その意図が読み取れる形にすると保守しやすい。
