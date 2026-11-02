---
title: "URL の {id} を、名前と正規表現の組に読み分ける"
description: "FastRoute の parsePlaceholders は、/user/{id:\\d+} のような URL の一部を、固定の文字と「名前と正規表現」の組に分けます。同じ名前の二重定義や、キャプチャグループの使用を禁止して、ルーティングを守ります。"
language: php
project: FastRoute
repo: https://github.com/nikic/FastRoute
license: BSD-3-Clause
copyright: Copyright (c) 2013 by Nikita Popov.
commit: "1c961398bef1ff6ecd8b273bef651d7afe90312b"
file: src/RouteParser/Std.php
lines: [97, 136]
function: Std::parsePlaceholders
difficulty: 3
format: 2
tags: [パース, 正規表現, API設計]
---

## ひとことで

`parsePlaceholders` は、1 つのルートの文字列を、**固定の部分**（`/user/`）と **プレースホルダー**（`{id:\d+}`）に分けて返す関数です。ルーターは、この分け方をもとに URL と照合します。

## コード

```php:line-numbers=97
    private function parsePlaceholders(string $route): array
    {
        if ((int) preg_match_all('~' . self::VARIABLE_REGEX . '~x', $route, $matches, PREG_OFFSET_CAPTURE | PREG_SET_ORDER) === 0) {
            return [$route];
        }

        $offset = 0;
        $routeData = [];

        $parsedVariableNames = [];

        foreach ($matches as $set) {
            if ($set[0][1] > $offset) {
                $routeData[] = substr($route, $offset, $set[0][1] - $offset);
            }

            if (in_array($set[1][0], $parsedVariableNames, true)) {
                throw BadRouteException::placeholderAlreadyDefined($set[1][0]);
            }

            if (isset($set[2])) {
                $this->guardAgainstCapturingGroupUsage(trim($set[2][0]), $set[1][0]);
            }

            $parsedVariableNames[] = $set[1][0];

            $routeData[] = [
                $set[1][0],
                isset($set[2]) ? trim($set[2][0]) : self::DEFAULT_DISPATCH_REGEX,
            ];

            $offset = $set[0][1] + strlen($set[0][0]);
        }

        if ($offset !== strlen($route)) {
            $routeData[] = substr($route, $offset);
        }

        return $routeData;
    }
```

## 前提知識

- **キャプチャグループ `(...)`**: 正規表現で一致した部分を取り出すための括弧です。
- **`PREG_OFFSET_CAPTURE`**: 一致した位置（何文字目か）も一緒に取り出すオプションです。
- **`PREG_SET_ORDER`**: 一致を 1 件ずつ配列にして、順番に返すオプションです。
- **`in_array(..., true)`**: 型も含めて完全一致する値が、配列にあるかを調べる関数です。
- **`BadRouteException::placeholderAlreadyDefined`**: 同じ名前が 2 回使われたときの専用の例外を作る関数です。

## 何をしているか

### 1. プレースホルダーを、位置つきで全部探す

```php:line-numbers=99
        if ((int) preg_match_all('~' . self::VARIABLE_REGEX . '~x', $route, $matches, PREG_OFFSET_CAPTURE | PREG_SET_ORDER) === 0) {
            return [$route];
        }
```

`preg_match_all` で、ルートの中のプレースホルダーを全部見つけます。`PREG_OFFSET_CAPTURE` で位置も、`PREG_SET_ORDER` で 1 件ずつの配列も受け取ります。見つからなければ、ルート全体を 1 つの固定文字列として返します。

### 2. 前の位置から今の位置までを、固定文字として取り出す

```php:line-numbers=103
        $offset = 0;
        $routeData = [];

        $parsedVariableNames = [];

        foreach ($matches as $set) {
            if ($set[0][1] > $offset) {
                $routeData[] = substr($route, $offset, $set[0][1] - $offset);
            }
```

`$offset` は、前に読み終えた場所です。プレースホルダーの手前に固定の文字があれば、`substr` で切り出して `$routeData` に入れます。

### 3. 名前の重複と、キャプチャグループを確かめる

```php:line-numbers=113
            if (in_array($set[1][0], $parsedVariableNames, true)) {
                throw BadRouteException::placeholderAlreadyDefined($set[1][0]);
            }

            if (isset($set[2])) {
                $this->guardAgainstCapturingGroupUsage(trim($set[2][0]), $set[1][0]);
            }

            $parsedVariableNames[] = $set[1][0];
```

同じ名前が 2 回出てきたら、例外にします。`{id}` が 2 つあると、どちらの値か決められないからです。さらに、正規表現の部分にキャプチャグループ（括弧）があれば、`guardAgainstCapturingGroupUsage` で止めます。

### 4. 名前と正規表現の組を入れる

```php:line-numbers=123
            $routeData[] = [
                $set[1][0],
                isset($set[2]) ? trim($set[2][0]) : self::DEFAULT_DISPATCH_REGEX,
            ];

            $offset = $set[0][1] + strlen($set[0][0]);
        }

        if ($offset !== strlen($route)) {
            $routeData[] = substr($route, $offset);
        }
```

プレースホルダーは `[名前, 正規表現]` の配列として入れます。正規表現が書かれていなければ、既定のパターンを使います。最後に、残りの固定文字を追加して、結果を返します。

具体例として `/user/{id:\d+}` は、`'/user/'` と `['id', '\d+']` の 2 要素になります。

## ここがすごい

### 固定の文字と、変わる部分を、同じ配列の中で並べる

ルートを「文字列」と「[名前, 正規表現]」の並びとして表すと、後の処理（URL との照合、正規表現の組み立て）が、単純な繰り返しで書けます。文字列と変数が混ざった形を、そのままデータとして持つ工夫です。

### キャプチャグループを禁止する理由

FastRoute は、すべてのルートを 1 つの大きな正規表現にまとめて、一致した番号で判定します。利用者の正規表現に括弧があると、番号がずれて別のルートに当たってしまいます。ここで禁止しておくことで、ルーターの仕組みが守られます。

### 位置を使って、一度だけ読む

`PREG_OFFSET_CAPTURE` で位置を取り、`$offset` を進めていくので、文字列の同じ場所を二度読みません。読み終わったところを記録する、というシンプルな仕組みです。

## まとめ

- URL の一部を変数として読むには、固定の文字と変数を並べたデータに分けると扱いやすい。
- 一致の位置を取り出せば、固定の部分を正確に切り出せる。
- 同じ名前の重複や、番号を乱す括弧は、早めに禁止すると安全。
- 既定の正規表現を用意しておくと、書き手が省略しても動く。
