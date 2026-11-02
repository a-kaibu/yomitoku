---
title: 文字の種類を必ず 1 つずつ入れて、ランダムなパスワードを作る
description: Laravel の Str::password は、英字・数字・記号などを組み合わせた強いパスワードを作ります。選んだ文字の種類は、必ず最低 1 文字ずつ入るように工夫されています。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Support/Str.php
lines: [1097, 1136]
function: Str::password
difficulty: 3
format: 2
tags: [乱数, セキュリティ, 防御的プログラミング]
---

## ひとことで

`Str::password` は、英字、数字、記号、空白などを組み合わせた **ランダムなパスワード** を作ります。初期パスワードや、一時的な合言葉を作るときに使われます。種類を選ぶ引数で、使う文字の集まりを切り替えられます。

## コード

```php:line-numbers=1097
    public static function password($length = 32, $letters = true, $numbers = true, $symbols = true, $spaces = false)
    {
        $password = new Collection();

        $options = (new Collection([
            'letters' => $letters === true ? [
                'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
                'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
                'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G',
                'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
                'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
            ] : null,
            'numbers' => $numbers === true ? [
                '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            ] : null,
            'symbols' => $symbols === true ? [
                '~', '!', '#', '$', '%', '^', '&', '*', '(', ')', '-',
                '_', '.', ',', '<', '>', '?', '/', '\\', '{', '}', '[',
                ']', '|', ':', ';',
            ] : null,
            'spaces' => $spaces === true ? [' '] : null,
        ]))
            ->filter();

        if ($options->isEmpty()) {
            throw new InvalidArgumentException('At least one character pool must be enabled.');
        }

        $allCharacters = $options->flatten();

        $options->shuffle()
            ->take(max(0, $length))
            ->each(fn ($c) => $password->push($c[random_int(0, count($c) - 1)]));

        $length = max(0, $length - $password->count());

        return $password->merge($allCharacters->pipe(
            fn ($c) => Collection::times($length, fn () => $c[random_int(0, $c->count() - 1)])
        ))->shuffle()->implode('');
    }
```

## 前提知識

- **文字の集まり（プール）**: 英字、数字、記号など、パスワードに使ってよい文字の一覧です。
- **`random_int`**: 暗号に使えるほど予測しにくい乱数を、指定の範囲の整数で返す PHP の関数です。
- **`shuffle`**: 配列の順番をランダムに並べ替えることです。
- **`filter()`**: 空の要素（`null` など）を取り除くコレクションの操作です。
- **`InvalidArgumentException`**: 引数が正しくないときに投げる例外です。

## 何をしているか

### 1. 使う文字の集まりを決める

```php:line-numbers=1101
        $options = (new Collection([
            'letters' => $letters === true ? [
                'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
                'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
                'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G',
                'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
                'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
            ] : null,
            'numbers' => $numbers === true ? [
                '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            ] : null,
            'symbols' => $symbols === true ? [
                '~', '!', '#', '$', '%', '^', '&', '*', '(', ')', '-',
                '_', '.', ',', '<', '>', '?', '/', '\\', '{', '}', '[',
                ']', '|', ':', ';',
            ] : null,
            'spaces' => $spaces === true ? [' '] : null,
        ]))
            ->filter();
```

英字、数字、記号、空白のそれぞれについて、使うかどうかを引数で決めます。使わない集まりは `null` にしておき、最後に `filter()` で取り除きます。1 つも残らなければ、例外にします。

### 2. 各集まりから、最低 1 文字ずつ選ぶ

```php:line-numbers=1125
        $allCharacters = $options->flatten();

        $options->shuffle()
            ->take(max(0, $length))
            ->each(fn ($c) => $password->push($c[random_int(0, count($c) - 1)]));
```

すべての文字を 1 つにまとめた `$allCharacters` を作ります。そのうえで、集まりの順番をランダムに並べ替え、先頭から必要な数だけ取り出します。取り出した集まりごとに、ランダムな 1 文字を `$password` に入れます。

### 3. 残りを、全部の文字からランダムに埋める

```php:line-numbers=1131
        $length = max(0, $length - $password->count());

        return $password->merge($allCharacters->pipe(
            fn ($c) => Collection::times($length, fn () => $c[random_int(0, $c->count() - 1)])
        ))->shuffle()->implode('');
```

すでに入れた文字の数を引いた残りの長さを求めます。残りは `$allCharacters` の中からランダムに選んで追加し、最後に全体をもう一度並べ替えてから、1 つの文字列にします。

具体例として、長さ 8 で英字・数字・記号を使うと、3 つの集まりから 1 文字ずつ入り、残り 5 文字はすべての文字からランダムに選ばれます。

## ここがすごい

### 「種類が必ず入る」を、順番で保証している

ランダムに文字を選ぶだけだと、数字が 1 つも入らない、というパスワードができることがあります。この関数は、まず使う種類ごとに 1 文字を入れてから残りを埋めます。だから、英字・数字・記号を指定したら、必ず全部の種類が含まれます。

### 暗号用の乱数を使う

```php:line-numbers=1129
            ->each(fn ($c) => $password->push($c[random_int(0, count($c) - 1)]));
```

`random_int` は暗号に使える乱数です。パスワードは推測されると危険なので、`rand` のような予測しやすい乱数ではなく、この関数を使っています。

### コレクションの連鎖で、手順を読みやすく

並べ替え、取り出し、追加、結合という手順が、コレクションのメソッドをつないで書かれています。上から読めば、何をしているかがそのまま分かります。

## まとめ

- 強いパスワードは、使う文字の種類ごとに 1 文字ずつ入れると、偏りを防げる。
- ランダムな値は、暗号用の乱数（`random_int`）で作ると安全。
- 手順は、コレクションのメソッドをつなぐと上から読める。
- 空の指定は取り除いてから判定すると、バグを防げる。
