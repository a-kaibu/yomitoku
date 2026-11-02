---
title: "省略できる部分つきのルートを、全パターンに展開する"
description: "FastRoute の RouteParser は、/user[/{id}] のように [ ] で囲まれた省略可能な部分を持つルートを、省略する・しないのすべての組み合わせに展開します。ブラケットの数を照合して、書き間違いも見つけます。"
language: php
project: FastRoute
repo: https://github.com/nikic/FastRoute
license: BSD-3-Clause
copyright: Copyright (c) 2013 by Nikita Popov.
commit: "1c961398bef1ff6ecd8b273bef651d7afe90312b"
file: src/RouteParser/Std.php
lines: [59, 90]
function: Std::parse
difficulty: 3
format: 2
tags: [パース, 正規表現, API設計]
---

## ひとことで

`Std::parse` は、Web のルート定義（URL の形）`/user[/{id}]` を読んで、**省略する場合と省略しない場合の組み合わせ** に展開します。`[` と `]` で囲まれた部分は省略できる、という書き方を、ルーターが扱える形に直す関数です。

## コード

::: code-group

```php:line-numbers=59 [日本語訳]
    public function parse(string $route): array
    {
        $routeWithoutClosingOptionals = rtrim($route, ']');
        $numOptionals = strlen($route) - strlen($routeWithoutClosingOptionals);

        // [ で分けるが、プレースホルダーの中は飛ばす
        $segments = preg_split('~' . self::VARIABLE_REGEX . '(*SKIP)(*F) | \[~x', $routeWithoutClosingOptionals);
        assert(is_array($segments));

        if ($numOptionals !== count($segments) - 1) {
            // 途中に ] があれば、もっと詳しいエラーメッセージを出す
            if (preg_match('~' . self::VARIABLE_REGEX . '(*SKIP)(*F) | \]~x', $routeWithoutClosingOptionals) === 1) {
                throw new BadRouteException('Optional segments can only occur at the end of a route');
            }

            throw new BadRouteException("Number of opening '[' and closing ']' does not match");
        }

        $currentRoute = '';
        $parsedRoutes = [];

        foreach ($segments as $n => $segment) {
            if ($segment === '' && $n !== 0) {
                throw new BadRouteException('Empty optional part');
            }

            $currentRoute .= $segment;
            $parsedRoutes[] = $this->parsePlaceholders($currentRoute);
        }

        return $parsedRoutes;
    }
```

```php:line-numbers=59 [原文]
    public function parse(string $route): array
    {
        $routeWithoutClosingOptionals = rtrim($route, ']');
        $numOptionals = strlen($route) - strlen($routeWithoutClosingOptionals);

        // Split on [ while skipping placeholders
        $segments = preg_split('~' . self::VARIABLE_REGEX . '(*SKIP)(*F) | \[~x', $routeWithoutClosingOptionals);
        assert(is_array($segments));

        if ($numOptionals !== count($segments) - 1) {
            // If there are any ] in the middle of the route, throw a more specific error message
            if (preg_match('~' . self::VARIABLE_REGEX . '(*SKIP)(*F) | \]~x', $routeWithoutClosingOptionals) === 1) {
                throw new BadRouteException('Optional segments can only occur at the end of a route');
            }

            throw new BadRouteException("Number of opening '[' and closing ']' does not match");
        }

        $currentRoute = '';
        $parsedRoutes = [];

        foreach ($segments as $n => $segment) {
            if ($segment === '' && $n !== 0) {
                throw new BadRouteException('Empty optional part');
            }

            $currentRoute .= $segment;
            $parsedRoutes[] = $this->parsePlaceholders($currentRoute);
        }

        return $parsedRoutes;
    }
```

:::

## 前提知識

- **ルーティング**: URL の形と、それに対応する処理を結びつける仕組みです。`/user/{id}` なら、`{id}` に入る値を取り出して処理に渡します。
- **プレースホルダー**: `{id}` のように、URL の中で値が入る場所を表す書き方です。
- **正規表現**: 文字の並びのパターンを表す書き方です。ここでは `[` や `]` の分割に使っています。
- **`preg_split`**: 正規表現で文字列を区切る関数です。
- **例外（`BadRouteException`）**: 書き方が間違っているルートを、早めに知らせるための例外です。

## 何をしているか

### 1. 末尾の `]` を数え、`[` の数と照合する

::: code-group

```php:line-numbers=61 [日本語訳]
        $routeWithoutClosingOptionals = rtrim($route, ']');
        $numOptionals = strlen($route) - strlen($routeWithoutClosingOptionals);

        // [ で分けるが、プレースホルダーの中は飛ばす
        $segments = preg_split('~' . self::VARIABLE_REGEX . '(*SKIP)(*F) | \[~x', $routeWithoutClosingOptionals);
        assert(is_array($segments));

        if ($numOptionals !== count($segments) - 1) {
            // 途中に ] があれば、もっと詳しいエラーメッセージを出す
            if (preg_match('~' . self::VARIABLE_REGEX . '(*SKIP)(*F) | \]~x', $routeWithoutClosingOptionals) === 1) {
                throw new BadRouteException('Optional segments can only occur at the end of a route');
            }

            throw new BadRouteException("Number of opening '[' and closing ']' does not match");
        }
```

```php:line-numbers=61 [原文]
        $routeWithoutClosingOptionals = rtrim($route, ']');
        $numOptionals = strlen($route) - strlen($routeWithoutClosingOptionals);

        // Split on [ while skipping placeholders
        $segments = preg_split('~' . self::VARIABLE_REGEX . '(*SKIP)(*F) | \[~x', $routeWithoutClosingOptionals);
        assert(is_array($segments));

        if ($numOptionals !== count($segments) - 1) {
            // If there are any ] in the middle of the route, throw a more specific error message
            if (preg_match('~' . self::VARIABLE_REGEX . '(*SKIP)(*F) | \]~x', $routeWithoutClosingOptionals) === 1) {
                throw new BadRouteException('Optional segments can only occur at the end of a route');
            }

            throw new BadRouteException("Number of opening '[' and closing ']' does not match");
        }
```

:::

`rtrim` で末尾の `]` を取り除き、いくつ取り除いたかを `$numOptionals` に覚えます。そのうえで、プレースホルダーの中以外の `[` で文字列を分けます。分けた数が、`]` の数より 1 多ければ、対応がきれいに取れています。

合わないときは、途中に `]` があるかを確かめ、あれば「省略できる部分は末尾だけ」という専用のメッセージを出します。

### 2. 分割の正規表現で、プレースホルダーの中を飛ばす

分割に使っている正規表現は `VARIABLE_REGEX . '(*SKIP)(*F) | \['` という形です。`(*SKIP)(*F)` は、プレースホルダーに当たったら、その部分を「一致しなかったこと」にして先へ進む PCRE の指示です。つまり `{id:[0-9]+}` の中の `[` は分割の対象になりません。

### 3. 途中までのルートを、順に組み立てる

```php:line-numbers=77
        $currentRoute = '';
        $parsedRoutes = [];

        foreach ($segments as $n => $segment) {
            if ($segment === '' && $n !== 0) {
                throw new BadRouteException('Empty optional part');
            }

            $currentRoute .= $segment;
            $parsedRoutes[] = $this->parsePlaceholders($currentRoute);
        }
```

`$segments` を先頭から 1 つずつ足して、`$currentRoute` を少しずつ長くします。そのたびに `parsePlaceholders` で、プレースホルダーの部分を解析します。空の省略部分（`[]`）はエラーにします。

具体例として `/user[/{id}]` は、`/user` と `/user/{id}` の 2 つに展開されます。省略しない `/user` と、省略した `/user/{id}` の両方が登録できるわけです。

## ここがすごい

### 正規表現の「飛ばす」指示で、中身を壊さない

`[` を探すだけなら簡単ですが、`{id:[0-9]+}` のように正規表現の中にも `[` が現れます。これを省略の記号と間違えると、ルートが壊れます。`(*SKIP)(*F)` を使えば、プレースホルダーを一度に読み飛ばせます。書き方が難しい代わりに、分割のルールを 1 行に収めています。

### 展開を「先頭から足す」で表す

省略部分の組み合わせを、すべて手で書き出すと、数が増えると大変です。この関数は、先頭から 1 つずつ足していけば、途中の結果がそのまま 1 つの展開になります。省略の段数に応じて、自然に全パターンが得られます。

### 書き間違いを、具体的なメッセージで伝える

`]` の数が合わないときに、「省略部分は末尾だけ」という理由を伝えています。開発者はどこを直せばよいかがわかります。ルートの書き間違いは、アプリの起動時に気づけるのが理想なので、エラーの内容を具体的にしておく価値があります。

## まとめ

- 省略できる部分は、先頭から 1 段ずつ足していくと、全パターンを順に作れる。
- 正規表現の `(*SKIP)(*F)` で、特定の部分を読み飛ばせる。
- 括弧の数を照合すると、書き間違いを早く見つけられる。
- エラーには、どこが悪いかの理由を書くと直しやすい。
